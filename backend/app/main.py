from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import generation, employees, history, config   # <-- added config
from .database import init_supabase
from .config import settings

app = FastAPI(
    title="EOD Report Generator API",
    description="Generate end-of-day reports with AI",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(generation.router, prefix="/api/generation", tags=["Generation"])
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(config.router, prefix="/api/config", tags=["Config"])   # <-- new

@app.on_event("startup")
async def startup():
    init_supabase()
    print("✅ Supabase initialised")
    print("🚀 Backend ready")

@app.get("/")
async def root():
    return {"message": "EOD Report Generator API", "status": "running"}