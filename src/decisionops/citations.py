from __future__ import annotations

import re

_GROUPED = re.compile(r"\[(E\d+(?:\s*,\s*E\d+)+)\]")
_SINGLE = re.compile(r"\[(E\d+)\]")


def normalize_citations(text: str) -> str:
    """Rewrite grouped citations like "[E1, E2]" to "[E1][E2]".

    This is formatting normalization only - every ID is still verified against the
    evidence list afterwards. Observed live with ERNIE models, which intermittently
    group IDs in one bracket even when prompted not to.
    """
    return _GROUPED.sub(
        lambda match: "".join(f"[{item.strip()}]" for item in match.group(1).split(",")),
        text,
    )


def parse_citations(text: str | None) -> set[str]:
    if not text:
        return set()
    return set(_SINGLE.findall(normalize_citations(text)))
