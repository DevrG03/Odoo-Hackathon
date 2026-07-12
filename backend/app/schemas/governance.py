from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ESGPolicyCreate(BaseModel):
    title: str
    description: str
    version: str
    effective_date: datetime
    document_url: Optional[str] = None

class ESGPolicyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    version: str
    effective_date: datetime
    document_url: Optional[str]

class PolicyAcknowledgementCreate(BaseModel):
    policy_id: int
    employee_id: int

class PolicyAcknowledgementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    policy_id: int
    employee_id: int
    status: str
    acknowledged_date: Optional[datetime]

class AuditCreate(BaseModel):
    title: str
    auditor: str
    date: datetime
    status: str = "Planned"

class AuditUpdate(BaseModel):
    title: Optional[str] = None
    auditor: Optional[str] = None
    date: Optional[datetime] = None
    status: Optional[str] = None  # Planned / In Progress / Completed

class AuditRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    auditor: str
    date: datetime
    status: str

class ComplianceIssueCreate(BaseModel):
    audit_id: int
    severity: str  # Low / Medium / High / Critical
    description: str
    owner_id: int  # Employee who is responsible
    due_date: datetime

class ComplianceIssueUpdate(BaseModel):
    severity: Optional[str] = None
    description: Optional[str] = None
    owner_id: Optional[int] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None  # Open / Resolved / Overdue

class ComplianceIssueRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    audit_id: int
    severity: str
    description: str
    owner_id: int
    due_date: datetime
    status: str