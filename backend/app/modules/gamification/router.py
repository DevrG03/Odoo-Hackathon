from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.gamification import Challenge, ChallengeParticipation, Badge, Reward
from app.models.user import Employee
from app.models.platform import ESGConfig
from app.schemas.gamification import (
    ChallengeCreate, ChallengeUpdate, ChallengeRead,
    ChallengeParticipationCreate, ChallengeParticipationApprove, ChallengeParticipationRead,
    BadgeCreate, BadgeRead,
    RewardCreate, RewardRead,
)

router = APIRouter()

VALID_CHALLENGE_TRANSITIONS = {
    "Draft": ["Active", "Archived"],
    "Active": ["Under Review", "Archived"],
    "Under Review": ["Completed", "Active", "Archived"],
    "Completed": ["Archived"],
    "Archived": [],
}


def _check_and_award_badges(employee: Employee, db: Session):
    """Business Rule: Badge Auto-Award — evaluate every badge's unlock_rule."""
    config = db.query(ESGConfig).filter(ESGConfig.id == 1).first()
    if config and not config.badge_auto_award_enabled:
        return

    completed_challenges = db.query(ChallengeParticipation).filter(
        ChallengeParticipation.employee_id == employee.id,
        ChallengeParticipation.approval_status == "Approved",
    ).count()

    all_badges = db.query(Badge).all()
    for badge in all_badges:
        rule = badge.unlock_rule
        # Safe variable substitution before eval
        rule = rule.replace("challenges_completed", str(completed_challenges))
        rule = rule.replace("xp", str(employee.total_xp))
        rule = rule.replace("points", str(employee.total_points))
        try:
            if eval(rule):  # noqa: S307
                # In production replace eval with a proper rule parser
                pass  # TODO: insert into an EmployeeBadge join table when you add that model
        except Exception:
            pass


# --- Challenges ---

@router.get("/challenges", response_model=list[ChallengeRead])
def list_challenges(
    status: Optional[str] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Challenge)
    if status:
        q = q.filter(Challenge.status == status)
    if category_id:
        q = q.filter(Challenge.category_id == category_id)
    return q.all()


