# helpers.py — Small utility functions used by grading and keygen.

import re
from sentence_transformers import util
from app.config import embed_model


def split_sentences(text):
    """Split text into sentences on .!? boundaries."""
    sentences = re.split(r"[.!?]\s+", text)
    return [s.strip() for s in sentences if len(s.strip()) > 3]


def similarity(a, b):
    """Cosine similarity between two pieces of text."""
    e1 = embed_model.encode(a, normalize_embeddings=True)
    e2 = embed_model.encode(b, normalize_embeddings=True)
    return util.cos_sim(e1, e2).item()


def is_keyword_spam(text):
    """Detect if the text is just a dump of keywords with no real sentences."""
    words = text.lower().split()
    if not words:
        return False

    unique_ratio = len(set(words)) / len(words)
    sentences = split_sentences(text)
    avg_len = (
        sum(len(s.split()) for s in sentences) / len(sentences)
        if sentences
        else len(words)
    )

    # Signal 1: heavy repetition + very short average sentence
    if unique_ratio < 0.60 and avg_len < 6:
        return True

    # Signal 2: no punctuation at all + moderate repetition (keyword dump)
    has_punct = bool(re.search(r"[.!?,;]", text))
    if not has_punct and unique_ratio < 0.75:
        return True

    # Signal 3: no punctuation + text is a flat list of words
    if not has_punct and len(words) == avg_len:
        return True

    return False
