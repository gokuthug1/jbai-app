from __future__ import annotations

import re
from pathlib import Path

from .models import SkillCatalogItemOut


FRONTMATTER_PATTERN = re.compile(r"\A---\s*\r?\n(?P<frontmatter>.*?)\r?\n---\s*(?:\r?\n|$)", re.DOTALL)


def discover_skill_catalog() -> list[SkillCatalogItemOut]:
    repo_root = Path(__file__).resolve().parents[2]
    skills_root = repo_root / "skills"
    if not skills_root.exists():
        return []

    items: list[SkillCatalogItemOut] = []
    for skill_file in sorted(skills_root.glob("*/SKILL.MD")):
        item = _build_skill_item(skill_file, repo_root)
        if item is not None:
            items.append(item)
    return items


def _build_skill_item(skill_file: Path, repo_root: Path) -> SkillCatalogItemOut | None:
    try:
        raw_text = skill_file.read_text(encoding="utf-8")
    except OSError:
        return None

    metadata, body = _split_frontmatter(raw_text)
    fallback_name = _slugify(skill_file.parent.name) or skill_file.parent.name
    name = metadata.get("name") or fallback_name
    title = _extract_title(body) or _title_case_from_slug(name) or skill_file.parent.name
    summary = _extract_summary(body)
    description = metadata.get("description") or summary or f"Use the {title} skill."

    return SkillCatalogItemOut(
        id=_slugify(name) or fallback_name,
        name=name,
        title=title,
        description=description,
        summary=summary,
        promptTemplate=_build_prompt_template(name, title),
        instructions=body.strip(),
        sourcePath=skill_file.relative_to(repo_root).as_posix(),
    )


def _split_frontmatter(raw_text: str) -> tuple[dict[str, str], str]:
    match = FRONTMATTER_PATTERN.match(raw_text)
    if not match:
        return {}, raw_text

    metadata: dict[str, str] = {}
    for line in match.group("frontmatter").splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        clean_key = key.strip().lower()
        clean_value = value.strip().strip('"').strip("'")
        if clean_key and clean_value:
            metadata[clean_key] = clean_value

    return metadata, raw_text[match.end():]


def _extract_title(body: str) -> str:
    for line in body.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            return stripped[2:].strip()
    return ""


def _extract_summary(body: str) -> str:
    lines = body.splitlines()
    seen_title = False
    paragraph: list[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if paragraph:
                break
            continue

        if stripped.startswith("# "):
            seen_title = True
            if paragraph:
                break
            continue

        if not seen_title and stripped.startswith("#"):
            continue

        if stripped.startswith("##"):
            if paragraph:
                break
            continue

        if stripped.startswith(("- ", "* ")) or re.match(r"\d+\.\s", stripped):
            if paragraph:
                break
            continue

        paragraph.append(stripped)

    return " ".join(paragraph).strip()


def _build_prompt_template(name: str, title: str) -> str:
    normalized = _slugify(name)
    if normalized == "skill-creator":
        return (
            f'Help me use the "{title}" skill.\n\n'
            "Goal:\n"
            "[What skill do you want to create or improve?]\n\n"
            "When it should trigger:\n"
            "[Describe the user requests or contexts that should activate it.]\n\n"
            "Desired output:\n"
            "[What should the skill produce or help accomplish?]\n\n"
            "Test/evaluation needs:\n"
            "[How should we validate quality, regressions, or triggering accuracy?]\n\n"
            "Files or references:\n"
            "[List any existing skill files, examples, docs, or repos to use.]"
        )

    return (
        f'Help me use the "{title}" skill.\n\n'
        "Goal:\n"
        "[What do you want this skill to help you accomplish?]\n\n"
        "Context:\n"
        "[Relevant background, current project state, or constraints.]\n\n"
        "Inputs/files:\n"
        "[Paste text, list files, or describe the materials to use.]\n\n"
        "Desired output:\n"
        "[What should the final result look like?]\n\n"
        "Constraints:\n"
        "[Anything to avoid, preserve, or optimize for.]"
    )


def _slugify(value: str) -> str:
    collapsed = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return collapsed


def _title_case_from_slug(value: str) -> str:
    parts = [part for part in re.split(r"[-_\s]+", value) if part]
    if not parts:
        return ""
    return " ".join(part.capitalize() for part in parts)
