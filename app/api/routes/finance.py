import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.api.deps import get_current_user
from app.services.google_sheets_service import GoogleSheetsService

logger = logging.getLogger(__name__)

router = APIRouter()

class AccountCreateOrUpdate(BaseModel):
    code: str = Field(..., description="Account Code e.g. '1000', '4000'")
    name: str = Field(..., description="Account name e.g. 'Software Subscription Revenue'")
    category: str = Field(..., description="Assets, Liabilities, Equity, Revenue, COGS, OPEX")
    type: str = Field("Operating Account", description="Account subtype")
    balance: float = Field(0.0, description="Current balance in USD")
    normal_balance: str = Field("Debit", description="'Debit' or 'Credit'")
    description: Optional[str] = Field(None, description="Account purpose and notes")

class JournalEntryCreate(BaseModel):
    date: Optional[str] = Field(None, description="YYYY-MM-DD")
    reference: str = Field(..., description="Invoice ID, transaction reference or receipt #")
    description: str = Field(..., description="Detailed business description of transaction")
    debit_account: str = Field(..., description="Account Code & Name to Debit")
    credit_account: str = Field(..., description="Account Code & Name to Credit")
    amount: float = Field(..., gt=0, description="Amount in USD")
    source: Optional[str] = Field("Manual / Web UI", description="Originating agent or user")

@router.get("/accounts", response_model=Dict[str, Any])
def get_chart_of_accounts(user = Depends(get_current_user)):
    """Retrieve the full Chart of Accounts with balances and metadata."""
    biz_id = getattr(user, "business_id", "00000000-0000-0000-0000-000000000001") or "00000000-0000-0000-0000-000000000001"
    service = GoogleSheetsService(business_id=biz_id)
    accounts = service.get_accounts()
    tb = service.get_trial_balance()
    cfg = service.get_config()

    return {
        "accounts": accounts,
        "total_count": len(accounts),
        "trial_balance": tb,
        "sheets_config": cfg
    }

@router.post("/accounts", response_model=Dict[str, Any])
def create_or_update_account(payload: AccountCreateOrUpdate, user = Depends(get_current_user)):
    """Add a new account or update an existing account in the general ledger."""
    biz_id = getattr(user, "business_id", "00000000-0000-0000-0000-000000000001") or "00000000-0000-0000-0000-000000000001"
    service = GoogleSheetsService(business_id=biz_id)
    account = service.add_or_update_account(payload.dict())
    return {"status": "success", "account": account}

@router.get("/journal", response_model=Dict[str, Any])
def get_journal_entries(user = Depends(get_current_user)):
    """Retrieve all double-entry general journal transactions."""
    biz_id = getattr(user, "business_id", "00000000-0000-0000-0000-000000000001") or "00000000-0000-0000-0000-000000000001"
    service = GoogleSheetsService(business_id=biz_id)
    entries = service.get_journal_entries()
    return {
        "entries": entries,
        "total_count": len(entries)
    }

@router.post("/journal", response_model=Dict[str, Any])
def post_journal_entry(payload: JournalEntryCreate, user = Depends(get_current_user)):
    """Record a new double-entry journal entry and update account balances."""
    biz_id = getattr(user, "business_id", "00000000-0000-0000-0000-000000000001") or "00000000-0000-0000-0000-000000000001"
    service = GoogleSheetsService(business_id=biz_id)
    entry_dict = payload.dict()
    entry = service.post_journal_entry(entry_dict)
    return {"status": "success", "entry": entry}

@router.get("/trial-balance", response_model=Dict[str, Any])
def get_trial_balance(user = Depends(get_current_user)):
    """Get the calculated trial balance and verification integrity."""
    biz_id = getattr(user, "business_id", "00000000-0000-0000-0000-000000000001") or "00000000-0000-0000-0000-000000000001"
    service = GoogleSheetsService(business_id=biz_id)
    return service.get_trial_balance()

@router.get("/sheets-config", response_model=Dict[str, Any])
def get_sheets_config(user = Depends(get_current_user)):
    """Get the active Google Sheets connection configuration and sheet link."""
    biz_id = getattr(user, "business_id", "00000000-0000-0000-0000-000000000001") or "00000000-0000-0000-0000-000000000001"
    service = GoogleSheetsService(business_id=biz_id)
    return service.get_config()

@router.post("/sync-sheets", response_model=Dict[str, Any])
def sync_with_google_sheets(user = Depends(get_current_user)):
    """Triggers real-time bi-directional synchronization with Google Sheets."""
    biz_id = getattr(user, "business_id", "00000000-0000-0000-0000-000000000001") or "00000000-0000-0000-0000-000000000001"
    service = GoogleSheetsService(business_id=biz_id)
    result = service.sync_to_google_sheets()
    return result

@router.post("/clear", response_model=Dict[str, Any])
def clear_finance_data(user = Depends(get_current_user)):
    """Clear all accounts and journal entries in the ledger to empty."""
    biz_id = getattr(user, "business_id", "00000000-0000-0000-0000-000000000001") or "00000000-0000-0000-0000-000000000001"
    service = GoogleSheetsService(business_id=biz_id)
    return service.clear_all_data()

@router.post("/initialize-template", response_model=Dict[str, Any])
def initialize_standard_template(user = Depends(get_current_user)):
    """Initialize a standard GAAP Chart of Accounts template with 0 initial balances."""
    biz_id = getattr(user, "business_id", "00000000-0000-0000-0000-000000000001") or "00000000-0000-0000-0000-000000000001"
    service = GoogleSheetsService(business_id=biz_id)
    accounts = service.initialize_standard_template()
    return {"status": "success", "accounts": accounts, "total_count": len(accounts)}

