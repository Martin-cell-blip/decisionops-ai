# -*- coding: utf-8 -*-
"""Build real-data bundles for the DecisionOps web app from the Olist dataset.

Outputs (committed, so site visitors never need the raw data):
  docs/data/merchants.json   - real Olist sellers as merchant snapshots + Python-agent decisions
  docs/data/settlement.json  - real carrier-bill cases (with injected ground truth) + decisions
  docs/data/overview.json    - real aggregate stats for the landing charts

Field provenance is embedded in each bundle. Real fields come straight from Olist;
proxy/assumption/synthetic fields are labeled and never presented as observed data.

Requires: duckdb (pip install duckdb). Raw data paths default to the local research
projects; pass --olist-dir / --bill-csv to override.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from decisionops.growth_agent import diagnose_merchant  # noqa: E402
from decisionops.providers import NoModelProvider  # noqa: E402
from decisionops.schemas import (  # noqa: E402
    MerchantSnapshot,
    OrderRecord,
    SettlementCase,
    SettlementLine,
    SkuMetric,
)
from decisionops.settlement_agent import review_settlement_case  # noqa: E402

try:
    import duckdb
except ImportError:  # pragma: no cover
    raise SystemExit("duckdb is required: pip install duckdb")

# Documented assumptions (also emitted into the JSON provenance blocks).
CONVERSION_ASSUMPTION = {"low": 0.04, "mid": 0.03, "high": 0.02}
MARGIN_ASSUMPTION = {"low": 0.16, "mid": 0.28, "high": 0.38}
STOCK_FACTOR_RANGE = (0.5, 8.0)

PROVENANCE = {
    "gmv": {"status": "real", "note": "sum of item prices per product (olist_order_items)"},
    "orders": {"status": "real", "note": "order-line count per product (olist_order_items)"},
    "rating": {"status": "real", "note": "mean review score of orders containing the product; products with <3 reviews fall back to the seller mean"},
    "price_band": {"status": "real", "note": "within-seller terciles of median unit price"},
    "views": {"status": "proxy", "note": f"orders / band-level conversion assumption {CONVERSION_ASSUMPTION}; Olist has no traffic data, so the conversion signal is coarse"},
    "margin_rate_assumption": {"status": "assumption", "note": f"band-level placeholder {MARGIN_ASSUMPTION}; Olist has no cost data"},
    "stock_units": {"status": "synthetic", "note": f"deterministic hash of product_id scaled to orders x {STOCK_FACTOR_RANGE}; Olist has no inventory data"},
    "decision": {"status": "computed", "note": "produced by the repository's Python agents (provider=none), not hand-written"},
}


def _hash_unit(key: str) -> float:
    return int(hashlib.md5(key.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--olist-dir", default="D:/category-management-sim/data/raw")
    parser.add_argument("--bill-csv", default="D:/logistics-settlement-recon/data/generated/carrier_bill.csv")
    parser.add_argument("--big-sellers", type=int, default=22)
    parser.add_argument("--cases-per-type", type=int, default=6)
    return parser.parse_args()


def build_merchants(con, olist: str, big_sellers: int) -> dict:
    con.execute(f"""
        create or replace view items as select * from read_csv_auto('{olist}/olist_order_items_dataset.csv');
        create or replace view products as select * from read_csv_auto('{olist}/olist_products_dataset.csv');
        create or replace view reviews as select * from read_csv_auto('{olist}/olist_order_reviews_dataset.csv');
        create or replace view sellers as select * from read_csv_auto('{olist}/olist_sellers_dataset.csv');
        create or replace view cat_en as select * from read_csv_auto('{olist}/product_category_name_translation.csv');
    """)
    big = con.execute("""
        select seller_id from (
            select seller_id, count(distinct product_id) skus, count(*) lines, sum(price) gmv
            from items group by 1 having skus >= 6 and lines >= 80
        ) order by gmv desc limit ?
    """, [big_sellers]).fetchall()
    thin = con.execute("""
        select seller_id from (
            select seller_id, count(distinct product_id) skus, count(*) lines, sum(price) gmv
            from items group by 1 having skus between 2 and 6 and lines < 25
        ) order by gmv desc limit 2
    """).fetchall()
    seller_ids = [row[0] for row in big] + [row[0] for row in thin]

    merchants = []
    for rank, seller_id in enumerate(seller_ids, 1):
        rows = con.execute("""
            with sku as (
                select i.product_id,
                       coalesce(t.product_category_name_english, p.product_category_name, 'unknown') category,
                       sum(i.price) gmv, count(*) orders, median(i.price) unit_price
                from items i
                left join products p using (product_id)
                left join cat_en t on p.product_category_name = t.product_category_name
                where i.seller_id = ?
                group by 1, 2
            ),
            rat as (
                select i.product_id, avg(r.review_score) rating, count(*) n_reviews
                from items i join reviews r using (order_id)
                where i.seller_id = ?
                group by 1
            )
            select s.product_id, s.category, s.gmv, s.orders, s.unit_price,
                   r.rating, coalesce(r.n_reviews, 0) n_reviews
            from sku s left join rat r using (product_id)
            order by s.gmv desc limit 8
        """, [seller_id, seller_id]).fetchall()
        meta = con.execute(
            "select seller_city, seller_state from sellers where seller_id = ?", [seller_id]
        ).fetchone() or ("unknown", "??")
        seller_avg = con.execute("""
            select avg(r.review_score) from items i join reviews r using (order_id) where i.seller_id = ?
        """, [seller_id]).fetchone()[0] or 4.0

        prices = sorted(row[4] for row in rows)
        t1 = prices[max(0, len(prices) // 3 - 1)]
        t2 = prices[max(0, 2 * len(prices) // 3 - 1)]
        skus, fallback_ratings = [], 0
        for product_id, category, gmv, orders, unit_price, rating, n_reviews in rows:
            band = "low" if unit_price <= t1 else ("mid" if unit_price <= t2 else "high")
            if rating is None or n_reviews < 3:
                rating = seller_avg
                fallback_ratings += 1
            factor = STOCK_FACTOR_RANGE[0] + (STOCK_FACTOR_RANGE[1] - STOCK_FACTOR_RANGE[0]) * _hash_unit(product_id)
            skus.append(SkuMetric(
                sku=f"{category[:18]}-{product_id[:4]}",
                price_band=band,
                gmv=round(float(gmv), 2),
                orders=int(orders),
                views=int(round(orders / CONVERSION_ASSUMPTION[band])),
                rating=round(min(5.0, max(0.0, float(rating))), 2),
                margin_rate_assumption=MARGIN_ASSUMPTION[band],
                stock_units=int(round(orders * factor)),
            ))
        dominant = rows[0][1] if rows else "mixed"
        snapshot = MerchantSnapshot(
            merchant_id=f"OLIST-{rank:02d}-{seller_id[:6].upper()}",
            period="Olist 2016-10 ~ 2018-08 (full window)",
            skus=skus,
        )
        decision = diagnose_merchant(snapshot, NoModelProvider())
        merchants.append({
            "merchant_id": snapshot.merchant_id,
            "label": {"en": f"{dominant.replace('_', ' ')} seller · {meta[1]}", "zh": f"{dominant.replace('_', ' ')} 卖家 · {meta[1]}"},
            "city": f"{meta[0]}, {meta[1]}",
            "rating_fallbacks": fallback_ratings,
            "snapshot": snapshot.model_dump(),
            "decision": decision.model_dump(),
        })
    return {"provenance": PROVENANCE, "merchants": merchants}


def build_settlement(con, olist: str, bill_csv: str, per_type: int) -> dict:
    con.execute(f"""
        create or replace view bill as select * from read_csv_auto('{bill_csv}');
        create or replace view orders_v as select * from read_csv_auto('{olist}/olist_orders_dataset.csv');
        create or replace view sor as
            select order_id, sum(freight_value) expected_freight from
            read_csv_auto('{olist}/olist_order_items_dataset.csv') group by 1;
    """)
    label_map = {
        "MATCH": "MATCH", "DUPLICATE": "DUPLICATE", "AMOUNT_MISMATCH": "AMOUNT_MISMATCH",
        "MISSING_ORDER": "MISSING_ORDER", "NOT_DELIVERED": "NOT_DELIVERED",
    }
    cases = []
    for injected in label_map:
        rows = con.execute("""
            select b.order_id from bill b where b._injected_type = ?
            group by b.order_id order by md5(b.order_id) limit ?
        """, [injected, per_type]).fetchall()
        for index, (order_id,) in enumerate(rows, 1):
            lines = con.execute(
                "select bill_line_id, order_id, billed_freight from bill where order_id = ? order by bill_line_id",
                [order_id],
            ).fetchall()
            sor_row = con.execute("select expected_freight from sor where order_id = ?", [order_id]).fetchone()
            status = con.execute("select order_status from orders_v where order_id = ?", [order_id]).fetchone()
            order_records = []
            if sor_row is not None:
                order_records.append(OrderRecord(
                    order_id=order_id,
                    expected_amount=round(float(sor_row[0]), 2),
                    delivered=bool(status and status[0] == "delivered"),
                ))
            case = SettlementCase(
                case_id=f"OLIST-{injected[:4]}-{index:02d}",
                contract_tolerance_pct=0.02,
                invoice_lines=[
                    SettlementLine(line_id=line[0], order_id=line[1], billed_amount=round(float(line[2]), 2))
                    for line in lines
                ],
                orders=order_records,
            )
            decision = review_settlement_case(case, NoModelProvider())
            cases.append({
                "injected_type": injected,
                "order_id": order_id,
                "case": case.model_dump(),
                "decision": decision.model_dump(),
            })
    counts = dict(con.execute("select _injected_type, count(*) from bill group by 1 order by 2 desc").fetchall())
    return {
        "provenance": {
            "billed_freight": {"status": "real+injected", "note": "real Olist freight values with labeled injected anomalies (logistics-settlement-recon pipeline)"},
            "expected_amount": {"status": "real", "note": "sum of freight_value per order from olist_order_items (system of record)"},
            "delivered": {"status": "real", "note": "olist_orders order_status == delivered"},
            "decision": PROVENANCE["decision"],
        },
        "bill_line_population": counts,
        "cases": cases,
    }


def build_overview(con, olist: str) -> dict:
    monthly = con.execute(f"""
        select strftime(o.order_purchase_timestamp, '%Y-%m') as ym, round(sum(i.price), 0) gmv
        from read_csv_auto('{olist}/olist_order_items_dataset.csv') i
        join read_csv_auto('{olist}/olist_orders_dataset.csv') o using (order_id)
        where o.order_purchase_timestamp >= '2017-01-01' and o.order_purchase_timestamp < '2018-09-01'
        group by 1 order by 1
    """).fetchall()
    categories = con.execute("""
        select coalesce(t.product_category_name_english, p.product_category_name, 'unknown') category,
               round(sum(i.price), 0) gmv
        from items i left join products p using (product_id)
        left join cat_en t on p.product_category_name = t.product_category_name
        group by 1 order by gmv desc limit 10
    """).fetchall()
    review_dist = con.execute("select review_score, count(*) from reviews group by 1 order by 1").fetchall()
    totals = con.execute("""
        select count(distinct order_id), count(*), round(sum(price), 0), count(distinct seller_id) from items
    """).fetchone()
    return {
        "source": "Olist Brazilian e-commerce public dataset (Kaggle), 2016-10 ~ 2018-08",
        "totals": {"orders": totals[0], "order_lines": totals[1], "gmv_brl": totals[2], "sellers": totals[3]},
        "monthly_gmv": [{"month": m, "gmv": g} for m, g in monthly],
        "top_categories": [{"category": c, "gmv": g} for c, g in categories],
        "review_distribution": [{"score": int(s), "count": n} for s, n in review_dist],
    }


def main() -> None:
    args = parse_args()
    out_dir = ROOT / "docs" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect()
    merchants = build_merchants(con, args.olist_dir, args.big_sellers)
    settlement = build_settlement(con, args.olist_dir, args.bill_csv, args.cases_per_type)
    overview = build_overview(con, args.olist_dir)
    for name, payload in [("merchants.json", merchants), ("settlement.json", settlement), ("overview.json", overview)]:
        path = out_dir / name
        path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"{name}: {path.stat().st_size / 1024:.0f} KB")
    summary = {
        "merchants": len(merchants["merchants"]),
        "thin_merchants": sum(1 for m in merchants["merchants"] if not m["decision"]["recommendations"]),
        "settlement_cases": len(settlement["cases"]),
    }
    print(json.dumps(summary))


if __name__ == "__main__":
    main()
