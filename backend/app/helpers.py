import re
from sentence_transformers import SentenceTransformer, util

_model = None

def get_model():
    global _model
    if _model is None:
        print("⚡ Loading embedding model...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def split_sentences(text):
    sentences = re.split(r"[.!?]\s+", text)
    return [s.strip() for s in sentences if len(s.strip()) > 3]


def similarity(a, b):
    model = get_model()
    e1 = model.encode(a, normalize_embeddings=True)
    e2 = model.encode(b, normalize_embeddings=True)
    return util.cos_sim(e1, e2).item()


def is_keyword_spam(text):
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

    if unique_ratio < 0.60 and avg_len < 6:
        return True

    has_punct = bool(re.search(r"[.!?,;]", text))
    if not has_punct and unique_ratio < 0.75:
        return True

    if not has_punct and len(words) == avg_len:
        return True

    return False