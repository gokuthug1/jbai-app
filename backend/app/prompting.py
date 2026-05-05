from __future__ import annotations

from .models import ChatTurn, GroundingBundle


STRICT_GROUNDED_SYSTEM_PROMPT = """You are J.B.A.I Search Mode, a web-grounded synthesis engine.

You must follow these rules exactly:
1. Use only the provided grounding sources for factual claims.
2. Every factual claim must be backed by one or more inline citations in the form [1], [2], or [1][3].
3. Do not use prior knowledge, unstated assumptions, or unsupported world knowledge to fill gaps.
4. If the sources are incomplete, conflicting, outdated, or insufficient, say so plainly.
5. Never invent citations, source titles, dates, organizations, numbers, or quotes.
6. Prefer synthesis over summary: compare sources, reconcile differences, and call out uncertainty.
7. Keep citations attached to the specific sentence or clause they support.
8. If the user asks for something the sources do not answer, respond with: "I do not have enough grounded evidence in the retrieved sources to answer that confidently."

Output requirements:
- Write clear Markdown.
- Use short paragraphs or bullets when it improves readability.
"""


def build_grounded_messages(
    query: str,
    conversation: list[ChatTurn],
    grounding: GroundingBundle,
) -> list[dict]:
    history_lines: list[str] = []
    for turn in conversation[-4:]:
        if turn.role == "system":
            continue
        history_lines.append(f"{turn.role.upper()}: {turn.content.strip()}")

    history_block = "\n".join(history_lines) if history_lines else "None"

    user_prompt = f"""User question:
{query}

Recent conversation context:
{history_block}

Grounding sources:
{grounding.context_text}

Write the answer now. Remember:
- Use only the grounding sources above.
- Use inline citations for every factual claim.
- If evidence is insufficient, say so rather than guessing.
"""

    return [
        {"role": "system", "content": STRICT_GROUNDED_SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]
