# We import Base first, followed by all models. 
# This file is used by alembic/env.py to load all tables into Base.metadata
# so Alembic knows what tables to generate migration scripts for.
from app.database import Base
from .user import User, Employee
from .platform import Department, Category, DepartmentScore
from .environmental import EmissionFactor, ProductESGProfile, EnvironmentalGoal, CarbonTransaction
from .social import CSRActivity, EmployeeParticipation
from .gamification import Challenge, ChallengeParticipation, Badge, Reward
from .governance import ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue