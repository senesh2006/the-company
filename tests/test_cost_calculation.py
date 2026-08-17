import pytest
from app.services.cost_service import CostService, calculate_llm_cost, MODEL_PRICING_PER_1M

def test_calculate_llm_cost():
    # 1. Test GPT-4o calculation
    cost_gpt4o = calculate_llm_cost(model_name="gpt-4o", input_tokens=1000, output_tokens=500, tool_calls_count=2)
    expected_gpt4o = (1000 * 2.50 / 1_000_000) + (500 * 10.00 / 1_000_000) + (2 * 0.0005)
    assert abs(cost_gpt4o - round(expected_gpt4o, 6)) < 1e-6

    # 2. Test Groq / Llama 3.3 70B calculation
    cost_llama = calculate_llm_cost(model_name="llama-3.3-70b-versatile", input_tokens=2000, output_tokens=1000)
    expected_llama = (2000 * 0.59 / 1_000_000) + (1000 * 0.79 / 1_000_000)
    assert abs(cost_llama - round(expected_llama, 6)) < 1e-6

    # 3. Test zero tokens with tool calls
    cost_tools = calculate_llm_cost(model_name="default", input_tokens=0, output_tokens=0, tool_calls_count=4)
    assert cost_tools == 0.002

def test_cost_service_logging_and_aggregation():
    service = CostService(supabase_client=None)
    biz_id = "test-biz-cost-001"
    agent_id = "agent-test-cost-123"
    task_id = "task-test-cost-456"

    # Log cost 1
    rec1 = service.log_cost(
        business_id=biz_id,
        amount=0.0125,
        record_type="llm_inference",
        agent_id=agent_id,
        task_id=task_id,
        description="Market research generation",
        input_tokens=1200,
        output_tokens=800
    )
    assert rec1["amount"] == 0.0125

    # Log cost 2
    rec2 = service.log_cost(
        business_id=biz_id,
        amount=0.0075,
        record_type="tool_execution",
        agent_id=agent_id,
        task_id=task_id,
        description="Audit ledger check"
    )
    assert rec2["amount"] == 0.0075

    # Check agent accumulation
    agent_cost = service.get_agent_cost_today(agent_id)
    assert agent_cost >= 0.02

    # Check summaries
    agent_summary = service.get_cost_summary_by_agent(biz_id)
    assert any(a["agent_id"] == agent_id and a["total_cost"] >= 0.02 for a in agent_summary)

    task_summary = service.get_cost_summary_by_task(biz_id)
    assert any(t["task_id"] == task_id and t["total_cost"] >= 0.02 for t in task_summary)

    total_biz_cost = service.get_total_cost(biz_id)
    assert total_biz_cost >= 0.02
