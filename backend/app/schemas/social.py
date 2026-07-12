from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CSRActivityCreate(BaseModel):
    title: str
    category_id: int
    description: str
    points_offered: int
    date: datetime

class CSRActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    category_id: int
    description: str
    points_offered: int
    date: datetime

class EmployeeParticipationCreate(BaseModel):
    employee_id: int
    activity_id: int
    proof_url: Optional[str] = None

class EmployeeParticipationApprove(BaseModel):
    approval_status: str  # "Approved" or "Rejected"

class EmployeeParticipationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_id: int
    activity_id: int
    proof_url: Optional[str]
    approval_status: str
    points_earned: int
    completion_date: datetime