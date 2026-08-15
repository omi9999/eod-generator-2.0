from fastapi import APIRouter, HTTPException
from cryptography.fernet import Fernet
from ..models.schemas import ApiKeyRequest
from ..database import get_supabase, is_supabase_available
from ..config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize cipher with the encryption key from environment
try:
    cipher = Fernet(settings.ENCRYPTION_KEY.encode())
except Exception as e:
    logger.error(f"Invalid ENCRYPTION_KEY: {e}")
    # We still define cipher as None, but all endpoints will fail with 500
    cipher = None

@router.post("/api-keys")
async def save_api_key(req: ApiKeyRequest):
    """
    Save an API key securely.
    The key is encrypted before storing in Supabase.
    The frontend never receives the decrypted value.
    """
    if cipher is None:
        raise HTTPException(status_code=500, detail="Encryption not configured")

    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Supabase not available")

    # Encrypt the key
    encrypted_value = cipher.encrypt(req.key_value.encode()).decode()

    supabase = get_supabase()

    # Check if key_name already exists
    existing = supabase.table("user_config") \
        .select("*") \
        .eq("key_name", req.key_name) \
        .execute()

    if existing.data:
        # Update existing key
        supabase.table("user_config") \
            .update({"encrypted_value": encrypted_value}) \
            .eq("key_name", req.key_name) \
            .execute()
    else:
        # Insert new key
        supabase.table("user_config") \
            .insert({"key_name": req.key_name, "encrypted_value": encrypted_value}) \
            .execute()

    return {"status": "saved", "key_name": req.key_name}

@router.delete("/api-keys/{key_name}")
async def delete_api_key(key_name: str):
    """
    Delete an API key from storage.
    """
    if cipher is None:
        raise HTTPException(status_code=500, detail="Encryption not configured")

    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Supabase not available")

    supabase = get_supabase()
    result = supabase.table("user_config") \
        .delete() \
        .eq("key_name", key_name) \
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Key not found")

    return {"status": "deleted", "key_name": key_name}

@router.get("/api-keys")
async def list_api_keys():
    """
    Return the list of key names (but NOT the values).
    This is useful to check which keys are stored.
    """
    if cipher is None:
        raise HTTPException(status_code=500, detail="Encryption not configured")

    if not is_supabase_available():
        return []

    supabase = get_supabase()
    result = supabase.table("user_config") \
        .select("key_name, created_at") \
        .execute()
    return result.data