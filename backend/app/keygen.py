# keygen.py — Gemini-powered answer key generation.

import re
from app.config import gemini_client


def generate_answer_key(question, total_marks):
    """
    Ask Gemini to produce key points scaled to the mark allocation.
    Fewer marks → fewer, broader points.
    More marks  → more points with greater specificity.
    """
    num_points = max(3, min(int(total_marks), 10))

    if not gemini_client:
        # Generic fallback when Gemini is unavailable
        return "\n".join([
            f"- the answer should address the core concept asked in: {question}",
            "- the response should include relevant details and examples",
            "- key terms related to the topic should be used correctly",
        ])

    prompt = f"""
You are building a grading rubric. Each key point will be compared semantically to a student's answer using a sentence embedding model.

Question: {question}
Total marks: {total_marks}
Number of key points to generate: {num_points}

Rules:
- Return EXACTLY {num_points} bullet points, each starting with "-"
- No bold, asterisks, colons, headers, or markdown
- Each point must be a FULL DESCRIPTIVE SENTENCE (8-15 words)
- Points must be specific and self-contained — a student sentence covering that concept must score high similarity
- Scale depth to marks: for {total_marks} marks, {"focus on core definition and 1-2 key facts only" if total_marks <= 2 else "cover definition, mechanism, types or variants, and applications proportionally"}
- Points must be topic-specific to the question — do NOT generate generic or off-topic points

Bad example:  - the topic is important
Good example: - photosynthesis converts sunlight into glucose using chlorophyll in plant cells
"""

    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"\n⚠  Gemini API error: {e}\nFalling back to generic key points.")
        return "\n".join([
            f"- the answer should address the core concept asked in: {question}",
            "- the response should include relevant details and examples",
            "- key terms related to the topic should be used correctly",
        ])


def extract_points(raw_key):
    """Parse the raw Gemini output into a clean list of lowercase key-point strings."""
    points = []
    for line in raw_key.split("\n"):
        line = line.strip()
        line = re.sub(r"\*\*.*?\*\*\s*:?\s*", "", line).strip()   # strip **bold:**
        if line.startswith("-") or line.startswith("*"):
            point = re.sub(r"^[-*]\s*", "", line).strip()
            if ":" in point:
                point = point.split(":")[0].strip()
            point = re.sub(r"[*_`]", "", point).strip()
            if len(point) > 5:
                points.append(point.lower())

    seen, unique = set(), []
    for p in points:
        if p not in seen:
            seen.add(p)
            unique.append(p)
    return unique
