import re
import json
import ast
import time
import random
import httpx
from groq import Groq
import openai
import google.generativeai as genai
from ..config import settings
from ..database import is_supabase_available, get_supabase
from cryptography.fernet import Fernet

# ---------- Encryption setup ----------
ENCRYPTION_KEY = settings.ENCRYPTION_KEY
if ENCRYPTION_KEY:
    try:
        cipher = Fernet(ENCRYPTION_KEY.encode())
    except Exception as e:
        cipher = None
        print(f"⚠️ Invalid ENCRYPTION_KEY: {e} – decryption disabled")
else:
    cipher = None
    print("⚠️ ENCRYPTION_KEY not set – cannot decrypt stored API keys")

# ---------- Helper: Time slot generators ----------
def get_time_slots(lunch_hour):
    slots = []
    for h in range(10, 18):
        start = h
        end = h + 1
        if h < 12:
            start_str = f"{h:02d}:00 am"
        elif h == 12:
            start_str = "12:00 pm"
        else:
            start_str = f"{h-12:02d}:00 pm"
        if end < 12:
            end_str = f"{end:02d}:00 am"
        elif end == 12:
            end_str = "12:00 pm"
        else:
            end_str = f"{end-12:02d}:00 pm"
        slots.append(f"{start_str} to {end_str}")
    return slots

def get_time_slots_short(lunch_hour):
    slots = []
    for h in range(10, 18):
        start = h
        end = h + 1
        start_str = f"{start:02d}:00"
        end_str = f"{end:02d}:00"
        slots.append(f"{start_str}-{end_str}")
    return slots

def create_short_to_full_map(lunch_hour):
    short = get_time_slots_short(lunch_hour)
    full = get_time_slots(lunch_hour)
    return dict(zip(short, full))

def get_full_to_short_map(lunch_hour):
    short_to_full = create_short_to_full_map(lunch_hour)
    return {v: k for k, v in short_to_full.items()}

def get_hour_from_slot_label(slot_label):
    match = re.match(r'(\d{1,2}):00 (am|pm)', slot_label.split(' to ')[0])
    if match:
        hour = int(match.group(1))
        if match.group(2) == 'pm' and hour != 12:
            hour += 12
        elif match.group(2) == 'am' and hour == 12:
            hour = 0
        return hour
    return None

# ---------- Professional description templates ----------
PROFESSIONAL_TEMPLATES = [
    "Reviewed and finalized {task} to ensure alignment with the project goals.",
    "Prepared {task} for the next phase of the campaign.",
    "Executed {task} with attention to detail and accuracy.",
    "Organized {task} and documented key takeaways.",
    "Developed {task} to support the team's objectives.",
    "Created {task} as part of the weekly deliverables.",
    "Monitored {task} and made necessary adjustments.",
    "Analyzed {task} to identify opportunities for improvement.",
    "Updated {task} and submitted for review.",
    "Coordinated {task} with cross-functional teams.",
    "Drafted {task} and shared it with the stakeholders.",
    "Refined {task} based on feedback from the team.",
    "Finalized {task} and prepared it for deployment.",
    "Reviewed {task} to ensure it meets the required standards.",
    "Compiled {task} and presented the findings to the team.",
]

def generate_professional_description(task):
    """Generate a professional, direct description for a given task."""
    template = random.choice(PROFESSIONAL_TEMPLATES)
    task_clean = task.rstrip('.')
    return template.format(task=task_clean)

# ---------- Mock generator with professional descriptions ----------
MOCK_ACTIVITIES = [
    "Content planning",
    "Team sync meetings",
    "Documentation update",
    "Code review and quality checks",
    "Sprint planning",
    "Market research",
    "Client communication",
    "Performance monitoring"
]

