import unittest
import json
from app.agents.finance_tools import (
    ContractDeskTool,
    ExpenseManagerTool,
    InvoiceCoordinatorTool,
    SecurityQuestionnaireTool,
    VendorPortalOperatorTool,
    register_finance_tools,
    register_subworker_tools,
)

class TestFinanceDesks(unittest.TestCase):
    def setUp(self):
        self.business_id = "test-biz-123"
        self.contract_desk = ContractDeskTool()
        self.expense_manager = ExpenseManagerTool()
        self.invoice_coordinator = InvoiceCoordinatorTool()
        self.security_questionnaire = SecurityQuestionnaireTool()
        self.vendor_operator = VendorPortalOperatorTool()

    def test_contract_desk_pipeline_summary(self):
        res = self.contract_desk.run(action="pipeline_summary")
        data = json.loads(res)
        self.assertEqual(data["status"], "success")
        self.assertIn("stages", data)
        self.assertIn("Drafting", data["stages"])
        self.assertIn("In Review", data["stages"])
        self.assertIn("Signed", data["stages"])
        self.assertIn("Blocked", data["stages"])
        self.assertGreater(data["total_contracts"], 0)

    def test_contract_desk_extract_terms(self):
        res = self.contract_desk.run(action="extract_terms", contract_id="CTR-2026-081")
        data = json.loads(res)
        self.assertEqual(data["status"], "success")
        self.assertIn("key_terms", data)
        self.assertIn("payment_terms", data["key_terms"])
        self.assertIn("liability_cap", data["key_terms"])

    def test_contract_desk_flag_blocked(self):
        res = self.contract_desk.run(action="flag_blocked")
        data = json.loads(res)
        self.assertEqual(data["status"], "success")
        self.assertTrue(len(data["blocked_reviews"]) > 0)
        self.assertIn("flagged_clauses", data["blocked_reviews"][0])

    def test_expense_manager_weekly_summary(self):
        res = self.expense_manager.run(action="weekly_summary")
        data = json.loads(res)
        self.assertEqual(data["status"], "success")
        self.assertIn("breakdown_by_category", data)
        self.assertIn("total_expenses_usd", data)
        self.assertIn("budget_utilization_pct", data)

    def test_expense_manager_log_receipt(self):
        receipt_data = {
            "vendor": "Anthropic API",
            "amount": 250.00,
            "date": "2026-08-20",
            "category": "COGS 5100 (LLM Inference)",
            "owner": "CTO"
        }
        res = self.expense_manager.run(action="log_receipt", receipt_data=receipt_data)
        data = json.loads(res)
        self.assertEqual(data["status"], "success")
        self.assertIn("receipt_id", data)
        self.assertTrue(data["owner_notified"])

    def test_expense_manager_audit_categories_and_nudges(self):
        res = self.expense_manager.run(action="audit_categories")
        data = json.loads(res)
        self.assertEqual(data["status"], "success")
        self.assertIn("flagged_transactions", data)

        res_nudge = self.expense_manager.run(action="nudge_missing_receipts")
        data_nudge = json.loads(res_nudge)
        self.assertEqual(data_nudge["status"], "success")
        self.assertIn("nudges_dispatched", data_nudge)

    def test_invoice_coordinator_match_invoice(self):
        res = self.invoice_coordinator.run(action="match_invoice", vendor_name="Datadog", amount=3200.00, po_number="PO-2026-044")
        data = json.loads(res)
        self.assertEqual(data["status"], "success")
        self.assertIn("3_way_match_status", data)
        self.assertIn("routing_decision", data)

    def test_invoice_coordinator_track_actuals_and_aging(self):
        res_act = self.invoice_coordinator.run(action="track_vendor_actuals")
        data_act = json.loads(res_act)
        self.assertEqual(data_act["status"], "success")
        self.assertIn("vendor_actuals", data_act)

        res_aging = self.invoice_coordinator.run(action="aging_summary")
        data_aging = json.loads(res_aging)
        self.assertEqual(data_aging["status"], "success")
        self.assertIn("ap_aging_summary", data_aging)

    def test_security_questionnaire_draft_and_park(self):
        res_draft = self.security_questionnaire.run(action="draft_answers", portal_name="Whistic Security Portal")
        data_draft = json.loads(res_draft)
        self.assertEqual(data_draft["status"], "success")
        self.assertEqual(data_draft["staged_state"], "PARKED FOR HUMAN SUBMISSION")
        self.assertIn("sample_drafted_responses", data_draft)

        res_park = self.security_questionnaire.run(action="park_submission", portal_name="Whistic Security Portal")
        data_park = json.loads(res_park)
        self.assertEqual(data_park["status"], "success")
        self.assertIn("submission_id", data_park)

    def test_vendor_portal_operator_scans(self):
        res_renew = self.vendor_operator.run(action="scan_renewals")
        data_renew = json.loads(res_renew)
        self.assertEqual(data_renew["status"], "success")
        self.assertIn("upcoming_renewal_exceptions", data_renew)

        res_seats = self.vendor_operator.run(action="audit_seat_utilization")
        data_seats = json.loads(res_seats)
        self.assertEqual(data_seats["status"], "success")
        self.assertIn("seat_exceptions", data_seats)

    def test_tools_registration(self):
        tools = register_finance_tools(business_id=self.business_id)
        tool_names = [t.name for t in tools]
        self.assertIn("contract_desk", tool_names)
        self.assertIn("expense_manager", tool_names)
        self.assertIn("invoice_coordinator", tool_names)
        self.assertIn("security_questionnaire_filler", tool_names)
        self.assertIn("vendor_portal_operator", tool_names)

        contract_subworker_tools = register_subworker_tools(business_id=self.business_id, role="contract_specialist")
        self.assertIn("contract_desk", [t.name for t in contract_subworker_tools])

if __name__ == "__main__":
    unittest.main()
