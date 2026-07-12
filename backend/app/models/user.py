from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey
from app.database import Base

class User(Base):
    """
    Handles authentication and core identity. 
    Kept separate from the Employee profile to separate Auth concerns from Business Logic.
    """
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, default="employee") # e.g., employee, admin
    
    # 1-to-1 relationship with the Employee business profile
    employee_profile = relationship("Employee", back_populates="user", uselist=False)

class Employee(Base):
    """
    The business profile of a user. Used heavily by Social, Governance, and Gamification
    for tracking points, participation, and compliance issue ownership.
    """
    __tablename__ = "employees"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=True)
    name: Mapped[str] = mapped_column(String)
    
    # Gamification tracking fields
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    total_points: Mapped[int] = mapped_column(Integer, default=0)
    
    # Relationships mapping back to core platform data
    user = relationship("User", back_populates="employee_profile")
    department = relationship("Department", back_populates="employees")