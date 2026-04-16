# grading.py — Core grading logic.

import re
from app.helpers import split_sentences, similarity, is_keyword_spam


def score_key_points(key_points, student_sentences, marks_per_point):
    """Score each key point against the best-matching student sentence."""
    total, covered = 0.0, 0.0
    for point in key_points:
        best = 0.0
        for sent in student_sentences:
            if len(sent.split()) < 3:
                continue
            best = max(best, similarity(point, sent))
        if best >= 0.55:
            total += marks_per_point
            covered += 1
        elif best >= 0.42:
            total += marks_per_point * 0.5
            covered += 0.5
    ratio = covered / len(key_points) if key_points else 0
    return total, ratio


def term_coverage_ratio(student_text, key_points):
    """
    Measures how much domain-specific vocabulary the student used.
    Checks BOTH directions:
      - Forward: How many rubric terms did the student use?
      - Reverse: How many unique technical terms did the student use
                 that are domain-relevant, even if not in the rubric?
    Takes the max so different-but-valid terminology isn't penalised.
    """
    stopwords = {"the", "and", "for", "that", "this", "with", "from", "into",
                 "are", "its", "also", "back", "when", "their", "have", "been",
                 "they", "which", "through", "vital", "global", "essential",
                 "using", "these", "based", "world", "include", "involves",
                 "powers", "excels", "about", "where", "after", "other",
                 "until", "many", "most", "more", "such", "each", "very"}

    # Forward: fraction of rubric terms found in student answer
    kp_words = set()
    for pt in key_points:
        for w in re.findall(r"[a-z]+", pt.lower()):
            if len(w) > 4 and w not in stopwords:
                kp_words.add(w)

    if not kp_words:
        return 1.0

    student_words = set(re.findall(r"[a-z]+", student_text.lower()))
    forward = sum(1 for w in kp_words if w in student_words) / len(kp_words)

    # Reverse: unique technical words (>5 chars, not stopwords)
    student_technical = {w for w in student_words if len(w) > 5 and w not in stopwords}
    reverse = min(1.0, len(student_technical) / max(len(kp_words), 1))

    return max(forward, reverse)


def grade(key_points, student_answer, total_marks):
    """
    Grade a student answer against a list of key points.
    Returns a numeric score out of total_marks.
    """
    if not key_points:
        return 0.0

    word_count = len(student_answer.split())

    if word_count < 8:
        return round(0.08 * total_marks, 2)

    if is_keyword_spam(student_answer):
        return round(0.12 * total_marks, 2)

    sentences = split_sentences(student_answer)
    marks_per_point = (0.65 * total_marks) / len(key_points)

    # 1. Semantic core (65%)
    core, coverage_ratio = score_key_points(key_points, sentences, marks_per_point)
    core = min(core, 0.65 * total_marks)

    # Term coverage gate
    tcr = term_coverage_ratio(student_answer, key_points)
    if tcr < 0.20:
        core *= 0.40
    elif tcr < 0.35:
        core *= 0.65
    elif tcr < 0.50:
        core *= 0.85

    # 2. Depth — only rewarded if coverage is also strong
    avg_len = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
    if coverage_ratio >= 0.5 and avg_len >= 15:
        depth = 0.20 * total_marks
    elif coverage_ratio >= 0.4 and avg_len >= 10:
        depth = 0.14 * total_marks
    elif coverage_ratio >= 0.3 and avg_len >= 6:
        depth = 0.05 * total_marks
    else:
        depth = 0

    # 3. Breadth (15%) — did the student cover both halves of the rubric?
    half = max(1, len(key_points) // 2)
    first_half  = key_points[:half]
    second_half = key_points[half:]

    def count_hits(pts):
        hits = 0
        for pt in pts:
            for sent in sentences:
                if len(sent.split()) >= 3 and similarity(pt, sent) >= 0.44:
                    hits += 1
                    break
        return hits

    first_hits  = count_hits(first_half)
    second_hits = count_hits(second_half)
    first_covered  = first_hits  >= max(1, len(first_half)  // 2)
    second_covered = second_hits >= max(1, len(second_half) // 2)
    breadth = (sum([first_covered, second_covered]) / 2) * (0.15 * total_marks)

    # 4. Length penalty
    penalty = 0
    if word_count < 15:
        penalty = 0.15 * total_marks
    elif word_count < 25:
        penalty = 0.10 * total_marks
    elif word_count < 40 and coverage_ratio < 0.35:
        penalty = 0.05 * total_marks

    final = core + depth + breadth - penalty
    final = max(0.08 * total_marks, final)
    final = min(total_marks, final)
    return round(final, 2)


def generate_feedback(student_answer, key_points):
    """
    Compare the student answer against each key point and produce:
      - feedback  : a short overall comment
      - strengths : list of concepts the student covered well
      - improvements : list of concepts the student missed or barely covered
    """
    sentences = split_sentences(student_answer)
    strengths = []
    improvements = []

    for point in key_points:
        best = 0.0
        for sent in sentences:
            if len(sent.split()) < 3:
                continue
            best = max(best, similarity(point, sent))

        # Capitalise for display
        label = point[0].upper() + point[1:]

        if best >= 0.55:
            strengths.append(label)
        elif best >= 0.42:
            # Partial — still flag as an area to strengthen
            improvements.append(f"{label} (partially covered — add more detail)")
        else:
            improvements.append(label)

    # Build a short overall comment
    total = len(key_points)
    covered = len(strengths)
    pct = (covered / total) * 100 if total else 0

    if pct >= 85:
        feedback = "Excellent work! Your answer covers nearly all the key concepts."
    elif pct >= 65:
        feedback = "Good effort. Most key concepts are present, but a few areas need more detail."
    elif pct >= 40:
        feedback = "Partial coverage. Several important concepts are missing or only briefly mentioned."
    else:
        feedback = "Your answer needs significant improvement. Review the topic and address the missing points below."

    return {
        "feedback": feedback,
        "strengths": strengths,
        "improvements": improvements,
    }
