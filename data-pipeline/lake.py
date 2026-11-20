"""
lake.py — Lớp lưu trữ Data Lake dùng chung cho các stage Bronze / Silver / Gold.

- Nếu MinIO (Docker) đang chạy ở localhost:9000  -> lưu vào MinIO buckets.
- Nếu không                                      -> lưu vào thư mục local data-pipeline/data/lake/<bucket>/
  (cùng cấu trúc object key, để pipeline vẫn chạy được khi chưa bật Docker).

Có thể ép chế độ bằng biến môi trường LAKE_MODE=minio | local.
"""
import io
import logging
import os
import socket
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = PROJECT_ROOT / 'raw_data'
DATA_DIR = PROJECT_ROOT / 'data-pipeline' / 'data'
LOCAL_LAKE_DIR = DATA_DIR / 'lake'
SQLITE_PATH = DATA_DIR / 'analytics.db'

MINIO_HOST = os.getenv('MINIO_HOST', 'localhost')
MINIO_PORT = int(os.getenv('MINIO_PORT', '9000'))
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', 'minioadmin')


def _minio_reachable() -> bool:
    try:
        with socket.create_connection((MINIO_HOST, MINIO_PORT), timeout=1.5):
            return True
    except OSError:
        return False


class Lake:
    def __init__(self):
        mode = os.getenv('LAKE_MODE', '').lower()
        if mode not in ('minio', 'local'):
            mode = 'minio' if _minio_reachable() else 'local'
        self.mode = mode
        self.client = None
        if mode == 'minio':
            from minio import Minio
            self.client = Minio(f'{MINIO_HOST}:{MINIO_PORT}', access_key=MINIO_ACCESS_KEY,
                                secret_key=MINIO_SECRET_KEY, secure=False)
            logger.info(f"Data Lake: MinIO ({MINIO_HOST}:{MINIO_PORT})")
        else:
            logger.info(f"Data Lake: LOCAL ({LOCAL_LAKE_DIR}) - MinIO khong chay, dung thu muc local")

    # ---------- low level ----------
    def put_bytes(self, bucket: str, key: str, data: bytes, content_type='application/octet-stream'):
        if self.mode == 'minio':
            if not self.client.bucket_exists(bucket):
                self.client.make_bucket(bucket)
            self.client.put_object(bucket, key, io.BytesIO(data), len(data), content_type=content_type)
        else:
            path = LOCAL_LAKE_DIR / bucket / key
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)

    def get_bytes(self, bucket: str, key: str) -> bytes:
        if self.mode == 'minio':
            r = self.client.get_object(bucket, key)
            try:
                return r.read()
            finally:
                r.close()
                r.release_conn()
        return (LOCAL_LAKE_DIR / bucket / key).read_bytes()

    # ---------- dataframe helpers ----------
    def put_parquet(self, bucket: str, name: str, df: pd.DataFrame):
        buf = io.BytesIO()
        df.to_parquet(buf, index=False)
        self.put_bytes(bucket, f'latest/{name}.parquet', buf.getvalue())

    def get_parquet(self, bucket: str, name: str) -> pd.DataFrame:
        return pd.read_parquet(io.BytesIO(self.get_bytes(bucket, f'latest/{name}.parquet')))

    def get_csv(self, bucket: str, key: str) -> pd.DataFrame:
        return pd.read_csv(io.BytesIO(self.get_bytes(bucket, key)))

