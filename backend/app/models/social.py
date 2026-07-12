from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey, DateTime
from datetime import datetime
from app.database import Base

class CSRActivity(Base):
    """Defines a Corporate Social Responsibility event hosted by the company."""
    __tablename__ = "csr_activities"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id")) # Links to shared Category
    description: Mapped[str] = mapped_column(String)
    points_offered: Mapped[int] = mapped_column(Integer)
    date: Mapped[datetime] = mapped_column(DateTime)

class EmployeeParticipation(Base):
    """
    Transactional Data: Tracks an employee's attempt to complete a CSR Activity.
    """
    __tablename__ = "employee_participations"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    activity_id: Mapped[int] = mapped_column(ForeignKey("csr_activities.id"))
    
    # Business Rule: If Evidence is required, the user must upload a file (URL stored here)
    proof_url: Mapped[str] = mapped_column(String, nullable=True)
    
    # Used by admins to manually verify the 'proof_url' before awarding points
    approval_status: Mapped[str] = mapped_column(String, default="Pending") # Pending, Approved, Rejected
    
    points_earned: Mapped[int] = mapped_column(Integer, default=0)
    completion_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)