#!/usr/bin/env python3
"""
04_gold_to_sqlite.py
Stage: MinIO Gold → SQLite (Serving DB)
Load Gold tables vào SQLite để Dashboard query nhanh
"""
import logging
import sys
import io
import sqlite3
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

MINIO_ENDPOINT   = 'localhost:9000'
MINIO_ACCESS_KEY = 'minioadmin'
MINIO_SECRET_KEY = 'minioadmin'
GOLD_BUCKET      = 'gold'

PROJECT_ROOT = Path(__file__).parent.parent.parent
SQLITE_PATH  = PROJECT_ROOT / 'data-pipeline' / 'data' / 'analytics.db'

GOLD_TABLES = [
    ('gold_sales',        'gold_sales'),
    ('gold_customers',    'gold_customers'),
    ('gold_products_agg', 'gold_products_agg'),
]


def get_minio_client():
    from minio import Minio
    return Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=False)


def read_parquet(client, bucket, name) -> pd.DataFrame:
    r = client.get_object(bucket, f'latest/{name}.parquet')
    return pd.read_parquet(io.BytesIO(r.read()))


def load_to_sqlite(df: pd.DataFrame, table_name: str, conn: sqlite3.Connection):
    """Load DataFrame vào SQLite (replace toàn bộ table)"""
    df.to_sql(table_name, conn, if_exists='replace', index=False)
    logger.info(f"  Loaded {len(df)} rows vao {table_name}")


def create_indexes(conn: sqlite3.Connection):
    """Tạo indexes để query nhanh"""
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_gold_sales_order_date ON gold_sales(order_date)",
        "CREATE INDEX IF NOT EXISTS idx_gold_sales_product_id ON gold_sales(product_id)",
        "CREATE INDEX IF NOT EXISTS idx_gold_sales_customer_id ON gold_sales(customer_id)",
        "CREATE INDEX IF NOT EXISTS idx_gold_customers_country ON gold_customers(country)",
        "CREATE INDEX IF NOT EXISTS idx_gold_products_category ON gold_products_agg(category)",
    ]
    for sql in indexes:
        try:
            conn.execute(sql)
        except Exception as e:
            logger.warning(f"Index error (co the da ton tai): {e}")
    conn.commit()


def main():
    logger.info("=== STAGE 4: Gold → SQLite ===")
    try:
        SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
        client = get_minio_client()

        conn = sqlite3.connect(str(SQLITE_PATH))

        for minio_name, sqlite_name in GOLD_TABLES:
            logger.info(f"Loading: {minio_name} → {sqlite_name}")
            df = read_parquet(client, GOLD_BUCKET, minio_name)
            load_to_sqlite(df, sqlite_name, conn)

        logger.info("Tao indexes...")
        create_indexes(conn)
        conn.close()

        logger.info(f"=== Hoan thanh: Gold → SQLite ({SQLITE_PATH}) ===")

    except Exception as e:
        logger.error(f"Loi stage SQLite: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
