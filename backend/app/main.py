from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.modules.auth.router import router as auth_router
from app.modules.platform.router import router as platform_router
from app.modules.environmental.router import router as env_router
from app.modules.social.router import router as social_router
from app.modules.gamification.router import router as gamification_router
from app.modules.governance.router import router as governance_router

app = FastAPI(
    title="EcoSphere API",
    description="Backend for the EcoSphere ESG Management Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,         prefix="/api/v1/auth",          tags=["Auth"])
app.include_router(platform_router,     prefix="/api/v1/platform",      tags=["Platform"])
app.include_router(env_router,          prefix="/api/v1/environmental",  tags=["Environmental"])
app.include_router(social_router,       prefix="/api/v1/social",         tags=["Social"])
app.include_router(gamification_router, prefix="/api/v1/gamification",   tags=["Gamification"])
app.include_router(governance_router,   prefix="/api/v1/governance",     tags=["Governance"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "EcoSphere API is running."}