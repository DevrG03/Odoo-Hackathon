from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, Enum, Float
import enum
from app.database import Base

class CategoryType(str, enum.Enum):
    # Enforces that Categories can only be used for these two specific modules
    CSR_ACTIVITY = "CSR_ACTIVITY"
    CHALLENGE = "CHALLENGE"

class Department(Base):
    """
    Master Data: Defines the organizational hierarchy.
    """
    __tablename__ = "departments"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    code: Mapped[str] = mapped_column(String, unique=True)
    
    # Links to the Employee model to define who leads the department
    head_id: Mapped[int] = mapped_column(ForeignKey("employees.id", use_alter=True, name="fk_department_head_id"), nullable=True)
    
    # Self-referential key to allow for nested sub-departments
    parent_department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=True)
    
    employee_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String, default="active")

    # Establishes the link so you can query department.employees
    employees = relationship("Employee", back_populates="department", foreign_keys="[Employee.department_id]", post_update=True)

class Category(Base):
    """
    Master Data: Shared categorization tags used by Person 2's modules.
    """
    __tablename__ = "categories"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String)
    type: Mapped[CategoryType] = mapped_column(Enum(CategoryType))
    status: Mapped[str] = mapped_column(String, default="active")

class DepartmentScore(Base):
    """
    Stores the aggregated scoring calculations built by Person 3 or Platform logic.
    """
    __tablename__ = "department_scores"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    
    # Broken down scores (e.g., out of 100)
    environmental_score: Mapped[float] = mapped_column(Float, default=0.0)
    social_score: Mapped[float] = mapped_column(Float, default=0.0)
    governance_score: Mapped[float] = mapped_column(Float, default=0.0)
    
    # The weighted average (40% Env, 30% Soc, 30% Gov)
    total_score: Mapped[float] = mapped_column(Float, default=0.0)