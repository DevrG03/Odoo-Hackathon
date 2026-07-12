from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey, DateTime, Boolean, Enum, Float
import enum
from datetime import datetime
from app.database import Base

class ChallengeStatus(str, enum.Enum):
    """Enforces the strict lifecycle state machine for challenges."""
    DRAFT = "Draft"
    ACTIVE = "Active"
    UNDER_REVIEW = "Under Review"
    COMPLETED = "Completed"
    ARCHIVED = "Archived"

class Challenge(Base):
    """A sustainability task an employee can undertake to earn XP."""
    __tablename__ = "challenges"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    description: Mapped[str] = mapped_column(String)
    
    xp_reward: Mapped[int] = mapped_column(Integer)
    difficulty: Mapped[str] = mapped_column(String)
    
    # Business Rule Toggle: If True, participation requires a proof_url
    evidence_required: Mapped[bool] = mapped_column(Boolean, default=False)
    
    deadline: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[ChallengeStatus] = mapped_column(Enum(ChallengeStatus), default=ChallengeStatus.DRAFT)

class ChallengeParticipation(Base):
    """Tracks an employee's progress on a specific challenge."""
    __tablename__ = "challenge_participations"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("challenges.id"))
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    proof_url: Mapped[str] = mapped_column(String, nullable=True)
    approval_status: Mapped[str] = mapped_column(String, default="Pending")
    xp_awarded: Mapped[int] = mapped_column(Integer, default=0)

class Badge(Base):
    """Master Data: Achievements automatically awarded to employees."""
    __tablename__ = "badges"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    
    # Business Rule: A string condition evaluated by the backend (e.g., "xp >= 1000" or "challenges_completed >= 5")
    unlock_rule: Mapped[str] = mapped_column(String) 
    icon: Mapped[str] = mapped_column(String)

class Reward(Base):
    """Master Data: Items employees can purchase with their earned points."""
    __tablename__ = "rewards"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    points_required: Mapped[int] = mapped_column(Integer)
    
    # Business Rule: Redemptions deduct from this stock count
    stock: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String, default="Available")