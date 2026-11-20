#!/usr/bin/env python3
"""
01_ingest_bronze.py
Stage: raw_data/*.csv -> Bronze (giữ nguyên dữ liệu thô)
Lưu 2 bản: latest/<file>.csv và snapshots/<YYYY-MM-DD>/<file>.csv
"""
import logging
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lake import Lake, RAW_DATA_DIR  # noqa: E402

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BRONZE = 'bronze'


def main():
    logger.info("=== STAGE 1: Ingest Bronze ===")
    csv_files = sorted(RAW_DATA_DIR.glob('*.csv'))
    if not csv_files:
        logger.error(f"Khong tim thay file CSV trong {RAW_DATA_DIR}")
        sys.exit(1)

    lake = Lake()
    snapshot = datetime.now().strftime('%Y-%m-%d')
    for path in csv_files:
        data = path.read_bytes()
        for prefix in ('latest', f'snapshots/{snapshot}'):
            lake.put_bytes(BRONZE, f'{prefix}/{path.name}', data, content_type='text/csv')
        rows = data.count(b'\n') - 1
        logger.info(f"  {path.name}: ~{rows} dong")

    logger.info(f"=== Hoan thanh: {len(csv_files)} file -> Bronze ===")


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        logger.error(f"Loi ingest bronze: {e}")
        sys.exit(1)
