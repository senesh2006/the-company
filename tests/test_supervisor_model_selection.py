from unittest.mock import patch, MagicMock

from langchain_core.messages import HumanMessage

from app.agents.state import OrchestratorState, AgentStatus
from app.agents.supervisor import global_supervisor_node


def test_global_supervisor_uses_running_agent_model():
    """The supervisor should use the model of the currently running agent."""
    state: OrchestratorState = {
        "business_id": "biz-test",
        "task_id": "task-test",
        "messages": [HumanMessage(content="Run the monthly close.")],
        "active_agents": {
            "agent-1": AgentStatus(id="agent-1", role="Finance Manager", name="Fiona", model="llama-3.1-70b", current_task_id="task-1"),
            "agent-2": AgentStatus(id="agent-2", role="Marketing Manager", name="Mia", model="mistral-small-24b"),
        },
        "task_graph": {},
        "shared_context": {},
        "pending_approvals": [],
        "execution_mode": "autonomous",
        "supervisor_thoughts": [],
        "worker_results": [],
        "risk_flags": [],
        "cost_tracker": {},
        "iteration": 0,
        "max_iterations": 20,
        "status": "running",
        "active_sub_orchestrations": {}
    }

    with patch("app.agents.supervisor.get_supervisor_agent") as mock_get_supervisor:
        mock_agent = MagicMock()
        mock_agent.invoke.return_value = MagicMock(
            thoughts="test",
            action="finish",
            new_tasks=[],
            executive_brief="brief"
        )
        mock_get_supervisor.return_value = mock_agent

        with patch("app.agents.supervisor.task_service"):
            result = global_supervisor_node(state)

        mock_get_supervisor.assert_called_once()
        _, kwargs = mock_get_supervisor.call_args
        assert kwargs["model_id"] == "llama-3.1-70b"
        assert result["iteration"] == 1


def test_global_supervisor_falls_back_to_first_available_model():
    """When no agent is running, fall back to the first agent with a model."""
    state: OrchestratorState = {
        "business_id": "biz-test",
        "task_id": "task-test",
        "messages": [HumanMessage(content="Run the monthly close.")],
        "active_agents": {
            "agent-1": AgentStatus(id="agent-1", role="Finance Manager", name="Fiona", model="llama-3.1-8b"),
        },
        "task_graph": {},
        "shared_context": {},
        "pending_approvals": [],
        "execution_mode": "autonomous",
        "supervisor_thoughts": [],
        "worker_results": [],
        "risk_flags": [],
        "cost_tracker": {},
        "iteration": 0,
        "max_iterations": 20,
        "status": "running",
        "active_sub_orchestrations": {}
    }

    with patch("app.agents.supervisor.get_supervisor_agent") as mock_get_supervisor:
        mock_agent = MagicMock()
        mock_agent.invoke.return_value = MagicMock(
            thoughts="test",
            action="finish",
            new_tasks=[],
            executive_brief="brief"
        )
        mock_get_supervisor.return_value = mock_agent

        with patch("app.agents.supervisor.task_service"):
            result = global_supervisor_node(state)

        _, kwargs = mock_get_supervisor.call_args
        assert kwargs["model_id"] == "llama-3.1-8b"
