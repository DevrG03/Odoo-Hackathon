from pydantic import BaseModel, ConfigDict
from typing import Optional

class UserCreate(BaseModel):
    email: str
    password: str
    role: str = "employee"

class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    role: str

class EmployeeCreate(BaseModel):
    user_id: int
    department_id: Optional[int] = None
    name: str

class EmployeeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    department_id: Optional[int]
    name: str
    total_xp: int
    total_points: int