MOCK_DESCRIPTIONS = [
    "Reviewed the content calendar and aligned it with the monthly goals.",
    "Attended the daily stand-up and sync meetings with the team.",
    "Updated the project documentation with recent changes.",
    "Conducted code reviews and ensured quality standards.",
    "Planned the next sprint and prioritized the backlog.",
    "Analyzed market trends and compiled a summary report.",
    "Responded to client emails and cleared pending queries.",
    "Monitored system performance and identified optimization opportunities."
]

def generate_mock_schedule(user_tasks, employee_name, position, report_date, lunch_hour=13):
    slots = get_time_slots(lunch_hour)
    lunch_index = lunch_hour - 10
    full_to_short = get_full_to_short_map(lunch_hour)

    # Parse user tasks
    task_mapping = {}
    for line in user_tasks.split('\n'):
        line = line.strip()
        if not line:
            continue
        match = re.match(r'^(\d{2}:\d{2}-\d{2}:\d{2})\s*:\s*(.*)$', line)
        if match:
            short_time, task = match.groups()
            task = task.strip()
            task_mapping[short_time] = task

    schedule = []
    for i, slot in enumerate(slots):
        short = full_to_short.get(slot)
        if i == lunch_index:
            schedule.append({"slot": slot, "activity": "Lunch Break", "description": "Lunch Break"})
        elif short and short in task_mapping:
            task = task_mapping[short]
            if task == "-":
                schedule.append({"slot": slot, "activity": "-", "description": "-"})
            else:
                activity = task[:50]
                description = generate_professional_description(task)
                schedule.append({"slot": slot, "activity": activity, "description": description})
        else:
            idx = i % len(MOCK_ACTIVITIES)
            activity = MOCK_ACTIVITIES[idx]
            description = MOCK_DESCRIPTIONS[idx]
            schedule.append({"slot": slot, "activity": activity, "description": description})

    return {
        "employee_name": employee_name,
        "position": position,
        "date": report_date,
        "schedule": schedule
    }

