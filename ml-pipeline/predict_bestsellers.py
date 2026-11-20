#!/usr/bin/env python3
"""
predict_bestsellers.py
ML Model: Dự đoán sản phẩm bán chạy theo quý/mùa tới
Input: gold_sales trong SQLite
Output: ml_predictions trong SQLite
"""
import logging
import sys
import sqlite3
from pathlib import Path
from datetime import datetime

import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

PROJECT_ROOT = Path(__file__).parent.parent
SQLITE_PATH  = PROJECT_ROOT / 'data-pipeline' / 'data' / 'analytics.db'


def load_sales_data(conn: sqlite3.Connection) -> pd.DataFrame:
    query = """
        SELECT 
            product_id, name, category, brand,
            year, quarter, month,
            SUM(total_quantity) as qty,
            SUM(net_revenue) as revenue
        FROM gold_sales
        GROUP BY product_id, name, category, brand, year, quarter, month
        ORDER BY year, quarter, month
    """
    return pd.read_sql(query, conn)


def predict_next_quarter(df: pd.DataFrame) -> pd.DataFrame:
    """
    Dự đoán sản phẩm bán chạy quý tới dựa trên:
    - Trung bình qty của quý tương đương năm trước
    - Trend gần nhất (3 quý)
    - Seasonality score (quý nào hay bán nhiều hơn)
    """
    if df.empty:
        return pd.DataFrame()

    # Tính điểm theo quý (seasonality)
    quarterly_avg = df.groupby(['product_id', 'name', 'category', 'quarter'])['qty'].mean().reset_index()
    quarterly_avg.rename(columns={'qty': 'avg_qty_by_quarter'}, inplace=True)

    # Trend: Tổng qty 3 quý gần nhất
    df_sorted = df.sort_values(['year', 'quarter'])
    recent = df_sorted.groupby('product_id').tail(3)
    recent_trend = recent.groupby('product_id')['qty'].sum().reset_index()
    recent_trend.rename(columns={'qty': 'recent_3q_qty'}, inplace=True)

    # Lấy current quarter để dự đoán quý tiếp
    now = datetime.now()
    current_q = (now.month - 1) // 3 + 1
    next_q = current_q % 4 + 1

    # Lấy seasonality cho quý tới
    next_q_season = quarterly_avg[quarterly_avg['quarter'] == next_q].copy()

    # Merge trends
    result = next_q_season.merge(recent_trend, on='product_id', how='left')
    result['recent_3q_qty'] = result['recent_3q_qty'].fillna(0)

    # Score tổng hợp (normalize)
    max_season = result['avg_qty_by_quarter'].max() or 1
    max_recent = result['recent_3q_qty'].max() or 1
    result['score'] = (
        0.6 * result['avg_qty_by_quarter'] / max_season +
        0.4 * result['recent_3q_qty'] / max_recent
    )

    # Confidence: dựa trên số điểm data có
    result['confidence'] = np.clip(result['score'] * 1.2, 0, 1)
    result['predicted_quarter'] = next_q
    result['predicted_year'] = now.year if next_q > current_q else now.year + 1
    result['predicted_at'] = datetime.now().isoformat()

    return result.sort_values('score', ascending=False).head(20)


def save_predictions(df: pd.DataFrame, conn: sqlite3.Connection):
    df.to_sql('ml_predictions', conn, if_exists='replace', index=False)
    logger.info(f"Da luu {len(df)} predictions vao SQLite")


def main():
    logger.info("=== ML: Du doan san pham ban chay ===")

    if not SQLITE_PATH.exists():
        logger.error(f"Khong tim thay SQLite: {SQLITE_PATH}. Chay pipeline truoc.")
        sys.exit(1)

    try:
        conn = sqlite3.connect(str(SQLITE_PATH))

        logger.info("Doc data tu gold_sales...")
        df = load_sales_data(conn)
        logger.info(f"  {len(df)} ban ghi")

        logger.info("Chay ML du doan...")
        predictions = predict_next_quarter(df)
        logger.info(f"  {len(predictions)} san pham du doan")

        logger.info("Luu predictions vao SQLite...")
        save_predictions(predictions, conn)
        conn.close()

        logger.info("=== Hoan thanh ML prediction ===")

    except Exception as e:
        logger.error(f"Loi ML prediction: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
