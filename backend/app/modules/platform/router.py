from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.platform import Department, Category, ESGConfig, DepartmentScore
from app.schemas.platform import (
    DepartmentCreate, DepartmentRead,
    CategoryCreate, CategoryRead,
    ESGConfigRead, ESGConfigUpdate,
    DepartmentScoreRead
)
from app.models.environmental import CarbonTransaction
from app.models.social import EmployeeParticipation
from app.models.governance import ComplianceIssue
from app.models.notification import Notification
from app.schemas.notification import NotificationRead
from datetime import datetime
import csv
from io import StringIO
from fastapi import Response

router = APIRouter()


# --- Departments ---

@router.get("/departments", response_model=list[DepartmentRead])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()


@router.get("/departments/{dept_id}", response_model=DepartmentRead)
def get_department(dept_id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


@router.post("/departments", response_model=DepartmentRead)
def create_department(dept_in: DepartmentCreate, db: Session = Depends(get_db)):
    dept = Department(**dept_in.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.put("/departments/{dept_id}", response_model=DepartmentRead)
def update_department(dept_id: int, dept_in: DepartmentCreate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for k, v in dept_in.model_dump().items():
        setattr(dept, k, v)
    db.commit()
    db.refresh(dept)
    return dept


@router.delete("/departments/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"message": "Deleted"}


# --- Categories ---

@router.get("/categories", response_model=list[CategoryRead])
def list_categories(type: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Category)
    if type:
        q = q.filter(Category.type == type)
    return q.all()


@router.get("/categories/{cat_id}", response_model=CategoryRead)
def get_category(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


@router.post("/categories", response_model=CategoryRead)
def create_category(cat_in: CategoryCreate, db: Session = Depends(get_db)):
    cat = Category(**cat_in.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/categories/{cat_id}", response_model=CategoryRead)
def update_category(cat_id: int, cat_in: CategoryCreate, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for k, v in cat_in.model_dump().items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(cat)
    db.commit()
    return {"message": "Deleted"}


# --- ESG Config (single row, id=1) ---

@router.get("/config", response_model=ESGConfigRead)
def get_config(db: Session = Depends(get_db)):
    config = db.query(ESGConfig).filter(ESGConfig.id == 1).first()
    if not config:
        config = ESGConfig(id=1)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.put("/config", response_model=ESGConfigRead)
def update_config(config_in: ESGConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(ESGConfig).filter(ESGConfig.id == 1).first()
    if not config:
        config = ESGConfig(id=1)
        db.add(config)
    for k, v in config_in.model_dump(exclude_none=True).items():
        setattr(config, k, v)
    db.commit()
    db.refresh(config)
    return config


# --- Department Scores ---

@router.get("/scores", response_model=list[DepartmentScoreRead])
def list_scores(db: Session = Depends(get_db)):
    return db.query(DepartmentScore).all()


@router.get("/scores/{dept_id}", response_model=DepartmentScoreRead)
def get_score(dept_id: int, db: Session = Depends(get_db)):
    score = db.query(DepartmentScore).filter(DepartmentScore.department_id == dept_id).first()
    if not score:
        raise HTTPException(status_code=404, detail="Score not found")
    return score


@router.post("/scores/recalculate/{dept_id}", response_model=DepartmentScoreRead)
def recalculate_score(
    dept_id: int,
    env_score: float,
    soc_score: float,
    gov_score: float,
    db: Session = Depends(get_db),
):
    score = db.query(DepartmentScore).filter(DepartmentScore.department_id == dept_id).first()
    if not score:
        score = DepartmentScore(department_id=dept_id)
        db.add(score)
    score.environmental_score = env_score
    score.social_score = soc_score
    score.governance_score = gov_score
    # Spec: Environmental 40% / Social 30% / Governance 30%
    score.total_score = round(env_score * 0.4 + soc_score * 0.3 + gov_score * 0.3, 2)
    db.commit()
    db.refresh(score)
    return score


# --- Overall ESG Dashboard ---

@router.get("/dashboard")
def overall_dashboard(db: Session = Depends(get_db)):
    scores = db.query(DepartmentScore).all()
    if not scores:
        return {"overall_esg_score": 0, "departments": []}
    overall = round(sum(s.total_score for s in scores) / len(scores), 2)
    return {
        "overall_esg_score": overall,
        "departments": [
            {
                "department_id": s.department_id,
                "environmental_score": s.environmental_score,
                "social_score": s.social_score,
                "governance_score": s.governance_score,
                "total_score": s.total_score,
            }
            for s in scores
        ],
    }


# --- Notifications ---

@router.get("/notifications/{employee_id}", response_model=list[NotificationRead])
def get_employee_notifications(employee_id: int, db: Session = Depends(get_db)):
    """
    Retrieves all notifications for a specific employee.
    Results are ordered by created_at descending so the newest notifications appear first.
    """
    return db.query(Notification).filter(
        Notification.employee_id == employee_id
    ).order_by(Notification.created_at.desc()).all()

@router.put("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    """
    Updates the is_read flag to True. 
    This should be called by the frontend when a user clicks on a notification 
    or opens the notification center.
    """
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "success"}
# ---The ESG Summary Report (Custom Report Builder)---

@router.get("/reports/esg-summary")
def esg_summary_report(
    department_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    export_format: Optional[str] = "json",
    db: Session = Depends(get_db),
):
    """
    The Custom Report Builder endpoint.
    
    This function aggregates data across the Environmental, Social, and Governance 
    domains to produce a single, unified summary report. It supports dynamic filtering 
    by department, employee, and date ranges.
    
    If the 'export_format' parameter is set to 'csv', the function bypasses the JSON 
    response and instead streams a raw text/csv file directly to the client.
    """
    
    """
    Section 1: Environmental Data
    Fetches carbon transactions and calculates the sum of all emissions 
    (in kgCO2e) matching the applied department and date filters.
    """
    q_carbon = db.query(CarbonTransaction)
    if department_id:
        q_carbon = q_carbon.filter(CarbonTransaction.department_id == department_id)
    if date_from:
        q_carbon = q_carbon.filter(CarbonTransaction.date >= date_from)
    if date_to:
        q_carbon = q_carbon.filter(CarbonTransaction.date <= date_to)
    
    total_emissions = sum(t.calculated_emissions for t in q_carbon.all())

    """
    Section 2: Social Data
    Fetches employee CSR participations. It isolates only the 'Approved' 
    participations to calculate the total valid CSR points awarded to employees.
    """
    q_participation = db.query(EmployeeParticipation)
    if employee_id:
        q_participation = q_participation.filter(EmployeeParticipation.employee_id == employee_id)
    if date_from:
        q_participation = q_participation.filter(EmployeeParticipation.completion_date >= date_from)
    if date_to:
        q_participation = q_participation.filter(EmployeeParticipation.completion_date <= date_to)
    
    participations = q_participation.all()
    approved_social = [p for p in participations if p.approval_status == "Approved"]
    social_points = sum(p.points_earned for p in approved_social)

    """
    Section 3: Governance Data
    Fetches compliance issues assigned to employees. It calculates the raw count 
    of total issues, unresolved open issues, and critically overdue issues.
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
    overdue_issues = len([i for i in issues if i.status == "Overdue"])

    """
    Section 4: Department Scores and Overall Aggregate
    Retrieves the pre-calculated department scores. If a specific department 
    is requested, it averages only that department's scores. Otherwise, it 
    averages the total score across the entire organization.
    """
    q_scores = db.query(DepartmentScore)
    if department_id:
        q_scores = q_scores.filter(DepartmentScore.department_id == department_id)
    scores = q_scores.all()
    
    overall_score = 0.0
    if scores:
        overall_score = round(sum(s.total_score for s in scores) / len(scores), 2)

    """
    Section 5: Native CSV Export Logic
    If requested, formats the aggregated metrics into standard comma-separated 
    values. We use StringIO as an in-memory buffer to construct the file 
    before returning it as a downloadable attachment via FastAPI Response.
    """
    if export_format.lower() == "csv":
        csv_file = StringIO()
        writer = csv.writer(csv_file)
        
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Overall ESG Score", overall_score])
        writer.writerow(["Total Emissions (kgCO2e)", round(total_emissions, 4)])
        writer.writerow(["Approved CSR Activities", len(approved_social)])
        writer.writerow(["Total CSR Points Awarded", social_points])
        writer.writerow(["Total Compliance Issues", len(issues)])
        writer.writerow(["Open Compliance Issues", open_issues])
        writer.writerow(["Overdue Compliance Issues", overdue_issues])
        
        return Response(
            content=csv_file.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=esg_summary_report.csv"}
        )

    """
    Section 6: Default JSON Response
    Constructs a structured JSON payload detailing the requested report metadata 
    and the calculated metrics for each individual ESG domain.
    """
    return {
        "report_metadata": {
            "department_id": department_id,
            "employee_id": employee_id,
            "date_from": date_from,
            "date_to": date_to
        },
        "overall_esg_score": overall_score,
        "environmental_summary": {
            "total_calculated_emissions_kgCO2e": round(total_emissions, 4)
        },
        "social_summary": {
            "total_approved_csr_activities": len(approved_social),
            "total_csr_points_awarded": social_points
        },
        "governance_summary": {
            "total_compliance_issues": len(issues),
            "open_issues": open_issues,
            "overdue_issues": overdue_issues
        }
    }