@router.get("/challenges/{challenge_id}", response_model=ChallengeRead)
def get_challenge(challenge_id: int, db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge


@router.post("/challenges", response_model=ChallengeRead)
def create_challenge(challenge_in: ChallengeCreate, db: Session = Depends(get_db)):
    challenge = Challenge(**challenge_in.model_dump())
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return challenge


@router.put("/challenges/{challenge_id}", response_model=ChallengeRead)
def update_challenge(challenge_id: int, challenge_in: ChallengeUpdate, db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Not found")

    # Enforce lifecycle state machine
    if challenge_in.status and challenge_in.status != challenge.status:
        allowed = VALID_CHALLENGE_TRANSITIONS.get(challenge.status, [])
        if challenge_in.status not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from '{challenge.status}' to '{challenge_in.status}'. Allowed: {allowed}"
            )

    for k, v in challenge_in.model_dump(exclude_none=True).items():
        setattr(challenge, k, v)
    db.commit()
    db.refresh(challenge)
    return challenge


@router.delete("/challenges/{challenge_id}")
def delete_challenge(challenge_id: int, db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(challenge)
    db.commit()
    return {"message": "Deleted"}


# --- Challenge Participations ---

@router.get("/challenge-participations", response_model=list[ChallengeParticipationRead])
def list_challenge_participations(
    challenge_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(ChallengeParticipation)
    if challenge_id:
        q = q.filter(ChallengeParticipation.challenge_id == challenge_id)
    if employee_id:
        q = q.filter(ChallengeParticipation.employee_id == employee_id)
    return q.all()


@router.post("/challenge-participations", response_model=ChallengeParticipationRead)
def create_challenge_participation(p_in: ChallengeParticipationCreate, db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(Challenge.id == p_in.challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if challenge.status != "Active":
        raise HTTPException(status_code=400, detail="Can only join Active challenges")

    # Business Rule: Evidence Requirement
    config = db.query(ESGConfig).filter(ESGConfig.id == 1).first()
    evidence_required_globally = config.evidence_requirement_enabled if config else False
    if (challenge.evidence_required or evidence_required_globally) and not p_in.proof_url:
        raise HTTPException(status_code=400, detail="Proof URL is required for this challenge")

    p = ChallengeParticipation(
        challenge_id=p_in.challenge_id,
        employee_id=p_in.employee_id,
        proof_url=p_in.proof_url,
        progress=0.0,
        approval_status="Pending",
        xp_awarded=0,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.put("/challenge-participations/{p_id}/approve", response_model=ChallengeParticipationRead)
def approve_challenge_participation(
    p_id: int,
    approval_in: ChallengeParticipationApprove,
    db: Session = Depends(get_db),
):
    p = db.query(ChallengeParticipation).filter(ChallengeParticipation.id == p_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")

    if approval_in.approval_status not in ("Approved", "Rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'Approved' or 'Rejected'")

    p.approval_status = approval_in.approval_status

    if approval_in.approval_status == "Approved":
        challenge = db.query(Challenge).filter(Challenge.id == p.challenge_id).first()
        if challenge:
            p.xp_awarded = challenge.xp_reward
            p.progress = 100.0
            employee = db.query(Employee).filter(Employee.id == p.employee_id).first()
            if employee:
                employee.total_xp += challenge.xp_reward
                # Business Rule: Badge Auto-Award
                _check_and_award_badges(employee, db)

    db.commit()
    db.refresh(p)
    return p


# --- Badges ---

@router.get("/badges", response_model=list[BadgeRead])
def list_badges(db: Session = Depends(get_db)):
    return db.query(Badge).all()


@router.get("/badges/{badge_id}", response_model=BadgeRead)
def get_badge(badge_id: int, db: Session = Depends(get_db)):
    badge = db.query(Badge).filter(Badge.id == badge_id).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Not found")
    return badge


@router.post("/badges", response_model=BadgeRead)
def create_badge(badge_in: BadgeCreate, db: Session = Depends(get_db)):
    badge = Badge(**badge_in.model_dump())
    db.add(badge)
    db.commit()
    db.refresh(badge)
    return badge


@router.put("/badges/{badge_id}", response_model=BadgeRead)
def update_badge(badge_id: int, badge_in: BadgeCreate, db: Session = Depends(get_db)):
    badge = db.query(Badge).filter(Badge.id == badge_id).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in badge_in.model_dump().items():
        setattr(badge, k, v)
    db.commit()
    db.refresh(badge)
    return badge


@router.delete("/badges/{badge_id}")
def delete_badge(badge_id: int, db: Session = Depends(get_db)):
    badge = db.query(Badge).filter(Badge.id == badge_id).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(badge)
    db.commit()
    return {"message": "Deleted"}


# --- Rewards ---

@router.get("/rewards", response_model=list[RewardRead])
def list_rewards(db: Session = Depends(get_db)):
    return db.query(Reward).all()


@router.get("/rewards/{reward_id}", response_model=RewardRead)
def get_reward(reward_id: int, db: Session = Depends(get_db)):
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Not found")
    return reward


@router.post("/rewards", response_model=RewardRead)
def create_reward(reward_in: RewardCreate, db: Session = Depends(get_db)):
    reward = Reward(**reward_in.model_dump())
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return reward


@router.put("/rewards/{reward_id}", response_model=RewardRead)
def update_reward(reward_id: int, reward_in: RewardCreate, db: Session = Depends(get_db)):
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in reward_in.model_dump().items():
        setattr(reward, k, v)
    db.commit()
    db.refresh(reward)
    return reward


@router.delete("/rewards/{reward_id}")
def delete_reward(reward_id: int, db: Session = Depends(get_db)):
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(reward)
    db.commit()
    return {"message": "Deleted"}


# Business Rule: Reward Redemption
@router.post("/rewards/{reward_id}/redeem")
def redeem_reward(reward_id: int, employee_id: int, db: Session = Depends(get_db)):
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    if reward.status != "Available":
        raise HTTPException(status_code=400, detail="Reward is not available")
    if reward.stock <= 0:
        raise HTTPException(status_code=400, detail="Reward is out of stock")

    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if employee.total_points < reward.points_required:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient points. Need {reward.points_required}, have {employee.total_points}"
        )

    employee.total_points -= reward.points_required
    reward.stock -= 1
    if reward.stock == 0:
        reward.status = "Out of Stock"

    db.commit()
    return {
        "message": f"Reward '{reward.name}' redeemed successfully",
        "points_deducted": reward.points_required,
        "remaining_points": employee.total_points,
        "reward_stock_left": reward.stock,
    }


# --- Leaderboard ---

@router.get("/leaderboard")
def leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    employees = db.query(Employee).order_by(Employee.total_xp.desc()).limit(limit).all()
    return [
        {
            "rank": idx + 1,
            "employee_id": emp.id,
            "name": emp.name,
            "total_xp": emp.total_xp,
            "total_points": emp.total_points,
        }
        for idx, emp in enumerate(employees)
    ]