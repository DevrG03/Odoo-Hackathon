from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models.social import CSRActivity, EmployeeParticipation
from app.models.user import Employee
from app.models.platform import ESGConfig
from app.schemas.social import (
    CSRActivityCreate, CSRActivityRead,
    EmployeeParticipationCreate, EmployeeParticipationApprove, EmployeeParticipationRead,
)

router = APIRouter()


# --- CSR Activities ---

@router.get("/activities", response_model=list[CSRActivityRead])
def list_activities(category_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(CSRActivity)
    if category_id:
        q = q.filter(CSRActivity.category_id == category_id)
    return q.all()


@router.get("/activities/{activity_id}", response_model=CSRActivityRead)
def get_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(CSRActivity).filter(CSRActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.post("/activities", response_model=CSRActivityRead)
def create_activity(activity_in: CSRActivityCreate, db: Session = Depends(get_db)):
    activity = CSRActivity(**activity_in.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.put("/activities/{activity_id}", response_model=CSRActivityRead)
def update_activity(activity_id: int, activity_in: CSRActivityCreate, db: Session = Depends(get_db)):
    activity = db.query(CSRActivity).filter(CSRActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in activity_in.model_dump().items():
        setattr(activity, k, v)
    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/activities/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(CSRActivity).filter(CSRActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(activity)
    db.commit()
    return {"message": "Deleted"}


# --- Employee Participation ---

@router.get("/participations", response_model=list[EmployeeParticipationRead])
def list_participations(
    employee_id: Optional[int] = None,
    activity_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(EmployeeParticipation)
    if employee_id:
        q = q.filter(EmployeeParticipation.employee_id == employee_id)
    if activity_id:
        q = q.filter(EmployeeParticipation.activity_id == activity_id)
    if status:
        q = q.filter(EmployeeParticipation.approval_status == status)
    return q.all()


@router.get("/participations/{participation_id}", response_model=EmployeeParticipationRead)
def get_participation(participation_id: int, db: Session = Depends(get_db)):
    p = db.query(EmployeeParticipation).filter(EmployeeParticipation.id == participation_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return p


@router.post("/participations", response_model=EmployeeParticipationRead)
def create_participation(p_in: EmployeeParticipationCreate, db: Session = Depends(get_db)):
    # Business Rule: Evidence Requirement check
    config = db.query(ESGConfig).filter(ESGConfig.id == 1).first()
    evidence_required = config.evidence_requirement_enabled if config else False

    activity = db.query(CSRActivity).filter(CSRActivity.id == p_in.activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="CSR Activity not found")

    if evidence_required and not p_in.proof_url:
        raise HTTPException(
            status_code=400,
            detail="Proof URL is required (Evidence Requirement is enabled in ESG Config)"
        )

    participation = EmployeeParticipation(
        employee_id=p_in.employee_id,
        activity_id=p_in.activity_id,
        proof_url=p_in.proof_url,
        approval_status="Pending",
        points_earned=0,
        completion_date=datetime.utcnow(),
    )
    db.add(participation)
    db.commit()
    db.refresh(participation)
    return participation


@router.put("/participations/{participation_id}/approve", response_model=EmployeeParticipationRead)
def approve_participation(
    participation_id: int,
    approval_in: EmployeeParticipationApprove,
    db: Session = Depends(get_db),
):
    p = db.query(EmployeeParticipation).filter(EmployeeParticipation.id == participation_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")

    if approval_in.approval_status not in ("Approved", "Rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'Approved' or 'Rejected'")

    # Business Rule: Evidence Requirement — cannot approve without proof
    config = db.query(ESGConfig).filter(ESGConfig.id == 1).first()
    evidence_required = config.evidence_requirement_enabled if config else False
    if evidence_required and approval_in.approval_status == "Approved" and not p.proof_url:
        raise HTTPException(
            status_code=400,
            detail="Cannot approve: no proof URL attached and Evidence Requirement is enabled"
        )

    p.approval_status = approval_in.approval_status

    if approval_in.approval_status == "Approved":
        activity = db.query(CSRActivity).filter(CSRActivity.id == p.activity_id).first()
        if activity:
            p.points_earned = activity.points_offered
            # Award points to the employee
            employee = db.query(Employee).filter(Employee.id == p.employee_id).first()
            if employee:
                employee.total_points += activity.points_offered

    db.commit()
    db.refresh(p)
    return p


# --- Social Report ---

@router.get("/report")
def social_report(
    employee_id: Optional[int] = None,
    activity_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    q = db.query(EmployeeParticipation)
    if employee_id:
        q = q.filter(EmployeeParticipation.employee_id == employee_id)
    if activity_id:
        q = q.filter(EmployeeParticipation.activity_id == activity_id)
    if date_from:
        q = q.filter(EmployeeParticipation.completion_date >= date_from)
    if date_to:
        q = q.filter(EmployeeParticipation.completion_date <= date_to)

    participations = q.all()
    approved = [p for p in participations if p.approval_status == "Approved"]
    total_points_awarded = sum(p.points_earned for p in approved)

    return {
        "total_participations": len(participations),
        "approved_count": len(approved),
        "total_points_awarded": total_points_awarded,
        "participations": [
            {
                "id": p.id,
                "employee_id": p.employee_id,
                "activity_id": p.activity_id,
                "status": p.approval_status,
                "points_earned": p.points_earned,
                "completion_date": p.completion_date,
            }
            for p in participations
        ],
    }