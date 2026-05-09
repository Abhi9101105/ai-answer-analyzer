# main.py — FastAPI entry point for the AI Answer Grader API.

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from app.keygen import generate_answer_key, extract_points
from app.grading import grade, generate_feedback
from app.db import save_result, get_all_results, get_student_results

# -------------------------------
# App
# -------------------------------

app = FastAPI(
    title="AI Answer Grader",
    description="Grade student answers against AI-generated rubrics using semantic similarity.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Simple auth config
# -------------------------------

TEACHER_USERNAME = "admin"
TEACHER_PASSWORD = "admin123"
TEACHER_TOKEN = "teacher-secret-token"

# -------------------------------
# Request / Response schemas
# -------------------------------

class GradeRequest(BaseModel):
    name: str = Field(..., min_length=1, description="Student name")
    roll_no: str = Field(..., min_length=1, description="Student roll number")
    question: str = Field(..., min_length=1, description="The exam question")
    marks: int = Field(..., gt=0, description="Total marks available (must be > 0)")
    answer: str = Field(..., min_length=1, description="The student's answer")


class GradeResponse(BaseModel):
    score: float
    total: int
    feedback: str
    strengths: list[str]
    improvements: list[str]


class LoginRequest(BaseModel):
    username: str
    password: str

# -------------------------------
# Auth helper
# -------------------------------

def verify_teacher_token(authorization: str = Header(None)):
    """Check that the Authorization header contains the valid teacher token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing.")
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0] != "Bearer" or parts[1] != TEACHER_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

# -------------------------------
# Endpoints
# -------------------------------

@app.post("/login")
def login(req: LoginRequest):
    """Simple teacher login — returns a static token."""
    if req.username == TEACHER_USERNAME and req.password == TEACHER_PASSWORD:
        return {"token": TEACHER_TOKEN}
    raise HTTPException(status_code=401, detail="Invalid username or password.")


@app.post("/grade", response_model=GradeResponse)
def grade_answer(req: GradeRequest):
    """Grade a student answer against an AI-generated answer key."""

    # --- Validation ---
    if not req.name.strip():
        raise HTTPException(status_code=422, detail="Student name cannot be empty.")
    if not req.roll_no.strip():
        raise HTTPException(status_code=422, detail="Roll number cannot be empty.")
    if not req.question.strip():
        raise HTTPException(status_code=422, detail="Question cannot be empty or whitespace.")
    if not req.answer.strip():
        raise HTTPException(status_code=422, detail="Answer cannot be empty or whitespace.")
    if req.marks <= 0:
        raise HTTPException(status_code=422, detail="Marks must be greater than 0.")

    # --- Generate answer key ---
    try:
        raw_key = generate_answer_key(req.question.strip(), req.marks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Answer key generation failed: {e}")

    key_points = extract_points(raw_key)

    if len(key_points) < 2:
        raise HTTPException(
            status_code=500,
            detail="Could not generate enough key points. Check GEMINI_API_KEY in .env.",
        )

    # --- Grade ---
    try:
        score = grade(key_points, req.answer.strip(), req.marks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grading failed: {e}")

    # --- Generate feedback ---
    fb = generate_feedback(req.answer.strip(), key_points)

    # --- Save to MongoDB ---
    result = {
        "name": req.name.strip(),
        "roll_no": req.roll_no.strip(),
        "question": req.question,
        "answer": req.answer,
        "answer_key": key_points,
        "score": score,
        "marks": req.marks,
        "feedback": fb["feedback"],
        "strengths": fb["strengths"],
        "improvements": fb["improvements"],
    }
    print(f"📝 Saving result: {req.name} ({req.roll_no}) — score={score}/{req.marks}")
    save_result(result)

    # --- Return to student (NO answer_key exposed) ---
    return GradeResponse(
        score=score,
        total=req.marks,
        feedback=fb["feedback"],
        strengths=fb["strengths"],
        improvements=fb["improvements"],
    )


@app.get("/student/{roll_no}")
def student_history(roll_no: str):
    """Fetch all submissions for a specific student."""
    results = get_student_results(roll_no)
    return {"roll_no": roll_no, "count": len(results), "results": results}


@app.get("/results")
def list_results(
    roll_no: Optional[str] = None,
    authorization: str = Header(None),
):
    """Fetch grading results (teacher-only, requires auth token)."""
    verify_teacher_token(authorization)
    results = get_all_results(roll_no)
    return {"count": len(results), "results": results}


@app.get("/")
def root():
    """Health-check / welcome endpoint."""
    return {"message": "AI Answer Grader API is running."}
