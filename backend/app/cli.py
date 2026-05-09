# cli.py — Minimal CLI entry point for local testing.

from app.keygen import generate_answer_key, extract_points
from app.grading import grade


def get_student_answer():
    """Read a multi-line student answer from stdin, ending with 'END'."""
    print()
    print("Enter your answer below.")
    print('When you are done, type  END  on a new line and press Enter.')
    print("-" * 40)
    lines = []
    while True:
        try:
            line = input()
        except EOFError:
            break
        if line.strip().upper() == "END":
            break
        lines.append(line)
    return "\n".join(lines).strip()


def main():
    print()
    print("=" * 52)
    print("           AI ANSWER GRADER")
    print("=" * 52)

    # Step 1 — question
    print("\nQuestion:")
    question = input("> ").strip()
    while not question:
        print("Question cannot be empty.\nQuestion:")
        question = input("> ").strip()

    # Step 2 — marks
    print("\nMarks available:")
    while True:
        raw = input("> ").strip()
        try:
            total_marks = int(raw)
            if total_marks < 1:
                raise ValueError
            break
        except ValueError:
            print("Please enter a whole number greater than 0 (e.g. 5).\nMarks available:")

    # Step 3 — generate answer key
    print("\nGenerating answer key...", end="", flush=True)
    raw_key = generate_answer_key(question, total_marks)
    key_points = extract_points(raw_key)
    print(" done.")

    if len(key_points) < 2:
        print("\n⚠  Could not generate enough key points.")
        print("Check your GEMINI_API_KEY in .env and try again.")
        return

    print("\nAnswer Key:")
    print("-" * 40)
    for i, point in enumerate(key_points, 1):
        print(f"  {i}. {point.capitalize()}")
    print("-" * 40)

    # Step 4 — student answer
    student_answer = get_student_answer()

    if not student_answer:
        print(f"\nNo answer entered.")
        print(f"Score: 0 / {total_marks}")
        return

    # Step 5 — grade
    print("\nGrading...", end="", flush=True)
    score = grade(key_points, student_answer, total_marks)
    print(" done.")

    # Step 6 — result
    percentage = (score / total_marks) * 100

    if percentage >= 85:
        label = "Excellent"
    elif percentage >= 65:
        label = "Good"
    elif percentage >= 40:
        label = "Partial credit"
    else:
        label = "Needs improvement"

    print()
    print("=" * 52)
    print(f"  Score:  {score} / {total_marks}  ({percentage:.1f}%)")
    print(f"  Grade:  {label}")
    print("=" * 52)
    print()


if __name__ == "__main__":
    main()
