from app.keygen import generate_answer_key, extract_points
from app.grading import grade, generate_feedback
from fastapi import FastAPI

app = FastAPI(
    title="AI Answer Grader",
    version="test"
)

@app.get("/")
def root():
    return {"message": "API is running 🚀"}