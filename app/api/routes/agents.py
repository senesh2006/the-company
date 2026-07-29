import concurrent.futures
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

from app.agents.runner import AgentRunner
from app.core.logging import logger

from app.services.task_service import TaskService

router = APIRouter()
task_service = TaskService()

# Thread pool for resuming agents in the background
thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=10)

class ResumePayload(BaseModel):
    instruction: Optional[str] = None

class HireAgentPayload(BaseModel):
    role: str
    name: str
    goal: Optional[str] = None

@router.post("/{business_id}")
def hire_agent(business_id: str, payload: HireAgentPayload, background_tasks: BackgroundTasks):
    """
    Hires a new agent, optionally creating an initial task and starting its loop.
    """
    try:
        agent = task_service.create_agent(business_id, payload.name, payload.role)
        
        task = None
        if payload.goal:
            # Create an assigned task for this new agent
            task = task_service.create_task(business_id, payload.goal, status="assigned")
            task_service.assign_task(task["id"], agent["id"])
            
            def start_agent_loop():
                try:
                    runner = AgentRunner(business_id, agent["id"], task["id"], role=payload.role)
                    runner.start(f"Your goal is: {payload.goal}")
                except Exception as e:
                    logger.error(f"Failed to start hired agent loop: {e}")
            
            # Start loop in a background thread
            background_tasks.add_task(lambda: thread_pool.submit(start_agent_loop))
            
        return {
            "status": "success",
            "agent": agent,
            "initial_task": task
        }
    except Exception as e:
        logger.error(f"Failed to hire agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{business_id}/{agent_id}/{task_id}/pause")
def pause_agent(business_id: str, agent_id: str, task_id: str):
    """
    Pauses an active agent run. It will gracefully finish its current step.
    """
    try:
        runner = AgentRunner(business_id, agent_id, task_id)
        success = runner.pause()
        if not success:
            raise HTTPException(status_code=404, detail="Agent thread state not found.")
        return {"status": "success", "message": f"Agent {agent_id} paused."}
    except Exception as e:
        logger.error(f"Failed to pause agent {agent_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{business_id}/{agent_id}/{task_id}/resume")
def resume_agent(business_id: str, agent_id: str, task_id: str, payload: ResumePayload, background_tasks: BackgroundTasks):
    """
    Resumes a paused agent run in the background.
    """
    def background_resume():
        try:
            runner = AgentRunner(business_id, agent_id, task_id)
            runner.resume(additional_instruction=payload.instruction)
        except Exception as e:
            logger.error(f"Failed to resume agent {agent_id} in background: {e}")

    # Using FastAPI BackgroundTasks to offload the thread execution
    background_tasks.add_task(lambda: thread_pool.submit(background_resume))
    
    return {"status": "success", "message": f"Agent {agent_id} resume initiated in the background."}

@router.post("/{business_id}/{agent_id}/{task_id}/kill")
def kill_agent(business_id: str, agent_id: str, task_id: str):
    """
    Kills an active or paused agent and marks the task as failed.
    """
    try:
        runner = AgentRunner(business_id, agent_id, task_id)
        success = runner.kill()
        if not success:
            raise HTTPException(status_code=404, detail="Agent thread state not found.")
        return {"status": "success", "message": f"Agent {agent_id} killed and task failed."}
    except Exception as e:
        logger.error(f"Failed to kill agent {agent_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
