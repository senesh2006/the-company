import uuid
from app.agents.state import TaskNode
from app.agents.researcher import ResearchPlanOutput
from app.agents.workers import execute_sub_orchestration

def test_hierarchy_sub_orchestration():
    business_id = "test_business"
    main_task = TaskNode(
        id=str(uuid.uuid4()),
        description="Write a comprehensive report on LangGraph Orchestration.",
        assignee_role="Researcher"
    )
    
    task_1 = TaskNode(id=str(uuid.uuid4()), description="Scrape LangGraph docs", assignee_role="Scraper")
    task_2 = TaskNode(id=str(uuid.uuid4()), description="Scrape LangChain docs", assignee_role="Scraper")
    task_3 = TaskNode(id=str(uuid.uuid4()), description="Write report based on docs", assignee_role="Analyst", dependencies=[task_1.id, task_2.id])
    
    plan = ResearchPlanOutput(
        analysis="We need a scraper to get docs, and an analyst to write.",
        recommended_subtasks=[task_1, task_2, task_3],
        execution_order="Run scrapers in parallel, then analyst."
    )
    
    print("Executing sub-orchestration (Simulated parallel sub-workers)...")
    result = execute_sub_orchestration(business_id, main_task, plan)
    
    print("\nFINAL SYNTHESIS:")
    print(result)
    assert result is not None
    assert isinstance(result, str)
