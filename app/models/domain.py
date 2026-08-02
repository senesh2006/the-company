from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, Any, Literal, List, Dict
from enum import Enum

class TrustTier(str, Enum):
    OBSERVE = "observe"
    ASSIST = "assist"
    OPERATE = "operate"

class DBModel(BaseModel):
    """Base Pydantic model for database entities."""
    model_config = ConfigDict(from_attributes=True)

class Business(DBModel):
    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime

class Agent(DBModel):
    id: UUID
    business_id: UUID
    name: str
    role: str
    status: str = "Idle"
    trust_tier: Literal["observe", "assist", "operate"] = "observe"
    specialization_id: Optional[str] = None
    hiring_model: Literal["salaried", "freelance", "contract"] = "salaried"
    clean_cycles_count: int = 0
    authority_limit_usd: float = 0.0
    system_prompt: Optional[str] = None
    model: Optional[str] = None
    capabilities: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

class Task(DBModel):
    """
    Task / Mandate Contract Schema as specified in PRD v6.0 §6.2.
    """
    id: UUID
    business_id: UUID
    agent_id: Optional[UUID] = None
    assignee_role: Optional[str] = None
    status: str = "pending" # pending | queued | running | completed | failed | needs_approval | rejected
    description: Optional[str] = None
    mandate: Optional[str] = None
    cadence: Literal["once", "daily", "weekly", "on_trigger"] = "once"
    priority: Literal["low", "normal", "high"] = "normal"
    authority_limit: Optional[Dict[str, Any]] = None
    trust_tier: Literal["observe", "assist", "operate"] = "observe"
    specialization_id: Optional[str] = None
    shared_memory_refs: Optional[List[str]] = None
    files: Optional[List[str]] = None
    expected_output: Optional[Dict[str, Any]] = None
    result: Optional[str] = None
    review_verdict: Optional[str] = None # 'approved' | 'rejected' | 'auto_approved' | 'pending'
    retry_count: int = 0
    created_at: datetime
    updated_at: datetime

class SharedMemory(DBModel):
    id: UUID
    business_id: UUID
    key: str
    value: str
    updated_by: Optional[str] = None
    agent_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

class Approval(DBModel):
    id: UUID
    business_id: UUID
    agent_id: Optional[UUID] = None
    type: str # approval | risk | error
    title: str
    description: str
    status: str = "pending" # pending | approved | rejected
    created_at: datetime
    updated_at: datetime

class AuditLogEntry(DBModel):
    """
    Audit log record for the Company Feed and Earned Trust verification (PRD v6.0 §6.1).
    """
    id: UUID
    business_id: UUID
    agent_id: Optional[UUID] = None
    agent_name: Optional[str] = None
    role: Optional[str] = None
    mandate: Optional[str] = None
    trust_tier: Optional[str] = "observe"
    action: str
    details: Optional[Dict[str, Any]] = None
    review_status: Optional[str] = None # 'approved' | 'rejected' | 'revise' | 'auto_approved'
    shared_memory_refs: Optional[List[str]] = None
    created_at: datetime
