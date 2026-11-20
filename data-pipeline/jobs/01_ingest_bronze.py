#!/usr/bin/env python3
"""
01_ingest_bronze.py
Stage: Raw CSV → MinIO Bronze
Đọc tất cả CSV trong raw_data/ và upload lên MinIO bucket "bronze"
"""
import logging
import sys
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

PROJECT_ROOT = Path(__file__).parent.parent.parent
RAW_DATA_DIR = PROJECT_ROOT / 'raw_data'

# Config MinIO — đọc từ .env hoặc defaults
MINIO_ENDPOINT = 'localhost:9000'
MINIO_ACCESS_KEY = 'minioadmin'
MINIO_SECRET_KEY = 'minioadmin'
BRONZE_BUCKET = 'bronze'
SNAPSHOT_DATE = datetime.now().strftime('%Y-%m-%d')


def get_minio_client():
    from minio import Minio
    client = Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=False
    )
    return client


def ensure_bucket(client, bucket_name: str):
    if not client.bucket_exists(bucket_name):
        client.make_bucket(bucket_name)
        logger.info(f"Tao bucket: {bucket_name}")


def upload_csv_files(client):
    csv_files = list(RAW_DATA_DIR.glob('*.csv'))
    if not csv_files:
        logger.warning(f"Khong tim thay file CSV trong {RAW_DATA_DIR}")
        return 0

    uploaded = 0
    for csv_path in csv_files:
        # Upload vào 2 nơi: latest/ và snapshots/<date>/
        for prefix in ['latest', f'snapshots/{SNAPSHOT_DATE}']:
            object_name = f'{prefix}/{csv_path.name}'
            client.fput_object(
                BRONZE_BUCKET,
                object_name,
                str(csv_path),
                content_type='text/csv'
            )
            logger.info(f"Uploaded: {object_name}")
        uploaded += 1

    return uploaded


def main():
    logger.info("=== STAGE 1: Ingest Bronze ===")

    if not RAW_DATA_DIR.exists():
        logger.error(f"Khong tim thay thu muc raw_data: {RAW_DATA_DIR}")
        sys.exit(1)

    try:
        client = get_minio_client()
        ensure_bucket(client, BRONZE_BUCKET)
        count = upload_csv_files(client)
        logger.info(f"=== Hoan thanh: Da upload {count} file CSV len MinIO Bronze ===")
    except Exception as e:
        logger.error(f"Loi ingest bronze: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()

