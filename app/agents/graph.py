from typing import Literal, Sequence, Dict, Any, List
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import create_react_agent
from langgraph.constants import Send
from pydantic import BaseModel, Field
import uuid

from app.agents.state import TeamState, Task
from app.agents.tools import register_default_tools
from app.agents.tool_registry import registry
from app.core.config import settings
from app.services.cost_service import CostService
from app.services.task_service import TaskService

cost_service = CostService()
task_service = TaskService()

def create_team_graph(business_id: str, main_task_id: str):
    """
    Creates and compiles the LangGraph Multi-Agent Task DAG.
    """
    agents = task_service.list_agents(business_id)
    if not agents:
        raise ValueError("No agents found for this business. Please hire agents first.")
        
    roles = [agent['role'] for agent in agents]
    
    for agent in agents:
        register_default_tools(business_id, agent["role"], agent["id"], main_task_id)
        
    llm = ChatOpenAI(
        model="accounts/fireworks/models/llama-v3-70b-instruct" if settings.FIREWORKS_API_KEY else "gpt-4o", 
        api_key=settings.FIREWORKS_API_KEY or settings.OPENAI_API_KEY,
        base_url="https://api.fireworks.ai/inference/v1" if settings.FIREWORKS_API_KEY else None
    )
    
    # Planner Models
    class TaskPlan(BaseModel):
        description: str = Field(description="Clear description of the sub-task")
        assignee_role: str = Field(description=f"The role to assign this task to. Must be one of: {roles}")
        dependencies: List[str] = Field(default=[], description="List of task IDs that must be completed before this one")
        
    class PlannerOutput(BaseModel):
        new_tasks: List[TaskPlan] = Field(description="New tasks to add to the plan")
        
    planner_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are the Lead Planner. Your goal is to break down the user's overarching objective into a DAG of specific tasks. "
                   "Assign each task to the most appropriate role from: {roles}. "
                   "If tasks can be done in parallel, give them empty dependencies. "
                   "If a task relies on the output of another, list the other task's ID in dependencies. "
                   "Here is the current task graph: {current_tasks}. "
                   "Only generate NEW tasks if they are needed to complete the objective."),
        MessagesPlaceholder(variable_name="messages")
    ])
    
    planner_chain = planner_prompt | llm.with_structured_output(PlannerOutput)
    
    def planner_node(state: TeamState):
        current_tasks = state.get("tasks", {})
        
        # If tasks exist and are running/queued, skip planning to avoid duplicates
        if any(t.status in ["queued", "running"] for t in current_tasks.values()):
            return {} # Skip planning
            
        # Call LLM to see if we need new tasks
        plan = planner_chain.invoke({
            "messages": state["messages"],
            "roles": ", ".join(roles),
            "current_tasks": str([t.model_dump() for t in current_tasks.values()])
        })
        
        new_tasks_dict = {}
        for tp in plan.new_tasks:
            # Map the string ID the LLM generated (or generate a real one if it didn't)
            t_id = str(uuid.uuid4())
            new_task = Task(
                id=t_id,
                description=tp.description,
                assignee_role=tp.assignee_role,
                dependencies=tp.dependencies,
                status="queued"
            )
            # Sync to DB
            db_task = task_service.create_task(
                business_id=business_id,
                description=tp.description,
                status="queued",
                parent_id=main_task_id,
                dependencies=tp.dependencies,
                assignee_role=tp.assignee_role
            )
            new_task.id = db_task["id"] # Use DB ID
            new_tasks_dict[new_task.id] = new_task
            
        return {"tasks": new_tasks_dict}

    def router_node(state: TeamState):
        # Dummy node to allow routing
        return {}

    # Define Worker Nodes
    class WorkerState(BaseModel):
        task: Task
        messages: list[BaseMessage]
        
    def make_worker_node(agent_data: dict):
        role = agent_data["role"]
        tools = registry.get_langchain_tools(role)
        worker_agent = create_react_agent(llm, tools, state_modifier=f"You are {agent_data['name']}, acting as a {role}.")
        
        def worker_node(worker_state: dict):
            task: Task = worker_state["task"]
            messages = worker_state["messages"]
            
            # Formulate instructions for the worker
            instructions = [HumanMessage(content=f"Your current task is: {task.description}. Please execute it using your tools.")]
            result = worker_agent.invoke({"messages": messages + instructions})
            
            final_output = result["messages"][-1].content
            
            # Mark completed in DB
            task_service.update_task_result(task.id, final_output)
            
            task.status = "completed"
            task.result = final_output
            
            return {
                "tasks": {task.id: task},
                "messages": [AIMessage(content=f"Task completed by {role}: {final_output}")]
            }
            
        return worker_node

    workflow = StateGraph(TeamState)
    
    workflow.add_node("planner", planner_node)
    workflow.add_node("router", router_node)
    
    # Add a worker node for each role
    role_nodes = []
    for agent in agents:
        node_name = f"worker_{agent['role']}"
        role_nodes.append(node_name)
        workflow.add_node(node_name, make_worker_node(agent))
        # Workers return to router to check for next tasks
        workflow.add_edge(node_name, "router")
        
    workflow.add_edge(START, "planner")
    workflow.add_edge("planner", "router")
    
    def conditional_dispatch(state: TeamState):
        tasks = state.get("tasks", {})
        ready_tasks = []
        all_completed = True
        
        for t_id, task in tasks.items():
            if task.status != "completed":
                all_completed = False
                
            if task.status == "queued":
                # Check dependencies
                deps_met = True
                for dep_id in task.dependencies:
                    if dep_id in tasks and tasks[dep_id].status != "completed":
                        deps_met = False
                        break
                if deps_met:
                    ready_tasks.append(task)
                    
        if not ready_tasks:
            if all_completed and len(tasks) > 0:
                return END
            return END
            
        sends = []
        for task in ready_tasks:
            # We update DB here, but DO NOT mutate the LangGraph state.
            # The worker node will mutate state when it completes.
            task_service.update_task_status(task.id, "running")
            
            # Ensure the assignee role exists in our nodes
            node_name = f"worker_{task.assignee_role}"
            if node_name not in role_nodes:
                # Fallback to first available worker if LLM hallucinates a role
                node_name = role_nodes[0]
                
            sends.append(Send(node_name, {"task": task, "messages": state.get("messages", [])}))
            
        return sends

    workflow.add_conditional_edges("router", conditional_dispatch, role_nodes + [END])
    
    return workflow
