from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ChallengeCreate(BaseModel):
    title: str
    category_id: int
    description: str
    xp_reward: int
    difficulty: str  # "Easy", "Medium", "Hard"
    evidence_required: bool = False
    deadline: datetime
    status: str = "Draft"

class ChallengeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    xp_reward: Optional[int] = None
    difficulty: Optional[str] = None
    evidence_required: Optional[bool] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None  # Draft / Active / Under Review / Completed / Archived

class ChallengeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    category_id: int
    description: str
    xp_reward: int
    difficulty: str
    evidence_required: bool
    deadline: datetime
    status: str

class ChallengeParticipationCreate(BaseModel):
    challenge_id: int
    employee_id: int
    proof_url: Optional[str] = None

class ChallengeParticipationApprove(BaseModel):
    approval_status: str  # "Approved" or "Rejected"

class ChallengeParticipationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    challenge_id: int
    employee_id: int
    progress: float
    proof_url: Optional[str]
    approval_status: str
    xp_awarded: int

class BadgeCreate(BaseModel):
    name: str
    description: str
    # Examples: "xp >= 1000"  |  "challenges_completed >= 5"  |  "points >= 500"
    unlock_rule: str
    icon: str

class BadgeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    unlock_rule: str
    icon: str

class RewardCreate(BaseModel):
    name: str
    description: str
    points_required: int
    stock: int
    status: str = "Available"

class RewardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    points_required: int
    stock: int
    status: str