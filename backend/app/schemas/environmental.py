from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime

class EmissionFactorCreate(BaseModel):
    name: str
    unit: str
    value: float

class EmissionFactorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    unit: str
    value: float

class ProductESGProfileCreate(BaseModel):
    name: str
    esg_data: dict[str, Any]

class ProductESGProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    esg_data: dict[str, Any]

class EnvironmentalGoalCreate(BaseModel):
    department_id: Optional[int] = None
    title: str
    target_value: float
    current_value: float = 0.0
    deadline: datetime

class EnvironmentalGoalUpdate(BaseModel):
    title: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    deadline: Optional[datetime] = None

class EnvironmentalGoalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    department_id: Optional[int]
    title: str
    target_value: float
    current_value: float
    deadline: datetime

class CarbonTransactionCreate(BaseModel):
    department_id: int
    source: str
    value: float
    emission_factor_id: Optional[int] = None
    date: Optional[datetime] = None

class CarbonTransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    department_id: int
    source: str
    value: float
    emission_factor_id: Optional[int]
    calculated_emissions: float
    date: datetime