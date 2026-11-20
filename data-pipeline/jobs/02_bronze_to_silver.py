#!/usr/bin/env python3
"""
02_bronze_to_silver.py
Stage: Bronze (CSV thô) -> Silver (Parquet đã làm sạch, đúng kiểu dữ liệu)

Làm sạch: bỏ trùng theo khóa chính, ép kiểu số/ngày, chuẩn hóa % -> số thực,
bỏ dòng thiếu khóa, loại bản ghi mồ côi (item không có sale, sale không có customer...).
"""
import logging
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lake import Lake  # noqa: E402

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BRONZE, SILVER = 'bronze', 'silver'
PREFIX = 'latest/dataset_fashion_store_'

# table: (file, primary key, numeric cols, date cols, percent cols)
TABLES = {
    'customers':  ('customers',  ['customer_id'], ['customer_id'], ['signup_date'], []),
    'products':   ('products',   ['product_id'],
                   ['product_id', 'catalog_price', 'cost_price'], [], []),
    'sales':      ('sales',      ['sale_id'],
                   ['sale_id', 'discounted', 'total_amount', 'customer_id'], ['sale_date'], []),
    'sale_items': ('salesitems', ['item_id'],
                   ['item_id', 'sale_id', 'product_id', 'quantity', 'original_price', 'unit_price',
                    'discount_applied', 'discounted', 'item_total'], ['sale_date'], ['discount_percent']),
    'channels':   ('channels',   ['channel'], [], [], []),
    'campaigns':  ('campaigns',  ['campaign_id'], ['campaign_id'], ['start_date', 'end_date'], []),
    'stock':      ('stock',      ['country', 'product_id'], ['product_id', 'stock_quantity'], [], []),
}


def to_number_percent(s: pd.Series) -> pd.Series:
    """'30.00%' -> 0.30"""
    return pd.to_numeric(s.astype(str).str.replace('%', '', regex=False).str.strip(), errors='coerce') / 100


def clean(df: pd.DataFrame, pk, num_cols, date_cols, pct_cols) -> pd.DataFrame:
    df = df.copy()
    df.columns = [c.strip().lower() for c in df.columns]
    for c in df.select_dtypes(include=['object', 'string']).columns:
        df[c] = df[c].astype('string').str.strip()
    for c in num_cols:
        df[c] = pd.to_numeric(df[c], errors='coerce')
    for c in date_cols:
        df[c] = pd.to_datetime(df[c], errors='coerce')
    for c in pct_cols:
        df[c] = to_number_percent(df[c])
    before = len(df)
    df = df.dropna(subset=pk).drop_duplicates(subset=pk, keep='first')
    if len(df) != before:
        logger.info(f"    bo {before - len(df)} dong trung/thieu khoa")
    return df


def main():
    logger.info("=== STAGE 2: Bronze -> Silver ===")
    lake = Lake()
    tables = {}
    for name, (file, pk, num, dates, pct) in TABLES.items():
        raw = lake.get_csv(BRONZE, f'{PREFIX}{file}.csv')
        tables[name] = clean(raw, pk, num, dates, pct)
        logger.info(f"  {name}: {len(raw)} -> {len(tables[name])} dong")

    # Campaign discount_value: '10.00%' (Percentage) hoặc '10' (Fixed, EUR)
    cp = tables['campaigns']
    is_pct = cp['discount_value'].astype(str).str.contains('%')
    cp['discount_value'] = pd.to_numeric(cp['discount_value'].astype(str).str.replace('%', ''), errors='coerce')
    cp.loc[is_pct, 'discount_value'] = cp.loc[is_pct, 'discount_value'] / 100

    # Toàn vẹn tham chiếu
    s, it = tables['sales'], tables['sale_items']
    n = len(s)
    tables['sales'] = s = s[s['customer_id'].isin(tables['customers']['customer_id'])]
    if len(s) != n:
        logger.warning(f"  bo {n - len(s)} sale khong co customer")
    n = len(it)
    it = it[it['sale_id'].isin(s['sale_id']) & it['product_id'].isin(tables['products']['product_id'])]
    tables['sale_items'] = it
    if len(it) != n:
        logger.warning(f"  bo {n - len(it)} item mo coi")

    for name, df in tables.items():
        lake.put_parquet(SILVER, name, df)
    logger.info(f"=== Hoan thanh: {len(tables)} bang -> Silver ===")


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        logger.error(f"Loi stage Silver: {e}")
        sys.exit(1)
