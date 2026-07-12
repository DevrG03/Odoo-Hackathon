from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey, DateTime
from datetime import datetime
from app.database import Base

class ESGPolicy(Base):
    """Company-wide governance rules and documentation."""
    __tablename__ = "esg_policies"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    version: Mapped[str] = mapped_column(String)
    effective_date: Mapped[datetime] = mapped_column(DateTime)
    document_url: Mapped[str] = mapped_column(String, nullable=True) # Link to PDF/Doc

class PolicyAcknowledgement(Base):
    """Tracks which employees have read and signed off on which policies."""
    __tablename__ = "policy_acknowledgements"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    policy_id: Mapped[int] = mapped_column(ForeignKey("esg_policies.id"))
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    
    status: Mapped[str] = mapped_column(String, default="Pending") # Pending, Acknowledged
    acknowledged_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)

class Audit(Base):
    """A formal review event encompassing multiple compliance checks."""
    __tablename__ = "audits"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String)
    auditor: Mapped[str] = mapped_column(String)
    date: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String, default="Planned")

class ComplianceIssue(Base):
    """
    Transactional Data: A specific violation found during an Audit.
    Crucial for notifications and Governance reporting.
    """
    __tablename__ = "compliance_issues"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    audit_id: Mapped[int] = mapped_column(ForeignKey("audits.id"))
    severity: Mapped[str] = mapped_column(String) # Low, Medium, High, Critical
    description: Mapped[str] = mapped_column(String)
    
    # Business Rule: Every issue must be assigned an owner for accountability
    owner_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    
    # Business Rule: Triggers a notification if this date passes and status is Open
    due_date: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String, default="Open") # Open, Resolved, Overdue