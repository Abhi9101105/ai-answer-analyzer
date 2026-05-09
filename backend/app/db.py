# db.py — MongoDB connection and helpers.

from datetime import datetime, timezone
from pymongo import MongoClient

# Import MONGODB_URI from config to guarantee .env was loaded first
from app.config import MONGODB_URI

# --- Connect to MongoDB ---
db = None
results_collection = None

if not MONGODB_URI:
    print("⚠  MongoDB: skipping connection (no MONGODB_URI).")
else:
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        db = client["ai_grader"]
        results_collection = db["results"]
        print(f"✅ MongoDB connected — database: ai_grader, collection: results")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("   Check MONGODB_URI in .env and make sure MongoDB is running.")


def save_result(data: dict) -> bool:
    """Insert a grading result into MongoDB with a created_at timestamp."""
    if results_collection is None:
        print("⚠  MongoDB not configured — result was NOT saved.")
        return False

    try:
        data["created_at"] = datetime.now(timezone.utc)
        results_collection.insert_one(data)
        print(f"✅ Result saved to MongoDB (score: {data.get('score')})")
        return True
    except Exception as e:
        print(f"❌ Failed to save result: {e}")
        return False


def get_all_results(roll_no: str = None) -> list[dict]:
    """
    Fetch grading results from MongoDB, newest first.
    If roll_no is provided, filter by that student only.
    Converts _id (ObjectId) to a plain string.
    """
    if results_collection is None:
        return []

    try:
        query = {"roll_no": roll_no} if roll_no else {}
        cursor = results_collection.find(query).sort("created_at", -1)
        results = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    except Exception as e:
        print(f"❌ Failed to fetch results: {e}")
        return []


def get_student_results(roll_no: str) -> list[dict]:
    """Fetch all submissions for a specific student, newest first."""
    if results_collection is None:
        return []

    try:
        cursor = results_collection.find({"roll_no": roll_no}).sort("created_at", -1)
        results = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    except Exception as e:
        print(f"❌ Failed to fetch student results: {e}")
        return []
