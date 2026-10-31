#!/usr/bin/env python3
"""One-off: L1/L2/L3 story titles + mergeAnatomyMeta + anatomy JSON co-location."""
from __future__ import annotations

import pathlib
import re

SRC = pathlib.Path(__file__).resolve().parent.parent / "src"
COMP = SRC / "components"


def story_title(path: pathlib.Path) -> str:
    rel = path.relative_to(COMP)
    parts = rel.parts
    if parts[0] == "layout":
        return f"Components/Layout/{parts[1]}"
    if parts[0] == "Timeline" and path.name == "Timeline.stories.tsx":
        return "Components/L3/Timeline"
    if parts[0] == "TimelineItem":
        if "Boxed" in path.name:
            return "Components/L2/TimelineItem/Boxed"
        return "Components/L2/TimelineItem/Inline"
    if parts[0] == "TabBar":
        if path.name.startswith("TabTrigger"):
            return "Components/L2/TabTrigger"
        if path.name.startswith("WorkspaceTabStrip"):
            return "Components/L2/WorkspaceTabStrip"
        if path.name.startswith("TabList"):
            return "Components/L2/TabList"
        return "Components/L2/TabBar"
    # default L1 — folder name (Button, Input, …)
    return f"Components/L1/{parts[0]}"


def anatomy_file(path: pathlib.Path) -> pathlib.Path | None:
    stem = path.name.replace(".stories.tsx", "")
    if stem in ("TimelineItemBoxed", "TimelineItemInline"):
        shared = path.parent / "TimelineItem.anatomy.json"
        return shared if shared.is_file() else None
    candidate = path.parent / f"{stem}.anatomy.json"
    return candidate if candidate.is_file() else None


def patch_file(path: pathlib.Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if "mergeAnatomyMeta" in text:
        return False
    an = anatomy_file(path)
    if an is None:
        print(f"SKIP (no anatomy): {path.relative_to(SRC.parent)}")
        return False
    title = story_title(path)
    import_line = f"import anatomy from './{an.name}'\nimport {{ mergeAnatomyMeta }} from '@/storybook/mergeAnatomyMeta'\n"

    # title: '...'  →  new title
    text_new, n = re.subn(
        r"title:\s*'[^']+'",
        f"title: '{title}'",
        text,
        count=1,
    )
    if n != 1:
        print(f"WARN title replace count={n}: {path}")

    # insert imports after first import line
    lines = text_new.splitlines(keepends=True)
    insert_at = 0
    for i, line in enumerate(lines):
        if line.startswith("import "):
            insert_at = i + 1
    lines.insert(insert_at, import_line)
    text_new = "".join(lines)

    # export default <identifier>  →  mergeAnatomyMeta(...) + export default <id>
    # CSF indexer requires default export to be an object binding, not a call expression.
    m = re.search(r"^export\s+default\s+(\w+)\s*$", text_new, re.MULTILINE)
    if not m:
        print(f"WARN no export default <id>: {path}")
        return False
    meta_var = m.group(1)
    text_new = re.sub(
        rf"^export\s+default\s+{re.escape(meta_var)}\s*$",
        f"mergeAnatomyMeta({meta_var}, anatomy as Record<string, unknown>)\n\nexport default {meta_var}\n",
        text_new,
        count=1,
        flags=re.MULTILINE,
    )

    path.write_text(text_new, encoding="utf-8")
    print(f"OK {path.relative_to(SRC.parent)}")
    return True


def main() -> None:
    for p in sorted(COMP.rglob("*.stories.tsx")):
        patch_file(p)


if __name__ == "__main__":
    main()
