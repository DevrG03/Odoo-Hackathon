from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="EcoSphere API",
    description="Backend for the EcoSphere ESG Management Platform",
    version="1.0.0"
)

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "EcoSphere API is running."}

# TODO: Add modular routers here:
# from app.modules.environmental.router import router as env_router
# app.include_router(env_router, prefix="/api/v1/environmental", tags=["Environmental"])