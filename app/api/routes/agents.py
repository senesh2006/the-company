import concurrent.futures
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import Optional

from app.agents.runner import TeamRunner
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

@router.post("/hire")
def hire_agent_default(payload: HireAgentPayload, background_tasks: BackgroundTasks, user = Depends(get_current_user)):
    """
    Hires a new agent for the default business team (used by frontend dashboard).
    """
    try:
        # Get default business
        response = task_service.client.table("businesses").select("*").limit(1).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="No business found in database.")
        biz_id = response.data[0]["id"]
        
        return hire_agent(biz_id, payload, background_tasks, user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to hire agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{business_id}")
def hire_agent(business_id: str, payload: HireAgentPayload, background_tasks: BackgroundTasks, user = Depends(get_current_user)):
    """
    Hires a new agent for the business team.
    If a goal is provided, it submits a task to the team and starts the supervisor.
    """
    try:
        agent = task_service.create_agent(business_id, payload.name, payload.role)
        
        task = None
        if payload.goal:
            # Set agent to Running immediately so frontend sees it
            task_service.update_agent_status(agent["id"], "Running")
            task = task_service.create_task(business_id, payload.goal, status="running")
            
            def start_team_loop():
                try:
                    runner = TeamRunner(business_id, task["id"])
                    runner.start(f"Your goal is: {payload.goal}")
                except Exception as e:
                    logger.error(f"Failed to start team loop: {e}")
                    # Reset agent to Idle if team fails to start
                    task_service.update_agent_status(agent["id"], "Idle")
            
            background_tasks.add_task(lambda: thread_pool.submit(start_team_loop))
            
        return {
            "status": "success",
            "agent": agent,
            "initial_task": task
        }
    except Exception as e:
        logger.error(f"Failed to hire agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{business_id}/team/pause")
def pause_team(business_id: str):
    """
    Pauses the active team run.
    """
    try:
        task = task_service.get_active_task_for_business(business_id)
        if not task:
            raise HTTPException(status_code=404, detail="No active task found for business.")
            
        runner = TeamRunner(business_id, task["id"])
        success = runner.pause()
        if not success:
            raise HTTPException(status_code=404, detail="Team thread state not found.")
        return {"status": "success", "message": "Team paused."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to pause team: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{business_id}/team/resume")
def resume_team(business_id: str, payload: ResumePayload, background_tasks: BackgroundTasks):
    """
    Resumes a paused team run in the background.
    """
    try:
        # For paused tasks, the status might still be running in the DB, just paused in state
        task = task_service.get_active_task_for_business(business_id)
        if not task:
             response = task_service.client.table("tasks").select("*").eq("business_id", business_id).execute()
             if response.data:
                 task = response.data[-1]
             else:
                 raise HTTPException(status_code=404, detail="No tasks found for business.")
                 
        def background_resume():
            try:
                runner = TeamRunner(business_id, task["id"])
                runner.resume(additional_instruction=payload.instruction)
            except Exception as e:
                logger.error(f"Failed to resume team in background: {e}")

        background_tasks.add_task(lambda: thread_pool.submit(background_resume))
        
        return {"status": "success", "message": "Team resume initiated in the background."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class InjectInstructionPayload(BaseModel):
    instruction: str

@router.post("/{business_id}/team/inject-instruction")
def inject_instruction(business_id: str, payload: InjectInstructionPayload):
    """
    Injects a human instruction into the running team supervisor loop.
    """
    try:
        task = task_service.get_active_task_for_business(business_id)
        if not task:
            raise HTTPException(status_code=404, detail="No active task found for business.")
            
        runner = TeamRunner(business_id, task["id"])
        success = runner.inject_instruction(payload.instruction)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to inject instruction.")
            
        return {"status": "success", "message": "Instruction injected successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to inject instruction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{business_id}/team/force-stop")
def force_stop_team(business_id: str):
    """
    Immediately kills the running team loop.
    """
    try:
        task = task_service.get_active_task_for_business(business_id)
        if not task:
            raise HTTPException(status_code=404, detail="No active task found for business.")
            
        runner = TeamRunner(business_id, task["id"])
        success = runner.kill()
        if not success:
            raise HTTPException(status_code=404, detail="Team thread state not found.")
            
        return {"status": "success", "message": "Team force stopped."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to force stop team: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
def get_agents(user = Depends(get_current_user)):
    """Fetches all agents across the user's business."""
    try:
        response = task_service.client.table("agents").select("*").execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Failed to fetch agents from database: {e}")
        return []

@router.get("/{agent_id}")
def get_agent_details(agent_id: str, user = Depends(get_current_user)):
    """Fetches details for a specific agent."""
    try:
        response = task_service.client.table("agents").select("*").eq("id", agent_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Agent not found")
        return response.data[0]
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
        existing = task_service.client.table("agents").select("*").eq("id", agent_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Agent not found")
            
        updated = task_service.update_agent_status(agent_id, payload.status)
        if updated:
            return updated
        agent_data = existing.data[0]
        agent_data["status"] = payload.status
        return agent_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{agent_id}/inject")
def inject_instruction_by_agent(agent_id: str, payload: InjectInstructionPayload, user = Depends(get_current_user)):
    """Injects instruction for a specific agent by finding its business."""
    try:
        agent_resp = task_service.client.table("agents").select("business_id").eq("id", agent_id).execute()
        if not agent_resp.data:
            raise HTTPException(status_code=404, detail="Agent not found")
        business_id = agent_resp.data[0]["business_id"]
        return inject_instruction(business_id, payload)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
