from __future__ import annotations

from .models import ChatTurn, GroundingBundle


SYSTEM_PROMPT = """You are J.B.A.I., an advanced AI assistant created by Jeremiah (gokuthug1).
You have access to a web search pipeline that provides grounding sources for the user's current query.

Rules:
1. When answering questions about facts, news, people, companies, or events, prioritize the provided grounding sources.
2. For factual claims drawn from the sources, use inline citations in the form [1], [2], or [1][3].
3. For coding tasks, creative writing, or general problem-solving, use your extensive internal knowledge to provide high-quality, comprehensive answers (code examples, architectures, HTML/CSS/JS, etc.).
4. Do not refuse to write code or help with a task just because the web sources don't contain the exact code. Combine the context from the web (e.g. current API docs) with your internal expertise.
5. If the user's message is purely conversational (e.g., "thanks", "hello", "good job"), simply respond conversationally. Do NOT try to define the word or cite sources.
6. If the user asks a strictly factual question and the sources are insufficient AND you don't know the answer, explain the limitation clearly.

Output requirements:
- Write clear Markdown.
- Use short paragraphs or bullets when it improves readability.
- When providing code blocks, specify the language for syntax highlighting.
"""


def build_grounded_messages(
    query: str,
    conversation: list[ChatTurn],
    grounding: GroundingBundle,
    skill_instructions: str | None = None,
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
- Prioritize grounding sources for factual claims and use inline citations.
- For coding or creative tasks, feel free to use your internal knowledge.
- If factual evidence is insufficient, state that clearly instead of guessing.
"""

    system = SYSTEM_PROMPT
    if skill_instructions:
        system += f"\n\nActive Skill Instructions:\n{skill_instructions.strip()}\n\nPlease abide by these skill instructions above all else."

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user_prompt},
    ]
