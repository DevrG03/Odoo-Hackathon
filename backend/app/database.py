from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Create the SQLAlchemy engine using the Neon DB connection string
engine = create_engine(settings.NEON_DB_CONN_STRING)

# SessionLocal is the factory for creating database sessions for each request
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class that all our ORM models will inherit from
Base = declarative_base()

# Dependency function to be used in FastAPI routes (e.g., Depends(get_db))
# This ensures the database connection is safely closed after every request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()