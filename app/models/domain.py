from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, Any

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
    created_at: datetime
    updated_at: datetime

class Task(DBModel):
    id: UUID
    business_id: UUID
    agent_id: Optional[UUID] = None
    status: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class SharedMemory(DBModel):
    id: UUID
    business_id: UUID
    key: str
    value: dict[str, Any] | list[Any] | str | int | float | bool | None
    tags: Optional[list[str]] = None
    created_at: datetime
    updated_at: datetime

class CostRecord(DBModel):
    id: UUID
    business_id: UUID
    agent_id: Optional[UUID] = None
    task_id: Optional[UUID] = None
    amount: float
    description: Optional[str] = None
    created_at: datetime
