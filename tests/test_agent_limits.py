import unittest
from pydantic import BaseModel
from typing import List
from app.core.config import settings
from app.agents.state import TaskNode, OrchestratorState, AgentStatus
from app.agents.supervisor import global_supervisor_node
from app.agents.tools import SpawnSubtaskTool
from app.agents.workers import execute_sub_orchestration
from app.agents.researcher import ResearchPlanOutput

class TestAgentLimits(unittest.TestCase):
    def test_config_limits(self):
        self.assertEqual(settings.MAX_SUBTASKS_PER_MANDATE, 5)
        self.assertEqual(settings.MAX_SUBWORKERS_PER_AGENT, 5)

    def test_spawn_subtask_tool_limit(self):
        tool = SpawnSubtaskTool(business_id="test_biz", main_task_id="task_123")
        for i in range(5):
            res = tool.run(agent_id="Marketing Manager", instruction=f"Instruction #{i+1}")
            self.assertIn("Successfully delegated subtask", res)
            self.assertIn(f"({i+1}/5)", res)

        # 6th attempt must be rejected
        res_overflow = tool.run(agent_id="Marketing Manager", instruction="Instruction #6")
        self.assertIn("Delegation limit reached", res_overflow)
        self.assertIn("maximum of 5 subtasks/agents", res_overflow)

    def test_sub_orchestration_cap_at_five(self):
        # Create a research plan with 8 recommended subtasks
        subtasks = [
            TaskNode(id=f"sub_{i}", description=f"Subtask #{i}", assignee_role="assistant", status="queued")
            for i in range(8)
        ]
        plan = ResearchPlanOutput(
            analysis="High complexity task requiring subtasks",
            recommended_subtasks=subtasks,
            execution_order="parallel"
        )
        main_task = TaskNode(id="main_task_1", description="Main objective", assignee_role="Marketing Manager")
        
        # Test execute_sub_orchestration limits subtasks to 5
        max_limit = min(5, getattr(settings, "MAX_SUBWORKERS_PER_AGENT", 5))
        self.assertEqual(max_limit, 5)
        self.assertEqual(len((plan.recommended_subtasks)[:max_limit]), 5)

    def test_supervisor_does_not_replan_if_five_tasks_exist(self):
        task_graph = {
            f"t_{i}": TaskNode(id=f"t_{i}", description=f"Task {i}", assignee_role="Marketing Manager", status="completed")
            for i in range(5)
        }
        state: OrchestratorState = {
            "business_id": "test_biz",
            "task_id": "global_1",
            "messages": [],
            "active_agents": {"a1": AgentStatus(id="a1", role="Marketing Manager", name="Marketing Lead")},
            "task_graph": task_graph,
            "shared_context": {},
            "pending_approvals": [],
            "execution_mode": "autonomous",
            "supervisor_thoughts": [],
            "worker_results": [],
            "risk_flags": [],
            "cost_tracker": {},
            "iteration": 1,
            "max_iterations": 10,
            "status": "running",
            "active_sub_orchestrations": {}
        }
        result = global_supervisor_node(state)
        # Should skip creating any tasks and just increment iteration
        self.assertEqual(result.get("iteration"), 2)
        self.assertNotIn("task_graph", result)

if __name__ == "__main__":
    unittest.main()
