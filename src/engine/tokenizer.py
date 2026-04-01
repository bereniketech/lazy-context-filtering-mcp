import math

import tiktoken


GPT_ENCODING = tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str, model_family: str) -> int:
    """Return token count for a model family."""
    if not text:
        return 0

    normalized_family = model_family.strip().lower()
    if normalized_family.startswith("gpt") or "openai" in normalized_family:
        return len(GPT_ENCODING.encode(text))

    # Claude and generic families use a lightweight approximation.
    return math.ceil(len(text) / 4)