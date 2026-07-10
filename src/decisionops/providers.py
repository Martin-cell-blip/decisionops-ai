from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Protocol


class TextProvider(Protocol):
    name: str

    def generate(self, *, system: str, user: str) -> str | None: ...


@dataclass
class NoModelProvider:
    """Deterministic demo mode. Business decisions still run; narration uses templates."""

    name: str = "none"

    def generate(self, *, system: str, user: str) -> str | None:
        return None


class OpenAICompatibleProvider:
    def __init__(self, *, name: str, api_key: str, model: str, base_url: str | None = None):
        if not api_key:
            raise ValueError(f"Missing API key for provider '{name}'.")
        from openai import OpenAI

        self.name = name
        self.model = model
        self.last_error: str | None = None
        self._client = OpenAI(api_key=api_key, base_url=base_url)

    def generate(self, *, system: str, user: str) -> str | None:
        try:
            response = self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0,
            )
            self.last_error = None
            return (response.choices[0].message.content or "").strip() or None
        except Exception as exc:
            # Model narration must never take down the deterministic decision path.
            self.last_error = f"{type(exc).__name__}: {str(exc)[:240]}"
            return None


def build_provider(provider_name: str | None = None) -> TextProvider:
    name = (provider_name or os.getenv("LLM_PROVIDER", "none")).lower()
    if name == "none":
        return NoModelProvider()
    if name == "openai":
        return OpenAICompatibleProvider(
            name="openai",
            api_key=os.getenv("OPENAI_API_KEY", ""),
            model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        )
    if name == "qianfan":
        return OpenAICompatibleProvider(
            name="qianfan",
            api_key=os.getenv("QIANFAN_API_KEY", ""),
            model=os.getenv("QIANFAN_MODEL", "ernie-5.1"),
            base_url=os.getenv("QIANFAN_BASE_URL", "https://qianfan.baidubce.com/v2"),
        )
    raise ValueError("LLM_PROVIDER must be one of: none, openai, qianfan")
