from fastapi import APIRouter, Query, HTTPException
from ..models.schemas import HistoryFilter
from ..database import get_supabase, is_supabase_available

router = APIRouter()

@router.get("/")
async def get_history(employee_name: str = Query(None)):
    if not is_supabase_available():
        return []
    supabase = get_supabase()
    query = supabase.table("history").select("*").order("created_at", desc=True)
    if employee_name:
        query = query.eq("employee_name", employee_name)
    resp = query.execute()
    return resp.data

# ---- Delete a single entry ----
@router.delete("/{entry_id}")
async def delete_history(entry_id: str):
    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Supabase not available")
    supabase = get_supabase()
    existing = supabase.table("history").select("id").eq("id", entry_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Entry not found")
    supabase.table("history").delete().eq("id", entry_id).execute()
    return {"status": "deleted", "id": entry_id}

# ---- NEW: Delete all entries for a specific employee ----
@router.delete("/employee/{employee_name}")
async def delete_employee_history(employee_name: str):
    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Supabase not available")
    supabase = get_supabase()
    # Check if any entries exist
    existing = supabase.table("history").select("id").eq("employee_name", employee_name).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="No entries found for this employee")
    # Delete all
    supabase.table("history").delete().eq("employee_name", employee_name).execute()
    return {"status": "deleted", "employee_name": employee_name, "count": len(existing.data)}