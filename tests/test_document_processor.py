import pytest
from app.services.document_processor import DocumentProcessor
from app.services.shared_memory import SharedMemoryService

def test_csv_processing():
    csv_content = b"Metric,Q1,Q2,Q3,Q4\nRevenue,100000,125000,150000,190000\nExpenses,60000,70000,80000,95000\nNetProfit,40000,55000,70000,95000"
    result = DocumentProcessor.process_file("financial_report_2026.csv", csv_content)
    
    assert result["file_type"] == "csv"
    assert result["category"] == "Financial Reports"
    assert result["metadata"]["row_count"] == 3
    assert result["metadata"]["columns"] == ["Metric", "Q1", "Q2", "Q3", "Q4"]
    assert "Revenue" in result["content"]
    assert len(result["chunks"]) >= 1

def test_markdown_notion_processing():
    md_content = b"""# Brand Guidelines 2026

## Color Palette
- Primary: #0F172A (Slate 900)
- Accent: #14B8A6 (Teal 500)

## Tone of Voice
Direct, sophisticated, authoritative, and data-driven.

## Typography
Font: Inter, JetBrains Mono
"""
    result = DocumentProcessor.process_file("brand_guidelines.md", md_content)
    
    assert result["file_type"] == "md"
    assert result["category"] == "Brand Guidelines"
    assert "Brand Guidelines 2026" in result["metadata"]["headers"]
    assert "#14B8A6" in result["content"]

def test_customer_persona_detection():
    persona_content = b"""# Ideal Customer Profile (ICP)
Target Buyer: VP of Engineering / CTO at Series A-C Startups.
Pain Points:
- Engineering velocity bottlenecks
- High developer recruitment costs
- Context fragmentation across remote teams
Objections:
- Governance and compliance concerns
- Autonomous agent unpredictability
"""
    result = DocumentProcessor.process_file("customer_personas.txt", persona_content)
    
    assert result["category"] == "Customer Personas"
    assert "VP of Engineering" in result["content"]

def test_json_processing():
    json_content = b'{"api_version": "v1", "rate_limit_per_minute": 120, "features": ["memory", "feed", "governance"]}'
    result = DocumentProcessor.process_file("system_config.json", json_content)
    
    assert result["file_type"] == "json"
    assert "rate_limit_per_minute" in result["content"]

def test_shared_memory_document_lifecycle():
    service = SharedMemoryService()
    test_business_id = "test-business-uuid-123"

    # 1. Process and save document
    doc_raw = DocumentProcessor.process_file(
        "q2_financials.csv", 
        b"Department,Budget,Spent\nMarketing,50000,42000\nEngineering,120000,115000"
    )
    saved = service.save_document(test_business_id, doc_raw, author="CFO Specialist")
    assert saved["id"] is not None
    assert saved["category"] == "Financial Reports"

    # 2. Retrieve document
    fetched = service.get_document(test_business_id, saved["id"])
    assert fetched is not None
    assert fetched["title"] == "q2_financials.csv"

    # 3. List documents
    all_docs = service.list_documents(test_business_id)
    assert len(all_docs) >= 1

    filtered_docs = service.list_documents(test_business_id, category="Financial Reports")
    assert len(filtered_docs) >= 1

    # 4. Search knowledge
    search_res = service.search_knowledge(test_business_id, query="Engineering budget")
    assert len(search_res) >= 1
    assert search_res[0]["id"] == saved["id"]

    # 5. Delete document
    deleted = service.delete_document(test_business_id, saved["id"])
    assert deleted is True
    assert service.get_document(test_business_id, saved["id"]) is None
