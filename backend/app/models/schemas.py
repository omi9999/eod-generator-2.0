from pydantic import BaseModel
from typing import List, Optional

class ScheduleEntry(BaseModel):
    slot: str
    activity: str
    description: str

class GenerateRequest(BaseModel):
    user_tasks: str
    employee_name: str
    position: str
    report_date: str
    provider: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None
    lunch_hour: int = 13   # default 1 PM

class GenerateResponse(BaseModel):
    employee_name: str
    position: str
    date: str
    schedule: List[ScheduleEntry]
    excel_base64: str
    pdf_base64: str

class Employee(BaseModel):
    name: str
    position: str

class ApiKeyRequest(BaseModel):
    key_name: str
    key_value: str

class HistoryFilter(BaseModel):
    employee_name: Optional[str] = None