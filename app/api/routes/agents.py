import concurrent.futures
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.agents.runner import TeamRunner
from app.agents.llm_factory import list_available_models
from app.core.logging import logger
from app.services.task_service import TaskService
from app.api.deps import get_current_user

router = APIRouter()
task_service = TaskService()
thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=10)

class ResumePayload(BaseModel):
    instruction: Optional[str] = None

class HireAgentPayload(BaseModel):
    role: str
    name: str
    goal: Optional[str] = None
    trust_tier: Optional[str] = "observe"
    specialization_id: Optional[str] = None
    hiring_model: Optional[str] = "salaried"
    system_prompt: Optional[str] = None
    model: Optional[str] = None
    capabilities: Optional[List[str]] = None

class PromoteDemotePayload(BaseModel):
    target_tier: Optional[str] = None
    reason: Optional[str] = None

@router.post("")
@router.post("/")
@router.post("/hire")
def hire_agent_default(payload: HireAgentPayload, background_tasks: BackgroundTasks, user = Depends(get_current_user)):
    """
    Hires a new worker for the authenticated user's business team (used by frontend dashboard).
    """
    try:
        biz_id = user.business_id or "00000000-0000-0000-0000-000000000001"
        return hire_agent(biz_id, payload, background_tasks, user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to hire worker: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{business_id}")
def hire_agent(business_id: str, payload: HireAgentPayload, background_tasks: BackgroundTasks, user = Depends(get_current_user)):
    """
    Hires a new AI Worker seeded at the specified Trust Tier (default: Observe).
    """
    try:
        agent = task_service.create_agent(
            business_id=business_id,
            name=payload.name,
            role=payload.role,
            trust_tier=payload.trust_tier or "observe",
            specialization_id=payload.specialization_id,
            hiring_model=payload.hiring_model or "salaried",
            system_prompt=payload.system_prompt,
            model=payload.model,
            capabilities=payload.capabilities
        )
        
        task = None
        if payload.goal:
            task_service.update_agent_status(agent["id"], "Running")
            task = task_service.create_task(
                business_id=business_id,
                description=payload.goal,
                mandate=payload.goal,
                status="running",
                assignee_role=payload.role,
                trust_tier=payload.trust_tier or "observe"
            )
            
            def start_team_loop():
                try:
                    runner = TeamRunner(business_id, task["id"])
                    runner.start(f"Your goal is: {payload.goal}")
                except Exception as e:
                    logger.error(f"Failed to start team loop: {e}")
                    task_service.update_agent_status(agent["id"], "Idle")
            
            background_tasks.add_task(lambda: thread_pool.submit(start_team_loop))
            
        return {
            "status": "success",
            "agent": agent,
            "initial_task": task
        }
    except Exception as e:
        logger.error(f"Failed to hire worker: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{agent_id}/promote")
def promote_agent(agent_id: str, payload: PromoteDemotePayload = PromoteDemotePayload(), user = Depends(get_current_user)):
    """Promotes an AI Worker's trust tier (Observe -> Assist -> Operate)."""
    try:
        agent_resp = task_service.client.table("agents").select("business_id").eq("id", agent_id).execute()
        biz_id = agent_resp.data[0]["business_id"] if agent_resp.data else "00000000-0000-0000-0000-000000000001"
        result = task_service.promote_agent(
            business_id=biz_id,
            agent_id=agent_id,
            target_tier=payload.target_tier,
            reason=payload.reason or "Founder promotion"
        )
        return result
    except Exception as e:
        logger.error(f"Failed to promote worker: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{agent_id}/demote")
def demote_agent(agent_id: str, payload: PromoteDemotePayload = PromoteDemotePayload(), user = Depends(get_current_user)):
    """Demotes an AI Worker's trust tier upon flagged errors or founder override."""
    try:
        agent_resp = task_service.client.table("agents").select("business_id").eq("id", agent_id).execute()
        biz_id = agent_resp.data[0]["business_id"] if agent_resp.data else "00000000-0000-0000-0000-000000000001"
        result = task_service.demote_agent(
            business_id=biz_id,
            agent_id=agent_id,
            reason=payload.reason or "Founder manual demotion"
        )
        return result
    except Exception as e:
        logger.error(f"Failed to demote worker: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
@router.get("/")
def get_agents(user = Depends(get_current_user)):
    """Fetches all AI Workers with Trust Tier and governance metrics for the authenticated user's business."""
    try:
        biz_id = user.business_id or "00000000-0000-0000-0000-000000000001"
        return task_service.list_agents(biz_id)
    except Exception as e:
        logger.error(f"Failed to fetch agents: {e}")
        return []

@router.get("/models")
def get_available_models(user = Depends(get_current_user)):
    """Returns the LLM models available based on the configured API keys."""
    try:
        return {"models": list_available_models()}
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{agent_id}")
def get_agent_details(agent_id: str, user = Depends(get_current_user)):
    """Fetches details for a specific AI Worker."""
    try:
        response = task_service.client.table("agents").select("*").eq("id", agent_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="AI Worker not found")
        agent = response.data[0]
        # Attach in-memory extra fields
        agents = task_service.list_agents(agent.get("business_id", "00000000-0000-0000-0000-000000000001"))
        for a in agents:
            if str(a.get("id")) == str(agent_id):
                return a
        return agent
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class UpdateStatusPayload(BaseModel):
    status: str

@router.patch("/{agent_id}/status")
def update_agent_status(agent_id: str, payload: UpdateStatusPayload, user = Depends(get_current_user)):
    """Updates the status of an agent."""
    try:
        response = task_service.client.table("agents").update({"status": payload.status}).eq("id", agent_id).execute()
        if not response.data:
            return {"status": payload.status}
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class InjectInstructionPayload(BaseModel):
    instruction: str

@router.post("/{agent_id}/inject")
def inject_instruction_by_agent(
    agent_id: str, 
    payload: InjectInstructionPayload, 
    background_tasks: BackgroundTasks, 
    user = Depends(get_current_user)
):
    """Injects instruction for a specific agent into active task or launches a new task if idle."""
    try:
        agent_resp = task_service.client.table("agents").select("*").eq("id", agent_id).execute()
        agent = agent_resp.data[0] if agent_resp.data else None
        
        if not agent:
            # Check in-memory agents
            for a in task_service.list_agents("00000000-0000-0000-0000-000000000001"):
                if str(a.get("id")) == str(agent_id):
                    agent = a
                    break
                    
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
            
        business_id = agent.get("business_id", "00000000-0000-0000-0000-000000000001")
        
        # 1. Check if there is an active running task to inject into
        task = task_service.get_active_task_for_business(business_id)
        if task:
            try:
                runner = TeamRunner(business_id, task["id"])
                success = runner.inject_instruction(payload.instruction)
                if success:
                    return {"status": "success", "message": "Instruction injected into active task loop."}
            except Exception as e:
                logger.warning(f"Could not inject into existing thread for task {task.get('id')}: {e}")
                
        # 2. If no active task or thread not active, launch a new mission specifically for this agent
        task = task_service.create_task(
            business_id=business_id,
            description=payload.instruction,
            mandate=payload.instruction,
            status="running",
            assignee_role=agent.get("role"),
            trust_tier=agent.get("trust_tier", "observe")
        )
        task_service.update_agent_status(agent_id, "Running")
        
        def run_agent_directive():
            try:
                runner = TeamRunner(business_id, task["id"])
                runner.start(f"Direct order for {agent.get('name')} ({agent.get('role')}): {payload.instruction}")
            except Exception as e:
                logger.error(f"Failed running directive task: {e}")
                task_service.update_agent_status(agent_id, "Idle")
                
        background_tasks.add_task(lambda: thread_pool.submit(run_agent_directive))
        
        return {
            "status": "success", 
            "message": f"Directive dispatched to {agent.get('name')}.",
            "task_id": task["id"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error injecting instruction: {e}")
        raise HTTPException(status_code=500, detail=str(e))



