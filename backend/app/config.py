from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # This automatically looks for NEON_DB_CONN_STRING in your environment or .env file
    NEON_DB_CONN_STRING: str
    
    # Instructs Pydantic to read from the .env file in the root directory
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Instantiate settings so it can be imported across the app
settings = Settings()