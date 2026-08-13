import asyncio
import os
import json
import uuid
from dotenv import load_dotenv
from app.agents.engineering_worker import make_engineering_worker_node
from app.agents.state import TaskNode

def main():
    load_dotenv()
    print("Testing Engineering Worker with new capabilities...")
    
    task_description = "Review the current repository structure and write a python script that prints 'Hello World'."
    print(f"Assigning task: {task_description}")
    
    try:
        worker_node = make_engineering_worker_node({"id": "test-eng-agent", "role": "Coder", "model": "gemini-2.5-flash"})
        
        task_id = str(uuid.uuid4())
        task = TaskNode(id=task_id, description=task_description, assignee_id="test-eng-agent", status="running", assignee_role="Coder")
        
        state = {
            "business_id": "00000000-0000-0000-0000-000000000001",
            "task_graph": {task.id: task},
            "shared_context": {}
        }
        
        print("\nInvoking Engineering Worker...")
        result = worker_node(state)
        
        print("\n=== Agent Result ===")
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