# ---------- Main generation function ----------
async def generate_schedule(user_tasks, employee_name, position, report_date,
                            provider=None, model=None, api_key=None, lunch_hour=13):
    if provider is None:
        provider = settings.DEFAULT_PROVIDER

    # Resolve API key
    if not api_key:
        if is_supabase_available() and cipher is not None:
            supabase = get_supabase()
            key_name = provider.split()[0].lower()
            resp = supabase.table("user_config").select("encrypted_value").eq("key_name", key_name).execute()
            if resp.data:
                encrypted = resp.data[0]["encrypted_value"]
                try:
                    api_key = cipher.decrypt(encrypted.encode()).decode()
                    print(f"🔑 Loaded {key_name} key from Supabase")
                except Exception as e:
                    print(f"❌ Decryption failed: {e}")
        elif not is_supabase_available():
            print("⚠️ Supabase not available – cannot fetch stored key")

    if not api_key:
        if provider.startswith("Groq"):
            api_key = settings.GROQ_API_KEY
        elif provider.startswith("OpenAI"):
            api_key = settings.OPENAI_API_KEY
        elif provider.startswith("Google"):
            api_key = settings.GEMINI_API_KEY

    # Check if we have a valid key
    has_api_key = False
    if provider == "Ollama (local)":
        has_api_key = True
    elif provider.startswith("Groq") or provider.startswith("OpenAI") or provider.startswith("Google"):
        has_api_key = bool(api_key)
    else:
        has_api_key = False

    if not has_api_key:
        print("⚠️ No API key available – using mock schedule")
        return generate_mock_schedule(user_tasks, employee_name, position, report_date, lunch_hour)

    # Build slots and lunch label
    slot_labels = get_time_slots(lunch_hour)
    lunch_label = slot_labels[lunch_hour - 10]
    short_to_full = create_short_to_full_map(lunch_hour)
    full_to_short = get_full_to_short_map(lunch_hour)

    # Parse user tasks
    task_mapping = {}
    for line in user_tasks.split('\n'):
        line = line.strip()
        if not line:
            continue
        match = re.match(r'^(\d{2}:\d{2}-\d{2}:\d{2})\s*:\s*(.*)$', line)
        if match:
            short_time, task = match.groups()
            task = task.strip()
            task_mapping[short_time] = task

    # Build prompt – professional descriptions requested
    slot_list = "\n".join([f"- {s}" for s in slot_labels])
    prompt = f"""
You are an assistant that fills an End of Day work report.

The report has exactly these 8 hourly slots (lunch break is fixed at **{lunch_label}** – you MUST set activity="Lunch Break" and description="Lunch Break" for that slot):

{slot_list}

All slots must be filled. Do not leave any slot empty.

The user has provided the following tasks for specific time slots (short slot → task). If a task is "-", you must set activity and description to "-" for that slot.
{json.dumps(task_mapping, indent=2)}

Instructions:
- For each time slot, you must generate a **short, concise activity title** (2‑5 words) based on the user's provided task.
- Write a **professional, clear description** (1‑2 sentences) that describes the work done. Use action verbs and be specific – e.g., "Reviewed the performance metrics and identified areas for improvement." Avoid casual phrases like "worked on", "spent time", "made progress".
- If the user's task is "-", set both activity and description to "-".
- If a slot has no user task, invent a reasonable activity and description that fits the role.
- For the lunch slot, always use activity="Lunch Break" and description="Lunch Break".

Return **only** a valid JSON object with:
- "employee_name" (use the provided name)
- "position" (use the provided position)
- "date" (use the provided date)
- "schedule": an array of objects with keys "slot", "activity", "description". Include exactly the above 8 slots in the correct order.

Use double quotes for all keys and string values. No trailing commas. Do not include any text outside the JSON.

Employee: {employee_name}
Position: {position}
Date: {report_date}
"""

    timeout_seconds = 60 if provider == "Ollama (local)" else 30
    max_retries = 2
    raw = None

    for attempt in range(max_retries):
        try:
            if provider == "Groq (Fastest)":
                client = Groq(api_key=api_key)
                response = client.chat.completions.create(
                    model=model or PROVIDERS[provider]["default_model"],
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=600,
                    timeout=timeout_seconds
                )
                raw = response.choices[0].message.content

            elif provider == "OpenAI (ChatGPT)":
                client = openai.OpenAI(api_key=api_key)
                response = client.chat.completions.create(
                    model=model or PROVIDERS[provider]["default_model"],
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=600,
                    timeout=timeout_seconds
                )
                raw = response.choices[0].message.content

            elif provider == "Google Gemini":
                genai.configure(api_key=api_key)
                model_obj = genai.GenerativeModel(model or PROVIDERS[provider]["default_model"])
                response = model_obj.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(temperature=0.3, max_output_tokens=600),
                    request_options={"timeout": timeout_seconds}
                )
                raw = response.text

            elif provider == "Ollama (local)":
                async with httpx.AsyncClient() as client:
                    await client.get("http://localhost:11434", timeout=5)
                openai_client = openai.OpenAI(
                    base_url=settings.OLLAMA_BASE_URL,
                    api_key="dummy"
                )
                response = openai_client.chat.completions.create(
                    model=model or PROVIDERS[provider]["default_model"],
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=600,
                    timeout=timeout_seconds
                )
                raw = response.choices[0].message.content

            else:
                raise ValueError("Unsupported provider")
            break

        except Exception as e:
            if attempt == max_retries - 1:
                print(f"❌ AI call failed: {e} – using mock")
                return generate_mock_schedule(user_tasks, employee_name, position, report_date, lunch_hour)
            time.sleep(2)
            continue

    if raw is None:
        print("⚠️ No response from AI – using mock")
        return generate_mock_schedule(user_tasks, employee_name, position, report_date, lunch_hour)

    # Parse JSON
    try:
        data = extract_and_clean_json(raw)
    except Exception as e:
        print(f"⚠️ JSON parsing failed: {e} – using mock")
        return generate_mock_schedule(user_tasks, employee_name, position, report_date, lunch_hour)

    # Post‑process: ensure all slots are filled and descriptions are professional
    schedule_dict = {entry.get("slot", "").strip(): entry for entry in data.get("schedule", []) if "slot" in entry}
    complete_schedule = []

    # Professional fallback activities and descriptions
    generic_activities = [
        "Content planning and scheduling",
        "Team collaboration and meetings",
        "Documentation and reporting",
        "Code review and quality checks",
        "Sprint planning and backlog grooming",
        "Market research and analysis",
        "Client communication and follow-ups",
        "Performance monitoring and optimization"
    ]
    generic_descriptions = [
        "Reviewed the content calendar and aligned it with the monthly goals.",
        "Attended the daily stand-up and sync meetings with the team.",
        "Updated the project documentation with recent changes.",
        "Conducted code reviews and ensured quality standards.",
        "Planned the next sprint and prioritized the backlog.",
        "Analyzed market trends and compiled a summary report.",
        "Responded to client emails and cleared pending queries.",
        "Monitored system performance and identified optimization opportunities."
    ]

    for idx, slot in enumerate(slot_labels):
        short = full_to_short.get(slot)
        user_task = task_mapping.get(short, "")

        if slot == lunch_label:
            complete_schedule.append({"slot": slot, "activity": "Lunch Break", "description": "Lunch Break"})
            continue

        # Check if user explicitly set "-"
        if user_task == "-":
            complete_schedule.append({"slot": slot, "activity": "-", "description": "-"})
            continue

        # Get AI entry if exists
        ai_entry = schedule_dict.get(slot)

        if user_task and user_task.strip():
            # User provided a task – use it as activity, generate professional description
            activity = user_task[:50]
            description = generate_professional_description(user_task)
            complete_schedule.append({"slot": slot, "activity": activity, "description": description})
        elif ai_entry:
            # Use AI's description if it's good, otherwise replace with professional version
            activity = ai_entry.get("activity", generic_activities[idx % len(generic_activities)])
            description = ai_entry.get("description", "")
            # If AI description is empty, too generic, or contains casual phrases, replace it
            casual_phrases = ["worked on", "spent time", "made progress", "worked diligently", "focused on", "tackled", "handled", "invested time"]
            if (not description or 
                len(description) < 10 or
                any(phrase in description.lower() for phrase in casual_phrases) or
                "No description" in description):
                description = generate_professional_description(activity)
            complete_schedule.append({"slot": slot, "activity": activity, "description": description})
        else:
            # No user task, no AI – use generic fallback
            activity = generic_activities[idx % len(generic_activities)]
            description = generic_descriptions[idx % len(generic_descriptions)]
            complete_schedule.append({"slot": slot, "activity": activity, "description": description})

    data["schedule"] = complete_schedule
    data["employee_name"] = data.get("employee_name", employee_name)
    data["position"] = data.get("position", position)
    data["date"] = data.get("date", report_date)
    return data

# ---------- JSON extraction helper ----------
def extract_and_clean_json(raw_text):
    raw_text = re.sub(r'```json\s*', '', raw_text)
    raw_text = re.sub(r'```\s*', '', raw_text)
    start = raw_text.find('{')
    end = raw_text.rfind('}')
    if start == -1 or end == -1:
        raise ValueError("No JSON object found")
    json_str = raw_text[start:end+1]

    try:
        return json.loads(json_str)
    except:
        pass

    json_str = re.sub(r'([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', json_str)
    json_str = re.sub(r',\s*([}\]])', r'\1', json_str)

    try:
        return json.loads(json_str)
    except:
        pass

    try:
        py_str = json_str.replace('null', 'None').replace('true', 'True').replace('false', 'False')
        return ast.literal_eval(py_str)
    except:
        pass

    raise ValueError("Could not parse JSON")