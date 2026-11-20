#!/usr/bin/env python3
"""
02_bronze_to_silver.py
Stage: MinIO Bronze → MinIO Silver
Làm sạch, chuẩn hóa và validate data
"""
import logging
import sys
import io
import pandas as pd
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

MINIO_ENDPOINT   = 'localhost:9000'
MINIO_ACCESS_KEY = 'minioadmin'
MINIO_SECRET_KEY = 'minioadmin'
BRONZE_BUCKET    = 'bronze'
SILVER_BUCKET    = 'silver'

# Mapping tên file → tên bảng + xử lý tương ứng
TABLE_CONFIG = {
    'dataset_fashion_store_customers.csv': {
        'table': 'customers',
        'required_cols': ['customer_id', 'name', 'email', 'gender', 'age', 'country', 'registration_date'],
        'date_cols': ['registration_date'],
    },
    'dataset_fashion_store_products.csv': {
        'table': 'products',
        'required_cols': ['product_id', 'name', 'category', 'brand', 'color', 'size', 'price', 'cost'],
        'date_cols': [],
    },
    'dataset_fashion_store_sales.csv': {
        'table': 'orders',
        'required_cols': ['order_id', 'customer_id', 'order_date', 'status', 'sales_channel'],
        'date_cols': ['order_date'],
    },
    'dataset_fashion_store_salesitems.csv': {
        'table': 'order_items',
        'required_cols': ['order_item_id', 'order_id', 'product_id', 'quantity', 'unit_price'],
        'date_cols': [],
    },
    'dataset_fashion_store_channels.csv': {
        'table': 'channels',
        'required_cols': [],
        'date_cols': [],
    },
    'dataset_fashion_store_campaigns.csv': {
        'table': 'campaigns',
        'required_cols': [],
        'date_cols': ['start_date', 'end_date'],
    },
    'dataset_fashion_store_stock.csv': {
        'table': 'stock',
        'required_cols': [],
        'date_cols': [],
    },
}


def get_minio_client():
    from minio import Minio
    return Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=False)


def read_csv_from_minio(client, bucket, object_name) -> pd.DataFrame:
    response = client.get_object(bucket, object_name)
    return pd.read_csv(io.BytesIO(response.read()))


def clean_dataframe(df: pd.DataFrame, config: dict) -> pd.DataFrame:
    """Làm sạch chuẩn: drop dupes, parse dates, strip strings"""
    # Drop duplicates
    before = len(df)
    df = df.drop_duplicates()
    after = len(df)
    if before != after:
        logger.info(f"  Xoa {before - after} ban ghi trung lap")

    # Parse date columns
    for col in config.get('date_cols', []):
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')

    # Strip string columns
    str_cols = df.select_dtypes(include='object').columns
    for col in str_cols:
        df[col] = df[col].str.strip()

    # Drop rows missing required cols
    required = config.get('required_cols', [])
    if required:
        existing_required = [c for c in required if c in df.columns]
        rows_before = len(df)
        df = df.dropna(subset=existing_required)
        dropped = rows_before - len(df)
        if dropped > 0:
            logger.info(f"  Xoa {dropped} ban ghi thieu truong bat buoc")

    return df


def upload_parquet(client, df: pd.DataFrame, bucket: str, object_name: str):
    """Lưu dưới dạng Parquet (hiệu quả hơn CSV)"""
    from minio import Minio
    buffer = io.BytesIO()
    df.to_parquet(buffer, index=False)
    buffer.seek(0)
    size = buffer.getbuffer().nbytes
    client.put_object(bucket, object_name, buffer, size, content_type='application/octet-stream')


def main():
    logger.info("=== STAGE 2: Bronze → Silver ===")

    try:
        client = get_minio_client()

        # Ensure silver bucket
        if not client.bucket_exists(SILVER_BUCKET):
            client.make_bucket(SILVER_BUCKET)
            logger.info("Tao bucket: silver")

        for csv_file, config in TABLE_CONFIG.items():
            logger.info(f"Xu ly: {csv_file}")
            try:
                df = read_csv_from_minio(client, BRONZE_BUCKET, f'latest/{csv_file}')
                logger.info(f"  Doc {len(df)} ban ghi")
                df = clean_dataframe(df, config)
                logger.info(f"  Sau khi clean: {len(df)} ban ghi")

                # Upload Silver
                table_name = config['table']
                upload_parquet(client, df, SILVER_BUCKET, f'latest/{table_name}.parquet')
                logger.info(f"  Saved to silver: {table_name}.parquet")

            except Exception as e:
                logger.warning(f"  Khong the xu ly {csv_file}: {e}")

        logger.info("=== Hoan thanh: Bronze → Silver ===")

    except Exception as e:
        logger.error(f"Loi stage Silver: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
