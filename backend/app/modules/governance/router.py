from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models.governance import ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue
from app.models.notification import Notification
from app.schemas.governance import (
    ESGPolicyCreate, ESGPolicyRead,
    PolicyAcknowledgementCreate, PolicyAcknowledgementRead,
    AuditCreate, AuditUpdate, AuditRead,
    ComplianceIssueCreate, ComplianceIssueUpdate, ComplianceIssueRead,
)

router = APIRouter()


def _flag_overdue_issues(db: Session):
    """Business Rule: Flag issues that passed due_date while still Open."""
    now = datetime.utcnow()
    overdue = db.query(ComplianceIssue).filter(
        ComplianceIssue.status == "Open",
        ComplianceIssue.due_date < now,
    ).all()
    for issue in overdue:
        issue.status = "Overdue"
    if overdue:
        db.commit()


# --- ESG Policies ---

@router.get("/policies", response_model=list[ESGPolicyRead])
def list_policies(db: Session = Depends(get_db)):
    return db.query(ESGPolicy).all()


@router.get("/policies/{policy_id}", response_model=ESGPolicyRead)
def get_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(ESGPolicy).filter(ESGPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


@router.post("/policies", response_model=ESGPolicyRead)
def create_policy(policy_in: ESGPolicyCreate, db: Session = Depends(get_db)):
    policy = ESGPolicy(**policy_in.model_dump())
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


@router.put("/policies/{policy_id}", response_model=ESGPolicyRead)
def update_policy(policy_id: int, policy_in: ESGPolicyCreate, db: Session = Depends(get_db)):
    policy = db.query(ESGPolicy).filter(ESGPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in policy_in.model_dump().items():
        setattr(policy, k, v)
    db.commit()
    db.refresh(policy)
    return policy


@router.delete("/policies/{policy_id}")
def delete_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(ESGPolicy).filter(ESGPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(policy)
    db.commit()
    return {"message": "Deleted"}


# --- Policy Acknowledgements ---

@router.get("/acknowledgements", response_model=list[PolicyAcknowledgementRead])
def list_acknowledgements(
    policy_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(PolicyAcknowledgement)
    if policy_id:
        q = q.filter(PolicyAcknowledgement.policy_id == policy_id)
    if employee_id:
        q = q.filter(PolicyAcknowledgement.employee_id == employee_id)
    return q.all()


@router.post("/acknowledgements", response_model=PolicyAcknowledgementRead)
def create_acknowledgement(ack_in: PolicyAcknowledgementCreate, db: Session = Depends(get_db)):
    existing = db.query(PolicyAcknowledgement).filter(
        PolicyAcknowledgement.policy_id == ack_in.policy_id,
        PolicyAcknowledgement.employee_id == ack_in.employee_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Acknowledgement already exists for this employee and policy")
    ack = PolicyAcknowledgement(
        policy_id=ack_in.policy_id,
        employee_id=ack_in.employee_id,
        status="Pending",
        acknowledged_date=None,
    )
    db.add(ack)

    # Fetch the policy title so the notification is descriptive
    policy = db.query(ESGPolicy).filter(ESGPolicy.id == ack_in.policy_id).first()
    policy_title = policy.title if policy else "a new corporate policy"

    # Notification Logic: Initial reminder for the employee to sign the document
    notif = Notification(
        employee_id=ack_in.employee_id,
        title="Action Required: Policy Acknowledgement",
        message=f"Please review and acknowledge: {policy_title}."
    )
    db.add(notif)

    db.commit()
    db.refresh(ack)
    return ack


@router.put("/acknowledgements/{ack_id}/acknowledge", response_model=PolicyAcknowledgementRead)
def acknowledge_policy(ack_id: int, db: Session = Depends(get_db)):
    ack = db.query(PolicyAcknowledgement).filter(PolicyAcknowledgement.id == ack_id).first()
    if not ack:
        raise HTTPException(status_code=404, detail="Not found")
    ack.status = "Acknowledged"
    ack.acknowledged_date = datetime.utcnow()
    db.commit()
    db.refresh(ack)
    return ack


@router.get("/acknowledgements/pending/{employee_id}", response_model=list[PolicyAcknowledgementRead])
def pending_acknowledgements(employee_id: int, db: Session = Depends(get_db)):
    return db.query(PolicyAcknowledgement).filter(
        PolicyAcknowledgement.employee_id == employee_id,
        PolicyAcknowledgement.status == "Pending",
    ).all()


# --- Audits ---

@router.get("/audits", response_model=list[AuditRead])
def list_audits(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Audit)
    if status:
        q = q.filter(Audit.status == status)
    return q.all()


@router.get("/audits/{audit_id}", response_model=AuditRead)
def get_audit(audit_id: int, db: Session = Depends(get_db)):
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    return audit


@router.post("/audits", response_model=AuditRead)
def create_audit(audit_in: AuditCreate, db: Session = Depends(get_db)):
    audit = Audit(**audit_in.model_dump())
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit


@router.put("/audits/{audit_id}", response_model=AuditRead)
def update_audit(audit_id: int, audit_in: AuditUpdate, db: Session = Depends(get_db)):
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in audit_in.model_dump(exclude_none=True).items():
        setattr(audit, k, v)
    db.commit()
    db.refresh(audit)
    return audit


@router.delete("/audits/{audit_id}")
def delete_audit(audit_id: int, db: Session = Depends(get_db)):
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(audit)
    db.commit()
    return {"message": "Deleted"}


# --- Compliance Issues ---

@router.get("/compliance-issues", response_model=list[ComplianceIssueRead])
def list_compliance_issues(
    audit_id: Optional[int] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    owner_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    _flag_overdue_issues(db)  # Auto-flag overdue on every list call
    q = db.query(ComplianceIssue)
    if audit_id:
        q = q.filter(ComplianceIssue.audit_id == audit_id)
    if severity:
        q = q.filter(ComplianceIssue.severity == severity)
    if status:
        q = q.filter(ComplianceIssue.status == status)
    if owner_id:
        q = q.filter(ComplianceIssue.owner_id == owner_id)
    return q.all()


@router.get("/compliance-issues/{issue_id}", response_model=ComplianceIssueRead)
def get_compliance_issue(issue_id: int, db: Session = Depends(get_db)):
    _flag_overdue_issues(db)
    issue = db.query(ComplianceIssue).filter(ComplianceIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Not found")
    return issue


@router.post("/compliance-issues", response_model=ComplianceIssueRead)
def create_compliance_issue(issue_in: ComplianceIssueCreate, db: Session = Depends(get_db)):
    # Business Rule: owner_id and due_date are mandatory (enforced by schema)
    issue = ComplianceIssue(**issue_in.model_dump(), status="Open")
    db.add(issue)

    # Notification Logic: Alert the assigned owner with severity and due date
    notif = Notification(
        employee_id=issue.owner_id,
        title="New Compliance Issue Assigned",
        message=f"You have been assigned a {issue.severity} severity issue. Due Date: {issue.due_date.strftime('%Y-%m-%d')}"
    )
    db.add(notif)

    db.commit()
    db.refresh(issue)
    return issue


@router.put("/compliance-issues/{issue_id}", response_model=ComplianceIssueRead)
def update_compliance_issue(issue_id: int, issue_in: ComplianceIssueUpdate, db: Session = Depends(get_db)):
    issue = db.query(ComplianceIssue).filter(ComplianceIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in issue_in.model_dump(exclude_none=True).items():
        setattr(issue, k, v)
    db.commit()
    db.refresh(issue)
    return issue


@router.put("/compliance-issues/{issue_id}/resolve", response_model=ComplianceIssueRead)
def resolve_compliance_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(ComplianceIssue).filter(ComplianceIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Not found")
    issue.status = "Resolved"
    db.commit()
    db.refresh(issue)
    return issue


@router.delete("/compliance-issues/{issue_id}")
def delete_compliance_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(ComplianceIssue).filter(ComplianceIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(issue)
    db.commit()
    return {"message": "Deleted"}


# --- Governance Report ---

@router.get("/report")
def governance_report(
    audit_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    _flag_overdue_issues(db)

    issues_q = db.query(ComplianceIssue)
    if audit_id:
        issues_q = issues_q.filter(ComplianceIssue.audit_id == audit_id)
    if employee_id:
        issues_q = issues_q.filter(ComplianceIssue.owner_id == employee_id)
    issues = issues_q.all()

    audits_q = db.query(Audit)
    if date_from:
        audits_q = audits_q.filter(Audit.date >= date_from)
    if date_to:
        audits_q = audits_q.filter(Audit.date <= date_to)
    audits = audits_q.all()

    policies = db.query(ESGPolicy).all()
    pending_acks = db.query(PolicyAcknowledgement).filter(
        PolicyAcknowledgement.status == "Pending"
    ).count()

    return {
        "total_audits": len(audits),
        "total_policies": len(policies),
        "pending_acknowledgements": pending_acks,
        "compliance_issues_summary": {
            "total": len(issues),
            "open": sum(1 for i in issues if i.status == "Open"),
            "overdue": sum(1 for i in issues if i.status == "Overdue"),
            "resolved": sum(1 for i in issues if i.status == "Resolved"),
            "by_severity": {
                "Critical": sum(1 for i in issues if i.severity == "Critical"),
                "High": sum(1 for i in issues if i.severity == "High"),
                "Medium": sum(1 for i in issues if i.severity == "Medium"),
                "Low": sum(1 for i in issues if i.severity == "Low"),
            },
        },
        "issues": [
            {"id": i.id, "severity": i.severity, "status": i.status, "due_date": i.due_date, "owner_id": i.owner_id}
            for i in issues
        ],
    }

#---The Governance Report:V---

@router.get("/report")
def governance_report(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    Generates a localized report for the Governance module.
    
    This endpoint pulls compliance issues, audits, and policy acknowledgements,
    allowing the user to filter the data by a specific date range or a specific employee.
    
    Returns a dictionary containing the total audits conducted, a breakdown of 
    compliance issues by their current status (open, resolved, overdue), and 
    a count of policy acknowledgements that are still pending signatures.
    """
    
    """
    Fetch and filter Compliance Issues based on the provided query parameters.
    We iterate over the results to count how many issues fall into specific severity statuses.
    """
    q_issues = db.query(ComplianceIssue)
    if employee_id:
        q_issues = q_issues.filter(ComplianceIssue.owner_id == employee_id)
    if date_from:
        q_issues = q_issues.filter(ComplianceIssue.due_date >= date_from)
    if date_to:
        q_issues = q_issues.filter(ComplianceIssue.due_date <= date_to)
    
    issues = q_issues.all()
    open_issues = len([i for i in issues if i.status == "Open"])
    resolved_issues = len([i for i in issues if i.status == "Resolved"])
    overdue_issues = len([i for i in issues if i.status == "Overdue"])

    """
    Fetch and filter Audits conducted within the specified date range.
    """
    q_audits = db.query(Audit)
    if date_from:
        q_audits = q_audits.filter(Audit.date >= date_from)
    if date_to:
        q_audits = q_audits.filter(Audit.date <= date_to)
    audits = q_audits.all()

    """
    Fetch Policy Acknowledgements to find how many documents are still pending a signature
    from the requested employee (or all employees if no ID is provided).
    """
    q_acks = db.query(PolicyAcknowledgement)
    if employee_id:
        q_acks = q_acks.filter(PolicyAcknowledgement.employee_id == employee_id)
    acks = q_acks.all()
    pending_acks = len([a for a in acks if a.status == "Pending"])

    return {
        "audits_conducted": len(audits),
        "compliance_issues": {
            "total": len(issues),
            "open": open_issues,
            "resolved": resolved_issues,
            "overdue": overdue_issues
        },
        "pending_policy_acknowledgements": pending_acks
    }