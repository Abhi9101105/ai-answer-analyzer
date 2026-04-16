from fastapi import FastAPI

app = FastAPI(
    title="AI Answer Grader",
    version="test"
)

@app.get("/")
def root():
    return {"message": "API is running 🚀"}