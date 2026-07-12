from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.platform import Department, Category, ESGConfig, DepartmentScore
from app.schemas.platform import (
    DepartmentCreate, DepartmentRead,
    CategoryCreate, CategoryRead,
    ESGConfigRead, ESGConfigUpdate,
    DepartmentScoreRead,
)

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