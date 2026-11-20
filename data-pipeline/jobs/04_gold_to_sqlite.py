#!/usr/bin/env python3
"""
04_gold_to_sqlite.py
Stage: Gold -> SQLite (Serving DB cho Desktop App)
File: data-pipeline/data/analytics.db
"""
import logging
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lake import Lake, SQLITE_PATH  # noqa: E402

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

GOLD = 'gold'
TABLES = ['gold_sales_items', 'gold_orders', 'gold_customers', 'gold_products',
          'dim_campaigns', 'dim_channels', 'dim_stock']
INDEXES = [
    "CREATE INDEX IF NOT EXISTS ix_items_date    ON gold_sales_items(sale_date)",
    "CREATE INDEX IF NOT EXISTS ix_items_product ON gold_sales_items(product_id)",
    "CREATE INDEX IF NOT EXISTS ix_orders_date   ON gold_orders(sale_date)",
    "CREATE INDEX IF NOT EXISTS ix_orders_cust   ON gold_orders(customer_id)",
    "CREATE INDEX IF NOT EXISTS ix_cust_country  ON gold_customers(country)",
    "CREATE INDEX IF NOT EXISTS ix_prod_category ON gold_products(category)",
]


def to_sql_ready(df: pd.DataFrame) -> pd.DataFrame:
    """SQLite không có kiểu ngày: đổi datetime -> 'YYYY-MM-DD', string dtype -> object."""
    df = df.copy()
    for c in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[c]):
            df[c] = df[c].dt.strftime('%Y-%m-%d')
        elif pd.api.types.is_string_dtype(df[c]):
            df[c] = df[c].astype(object)
    return df


def main():
    logger.info("=== STAGE 4: Gold -> SQLite ===")
    lake = Lake()
    SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = SQLITE_PATH.with_suffix('.tmp.db')
    if tmp.exists():
        tmp.unlink()

    conn = sqlite3.connect(tmp)
    try:
        for name in TABLES:
            df = to_sql_ready(lake.get_parquet(GOLD, name))
            df.to_sql(name, conn, if_exists='replace', index=False)
            logger.info(f"  {name}: {len(df)} dong")
        for sql in INDEXES:
            conn.execute(sql)
        conn.execute("CREATE TABLE IF NOT EXISTS pipeline_runs (run_at TEXT, lake_mode TEXT)")
        conn.execute("INSERT INTO pipeline_runs VALUES (?, ?)", (datetime.now().isoformat(timespec='seconds'), lake.mode))
        # Giữ lại kết quả ML cũ (nếu có) để Dashboard không bị trống tới khi chạy ML lại
        if SQLITE_PATH.exists():
            old = sqlite3.connect(SQLITE_PATH)
            ml_tables = (
                'ml_predictions', 'ml_backtest', 'ml_model_info',
                'ml_customer_clusters', 'ml_cluster_summary', 'ml_cluster_k_scores', 'ml_cluster_info',
                'ml_customer_recommendations', 'ml_product_affinities', 'ml_recommend_info',
            )
            for tbl in ml_tables:
                try:
                    pd.read_sql(f'SELECT * FROM {tbl}', old).to_sql(tbl, conn, if_exists='replace', index=False)
                except Exception:
                    pass
            old.close()
        conn.commit()
    finally:
        conn.close()

    tmp.replace(SQLITE_PATH)  # ghi đè nguyên tử
    logger.info(f"=== Hoan thanh: Gold -> SQLite ({SQLITE_PATH}) ===")


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        logger.error(f"Loi stage SQLite: {e}")
        sys.exit(1)
