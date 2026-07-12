from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models.environmental import (
    EmissionFactor, ProductESGProfile, EnvironmentalGoal, CarbonTransaction
)
from app.models.platform import ESGConfig
from app.schemas.environmental import (
    EmissionFactorCreate, EmissionFactorRead,
    ProductESGProfileCreate, ProductESGProfileRead,
    EnvironmentalGoalCreate, EnvironmentalGoalUpdate, EnvironmentalGoalRead,
    CarbonTransactionCreate, CarbonTransactionRead,
)

router = APIRouter()


# --- Emission Factors ---

@router.get("/emission-factors", response_model=list[EmissionFactorRead])
def list_emission_factors(db: Session = Depends(get_db)):
    return db.query(EmissionFactor).all()


@router.get("/emission-factors/{factor_id}", response_model=EmissionFactorRead)
def get_emission_factor(factor_id: int, db: Session = Depends(get_db)):
    factor = db.query(EmissionFactor).filter(EmissionFactor.id == factor_id).first()
    if not factor:
        raise HTTPException(status_code=404, detail="Emission factor not found")
    return factor


@router.post("/emission-factors", response_model=EmissionFactorRead)
def create_emission_factor(factor_in: EmissionFactorCreate, db: Session = Depends(get_db)):
    factor = EmissionFactor(**factor_in.model_dump())
    db.add(factor)
    db.commit()
    db.refresh(factor)
    return factor


@router.put("/emission-factors/{factor_id}", response_model=EmissionFactorRead)
def update_emission_factor(factor_id: int, factor_in: EmissionFactorCreate, db: Session = Depends(get_db)):
    factor = db.query(EmissionFactor).filter(EmissionFactor.id == factor_id).first()
    if not factor:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in factor_in.model_dump().items():
        setattr(factor, k, v)
    db.commit()
    db.refresh(factor)
    return factor


@router.delete("/emission-factors/{factor_id}")
def delete_emission_factor(factor_id: int, db: Session = Depends(get_db)):
    factor = db.query(EmissionFactor).filter(EmissionFactor.id == factor_id).first()
    if not factor:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(factor)
    db.commit()
    return {"message": "Deleted"}


# --- Product ESG Profiles ---

@router.get("/product-profiles", response_model=list[ProductESGProfileRead])
def list_product_profiles(db: Session = Depends(get_db)):
    return db.query(ProductESGProfile).all()


@router.get("/product-profiles/{profile_id}", response_model=ProductESGProfileRead)
def get_product_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(ProductESGProfile).filter(ProductESGProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Not found")
    return profile


@router.post("/product-profiles", response_model=ProductESGProfileRead)
def create_product_profile(profile_in: ProductESGProfileCreate, db: Session = Depends(get_db)):
    profile = ProductESGProfile(**profile_in.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.put("/product-profiles/{profile_id}", response_model=ProductESGProfileRead)
def update_product_profile(profile_id: int, profile_in: ProductESGProfileCreate, db: Session = Depends(get_db)):
    profile = db.query(ProductESGProfile).filter(ProductESGProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in profile_in.model_dump().items():
        setattr(profile, k, v)
    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/product-profiles/{profile_id}")
def delete_product_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(ProductESGProfile).filter(ProductESGProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(profile)
    db.commit()
    return {"message": "Deleted"}


# --- Environmental Goals ---

@router.get("/goals", response_model=list[EnvironmentalGoalRead])
def list_goals(department_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(EnvironmentalGoal)
    if department_id:
        q = q.filter(EnvironmentalGoal.department_id == department_id)
    return q.all()


@router.get("/goals/{goal_id}", response_model=EnvironmentalGoalRead)
def get_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(EnvironmentalGoal).filter(EnvironmentalGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Not found")
    return goal


@router.post("/goals", response_model=EnvironmentalGoalRead)
def create_goal(goal_in: EnvironmentalGoalCreate, db: Session = Depends(get_db)):
    goal = EnvironmentalGoal(**goal_in.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/goals/{goal_id}", response_model=EnvironmentalGoalRead)
def update_goal(goal_id: int, goal_in: EnvironmentalGoalUpdate, db: Session = Depends(get_db)):
    goal = db.query(EnvironmentalGoal).filter(EnvironmentalGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in goal_in.model_dump(exclude_none=True).items():
        setattr(goal, k, v)
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(EnvironmentalGoal).filter(EnvironmentalGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(goal)
    db.commit()
    return {"message": "Deleted"}


# --- Carbon Transactions (with Auto Emission Calculation) ---

@router.get("/carbon-transactions", response_model=list[CarbonTransactionRead])
def list_carbon_transactions(
    department_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    q = db.query(CarbonTransaction)
    if department_id:
        q = q.filter(CarbonTransaction.department_id == department_id)
    if date_from:
        q = q.filter(CarbonTransaction.date >= date_from)
    if date_to:
        q = q.filter(CarbonTransaction.date <= date_to)
    return q.all()


@router.get("/carbon-transactions/{tx_id}", response_model=CarbonTransactionRead)
def get_carbon_transaction(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(CarbonTransaction).filter(CarbonTransaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Not found")
    return tx


@router.post("/carbon-transactions", response_model=CarbonTransactionRead)
def create_carbon_transaction(tx_in: CarbonTransactionCreate, db: Session = Depends(get_db)):
    data = tx_in.model_dump()
    if data.get("date") is None:
        data["date"] = datetime.utcnow()

    # Business Rule: Auto Emission Calculation
    config = db.query(ESGConfig).filter(ESGConfig.id == 1).first()
    auto_calc = config.auto_emission_calculation_enabled if config else True

    calculated_emissions = 0.0
    if auto_calc and data.get("emission_factor_id"):
        factor = db.query(EmissionFactor).filter(EmissionFactor.id == data["emission_factor_id"]).first()
        if factor:
            calculated_emissions = round(data["value"] * factor.value, 6)

    tx = CarbonTransaction(**data, calculated_emissions=calculated_emissions)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/carbon-transactions/{tx_id}")
def delete_carbon_transaction(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(CarbonTransaction).filter(CarbonTransaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(tx)
    db.commit()
    return {"message": "Deleted"}


# --- Environmental Report ---

@router.get("/report")
def environmental_report(
    department_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    q = db.query(CarbonTransaction)
    if department_id:
        q = q.filter(CarbonTransaction.department_id == department_id)
    if date_from:
        q = q.filter(CarbonTransaction.date >= date_from)
    if date_to:
        q = q.filter(CarbonTransaction.date <= date_to)
    transactions = q.all()

    goals_q = db.query(EnvironmentalGoal)
    if department_id:
        goals_q = goals_q.filter(EnvironmentalGoal.department_id == department_id)
    goals = goals_q.all()

    total_emissions = sum(t.calculated_emissions for t in transactions)

    return {
        "total_transactions": len(transactions),
        "total_calculated_emissions_kgCO2e": round(total_emissions, 4),
        "goals_summary": [
            {
                "id": g.id,
                "title": g.title,
                "target_value": g.target_value,
                "current_value": g.current_value,
                "progress_pct": round((g.current_value / g.target_value) * 100, 1) if g.target_value else 0,
                "deadline": g.deadline,
            }
            for g in goals
        ],
        "transactions": [
            {"id": t.id, "source": t.source, "value": t.value, "calculated_emissions": t.calculated_emissions, "date": t.date}
            for t in transactions
        ],
    }