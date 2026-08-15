from fastapi import APIRouter, HTTPException
from ..models.schemas import Employee
from ..database import get_supabase, is_supabase_available

router = APIRouter()

@router.get("/")
async def list_employees():
    if not is_supabase_available():
        # Return empty list instead of failing – client will see no employees
        return []
    supabase = get_supabase()
    resp = supabase.table("employees").select("*").execute()
    return resp.data

@router.post("/")
async def add_employee(emp: Employee):
    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Supabase not available")
    supabase = get_supabase()
    # Check if exists
    existing = supabase.table("employees").select("*").eq("name", emp.name).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Employee already exists")
    resp = supabase.table("employees").insert({"name": emp.name, "position": emp.position}).execute()
    return resp.data[0]

@router.delete("/{name}")
async def delete_employee(name: str):
    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Supabase not available")
    supabase = get_supabase()
    resp = supabase.table("employees").delete().eq("name", name).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"status": "deleted"}