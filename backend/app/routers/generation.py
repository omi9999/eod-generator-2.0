from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from ..models.schemas import GenerateRequest, GenerateResponse, ScheduleEntry
from ..services.ai_service import generate_schedule, get_time_slots
from ..services.excel_service import create_excel_bytes
from ..services.pdf_service import create_pdf_bytes
from ..database import get_supabase, is_supabase_available
import base64
import traceback
from datetime import datetime
from typing import List

router = APIRouter()

# ============================================================
#  1. Generate Report (with AI)
# ============================================================
@router.post("/generate", response_model=GenerateResponse)
async def generate_report(req: GenerateRequest, background_tasks: BackgroundTasks):
    try:
        # AI generation
        data = await generate_schedule(
            user_tasks=req.user_tasks,
            employee_name=req.employee_name,
            position=req.position,
            report_date=req.report_date,
            provider=req.provider,
            model=req.model,
            api_key=req.api_key,
            lunch_hour=req.lunch_hour,
        )
    except Exception as e:
        print("❌ AI generation error:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    try:
        time_slots = get_time_slots(req.lunch_hour)
        excel_bytes = create_excel_bytes(data, time_slots=time_slots)
        pdf_bytes = create_pdf_bytes(data, excel_bytes)
    except Exception as e:
        print("❌ Report creation error:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

    excel_base64 = base64.b64encode(excel_bytes).decode("utf-8")
    pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")

    if is_supabase_available():
        background_tasks.add_task(save_history, data)
    else:
        print("⚠️ Supabase not available – history not saved")

    return GenerateResponse(
        employee_name=data["employee_name"],
        position=data["position"],
        date=data["date"],
        schedule=[ScheduleEntry(**item) for item in data["schedule"]],
        excel_base64=excel_base64,
        pdf_base64=pdf_base64,
    )

# ============================================================
#  2. Update Report (from edited schedule)
# ============================================================
class UpdateRequest(BaseModel):
    employee_name: str
    position: str
    report_date: str
    schedule: List[ScheduleEntry]
    lunch_hour: int = 13

@router.post("/update", response_model=GenerateResponse)
async def update_report(req: UpdateRequest):
    try:
        schedule_dicts = [item.dict() for item in req.schedule]
        data = {
            "employee_name": req.employee_name,
            "position": req.position,
            "date": req.report_date,
            "schedule": schedule_dicts,
        }
        time_slots = get_time_slots(req.lunch_hour)
        excel_bytes = create_excel_bytes(data, time_slots=time_slots)
        pdf_bytes = create_pdf_bytes(data, excel_bytes)
    except Exception as e:
        print("❌ Update error:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

    excel_base64 = base64.b64encode(excel_bytes).decode("utf-8")
    pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")

    return GenerateResponse(
        employee_name=data["employee_name"],
        position=data["position"],
        date=data["date"],
        schedule=[ScheduleEntry(**item) for item in data["schedule"]],
        excel_base64=excel_base64,
        pdf_base64=pdf_base64,
    )

# ============================================================
#  Helper
# ============================================================
def save_history(data):
    try:
        if not is_supabase_available():
            return
        supabase = get_supabase()
        history_entry = {
            "employee_name": data["employee_name"],
            "position": data["position"],
            "date": data["date"],
            "schedule": data["schedule"],
            "created_at": datetime.utcnow().isoformat(),
        }
        supabase.table("history").insert(history_entry).execute()
    except Exception as e:
        print(f"❌ Failed to save history: {e}")