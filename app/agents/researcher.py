from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from app.agents.llm_factory import get_llm
from app.agents.state import TaskNode

class ResearchPlanOutput(BaseModel):
    analysis: str = Field(description="A brief analysis of the problem and why these specific sub-tasks are needed.")
    recommended_subtasks: List[TaskNode] = Field(description="The list of sub-tasks needed to complete the objective.")
    execution_order: str = Field(description="Explanation of whether these can run in parallel or sequentially.")

def get_research_agent(model_id: str = None):
    llm = get_llm(model_id=model_id, role="Research Specialist", temperature=0.2)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are the Lead Research Agent. A Specialist Worker has escalated a complex task to you.
Your job is to:
1. Analyze the complex task.
2. Break it down into clear, actionable sub-tasks for Level 3 temporary sub-workers.
3. Recommend the specific 'role' each sub-worker needs (e.g. 'Data Scraper', 'Data Analyst', 'Copywriter').
4. Define dependencies between these sub-tasks to determine execution order (parallel vs sequential).

Output your plan as a structured JSON. Assign unique IDs to each subtask (e.g. 'subtask_1').
"""),
        ("human", "Here is the complex task that needs to be broken down: {task_description}\nContext: {context}")
    ])

    return prompt | llm.with_structured_output(ResearchPlanOutput)
