from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey, Float, DateTime, JSON
from datetime import datetime
from app.database import Base

class EmissionFactor(Base):
    """
    Master Data: The multiplier used to convert raw usage into CO2 emissions.
    (e.g., Name: 'Electricity Grid UK', Unit: 'kgCO2e/kWh', Value: 0.233)
    """
    __tablename__ = "emission_factors"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String)
    unit: Mapped[str] = mapped_column(String)
    value: Mapped[float] = mapped_column(Float)
    
class ProductESGProfile(Base):
    """Master Data: Stores flexible, unstructured ESG JSON data for products."""
    __tablename__ = "product_esg_profiles"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String)
    esg_data: Mapped[dict] = mapped_column(JSON) 

class EnvironmentalGoal(Base):
    """Tracks sustainability targets over time for a specific department."""
    __tablename__ = "environmental_goals"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=True)
    title: Mapped[str] = mapped_column(String)
    target_value: Mapped[float] = mapped_column(Float)
    current_value: Mapped[float] = mapped_column(Float, default=0.0)
    deadline: Mapped[datetime] = mapped_column(DateTime)

class CarbonTransaction(Base):
    """
    Transactional Data: The core of the Environmental Engine.
    Raw business operations (purchases, fleet usage) are recorded here.
    """
    __tablename__ = "carbon_transactions"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    
    source: Mapped[str] = mapped_column(String) # E.g., 'Fleet Fuel', 'Office Electricity'
    value: Mapped[float] = mapped_column(Float) # The raw usage number (e.g., 500 liters)
    
    # Links to the factor used for calculation
    emission_factor_id: Mapped[int] = mapped_column(ForeignKey("emission_factors.id"), nullable=True)
    
    # Business Rule Output: calculated_emissions = value * emission_factor.value
    calculated_emissions: Mapped[float] = mapped_column(Float, default=0.0)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)