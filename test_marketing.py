import asyncio
import os
import json
from dotenv import load_dotenv
from app.agents.marketing_worker import make_marketing_worker_node
from app.agents.state import TaskNode

def main():
    load_dotenv()
    print("Testing Marketing Hub Director with new capabilities...")
    
    task_description = "Pull live paid media data and suggest budget reallocations based on CPA."
    print(f"Assigning task: {task_description}")
    
    try:
        # We invoke the Marketing Worker directly to bypass the DB agent checks
        worker_node = make_marketing_worker_node({"id": "test-agent", "role": "Marketing Manager", "model": "gemini-2.5-flash"})
        
        import uuid
        task_id = str(uuid.uuid4())
        task = TaskNode(id=task_id, description=task_description, assignee_id="test-agent", status="running")
        
        state = {
            "business_id": "00000000-0000-0000-0000-000000000001",
            "task_graph": {task.id: task},
            "shared_context": {}
        }
        
        print("\nInvoking Marketing Worker...")
        # Since it's a synchronous node function returning a dict update
        result = worker_node(state)
        
        print("\n=== Agent Result ===")
        # Pretty print the final worker_results
        if "worker_results" in result and result["worker_results"]:
            print(result["worker_results"][0].output)
        else:
            print(result)
            
    except Exception as e:
        import traceback
        print(f"\nError running task: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    main()
