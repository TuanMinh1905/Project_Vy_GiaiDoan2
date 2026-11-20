#!/usr/bin/env python3
"""
run_all_ml.py — Chạy tuần tự cả 3 mô hình Machine Learning:
  1. predict_bestsellers.py  (Random Forest dự báo sản phẩm bán chạy 14 ngày tới)
  2. cluster_customers.py    (K-Means + PCA phân cụm khách hàng đa chiều)
  3. recommend_products.py   (Hybrid Recommendation gợi ý sản phẩm 2 chiều)
"""
import logging
import subprocess
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ML_DIR = Path(__file__).resolve().parent
SCRIPTS = [
    'predict_bestsellers.py',
    'cluster_customers.py',
    'recommend_products.py',
]


def main():
    logger.info("=== BAT DAU HUAN LUYEN TOAN BO 3 MO HINH MACHINE LEARNING ===")
    for name in SCRIPTS:
        script_path = ML_DIR / name
        logger.info(f">>> Chay {name} ...")
        res = subprocess.run([sys.executable, str(script_path)], check=False)
        if res.returncode != 0:
            logger.error(f"Script {name} that bai voi exit code {res.returncode}")
            sys.exit(res.returncode)
    logger.info("=== HOAN THANH TOAN BO 3 MO HINH MACHINE LEARNING ===")


if __name__ == '__main__':
    main()

