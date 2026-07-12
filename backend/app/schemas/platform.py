from pydantic import BaseModel, ConfigDict
from typing import Optional

class DepartmentCreate(BaseModel):
    name: str
    code: str
    head_id: Optional[int] = None
    parent_department_id: Optional[int] = None
    employee_count: int = 0
    status: str = "active"

class DepartmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: str
    head_id: Optional[int]
    parent_department_id: Optional[int]
    employee_count: int
    status: str

class CategoryCreate(BaseModel):
    name: str
    type: str  # "CSR_ACTIVITY" or "CHALLENGE"
    status: str = "active"

class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    type: str
    status: str

class ESGConfigRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    auto_emission_calculation_enabled: bool
    evidence_requirement_enabled: bool
    badge_auto_award_enabled: bool

class ESGConfigUpdate(BaseModel):
    auto_emission_calculation_enabled: Optional[bool] = None
    evidence_requirement_enabled: Optional[bool] = None
    badge_auto_award_enabled: Optional[bool] = None

class DepartmentScoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    department_id: int
    environmental_score: float
    social_score: float
    governance_score: float
    total_score: float