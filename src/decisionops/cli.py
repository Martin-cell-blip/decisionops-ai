from __future__ import annotations

import argparse

from .data import merchant_snapshots, settlement_cases
from .growth_agent import diagnose_merchant
from .providers import build_provider
from .settlement_agent import review_settlement_case


def main() -> None:
    parser = argparse.ArgumentParser(description="Run DecisionOps AI demo agents")
    parser.add_argument("agent", choices=["settlement", "growth"])
    parser.add_argument("record_id", help="Settlement case ID or merchant ID")
    parser.add_argument("--provider", choices=["none", "openai", "qianfan"], default="none")
    args = parser.parse_args()
    provider = build_provider(args.provider)

    if args.agent == "settlement":
        record = settlement_cases().get(args.record_id)
        if record is None:
            parser.error(f"Unknown case: {args.record_id}")
        result = review_settlement_case(record, provider)
    else:
        record = merchant_snapshots().get(args.record_id)
        if record is None:
            parser.error(f"Unknown merchant: {args.record_id}")
        result = diagnose_merchant(record, provider)
    print(result.model_dump_json(indent=2))


if __name__ == "__main__":
    main()

