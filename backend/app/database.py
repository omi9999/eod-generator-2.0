from supabase import create_client, Client
from .config import settings

_supabase: Client = None

def init_supabase():
    """
    Initialize the Supabase client.
    If credentials are missing or invalid, set _supabase to None.
    """
    global _supabase
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        print("⚠️ Supabase credentials missing. History and employees will not work.")
        _supabase = None
        return

    try:
        _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        print("✅ Supabase client initialised")
    except Exception as e:
        print(f"❌ Error initializing Supabase: {e}")
        _supabase = None

def get_supabase() -> Client:
    """
    Returns the Supabase client.
    If it's not initialised, calls init_supabase() first.
    """
    global _supabase
    if _supabase is None:
        init_supabase()
    return _supabase

def is_supabase_available() -> bool:
    """
    Returns True if the Supabase client is ready to use.
    """
    global _supabase
    if _supabase is None:
        init_supabase()
    return _supabase is not None