import re

from sklearn.feature_extraction.text import TfidfVectorizer


SENTENCE_SPLIT_REGEX = re.compile(r"(?<=[.!?])\s+")
WHITESPACE_REGEX = re.compile(r"\s+")


def summarize(text: str, max_length: int = 200) -> str:
    """Create a single-line extractive summary under max_length characters."""
    normalized_text = WHITESPACE_REGEX.sub(" ", text).strip()
    if not normalized_text:
        return ""

    first_sentence = SENTENCE_SPLIT_REGEX.split(normalized_text, maxsplit=1)[0].strip()
    key_terms = _extract_key_terms(normalized_text)

    if key_terms:
        summary = f"{first_sentence} Key terms: {', '.join(key_terms)}."
    else:
        summary = first_sentence

    summary = WHITESPACE_REGEX.sub(" ", summary).strip().replace("\n", " ")
    if len(summary) <= max_length:
        return summary
    if max_length <= 3:
        return summary[:max_length]

    return summary[: max_length - 3].rstrip() + "..."


def _extract_key_terms(text: str, top_k: int = 3) -> list[str]:
    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform([text])
    feature_names = vectorizer.get_feature_names_out()
    scores = matrix.toarray()[0]

    ranked_indices = scores.argsort()[::-1]
    key_terms: list[str] = []
    for index in ranked_indices:
        if scores[index] <= 0:
            continue
        key_terms.append(feature_names[index])
        if len(key_terms) == top_k:
            break
    return key_terms