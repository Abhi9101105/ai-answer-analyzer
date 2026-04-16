# config.py — Environment setup and shared client instances.

import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai

# Load .env from backend/ directory (works regardless of where the script is run)
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

# API key — never hardcoded
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    print(f"✅ GEMINI_API_KEY loaded ({GEMINI_API_KEY[:8]}...)")
else:
    print("⚠ GEMINI_API_KEY not found — using fallback answer key generation.")

# MongoDB URI
MONGODB_URI = os.getenv("MONGODB_URI")

if MONGODB_URI:
    print(f"✅ MONGODB_URI loaded ({MONGODB_URI[:20]}...)")
else:
    print("⚠ MONGODB_URI not found — database features disabled.")

# Lightweight client only (safe at import)
gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None