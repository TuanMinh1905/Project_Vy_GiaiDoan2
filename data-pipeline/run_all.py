#!/usr/bin/env python3
"""
run_all.py — Chạy toàn bộ pipeline từ đầu đến cuối
Bronze → Silver → Gold → SQLite
"""
import subprocess
import sys
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

JOBS_DIR = Path(__file__).parent / 'jobs'

PIPELINE_STAGES = [
    '01_ingest_bronze.py',
    '02_bronze_to_silver.py',
    '03_silver_to_gold.py',
    '04_gold_to_sqlite.py',
]

def run_stage(script_name: str) -> bool:
    script_path = JOBS_DIR / script_name
    if not script_path.exists():
        logger.error(f"Khong tim thay script: {script_path}")
        return False

    logger.info(f"=== Bat dau stage: {script_name} ===")
    result = subprocess.run(
        [sys.executable, str(script_path)],
        capture_output=False,
        text=True,
    )
    if result.returncode != 0:
        logger.error(f"Stage {script_name} that bai (exit code {result.returncode})")
        return False

    logger.info(f"=== Hoan thanh stage: {script_name} ===")
    return True


def main():
    logger.info("===== BAT DAU TOAN BO PIPELINE =====")

    for stage in PIPELINE_STAGES:
        if not run_stage(stage):
            logger.error("PIPELINE DUNG DO LOI")
            sys.exit(1)

    logger.info("===== PIPELINE HOAN THANH =====")


if __name__ == '__main__':
    main()

