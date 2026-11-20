#!/usr/bin/env python3
"""
03_silver_to_gold.py
Stage: Silver -> Gold (bảng phân tích sẵn sàng cho Dashboard)

Gold tables:
  gold_sales_items  : fact cấp dòng hàng (item) + thông tin sản phẩm, đơn, thời gian, lợi nhuận
  gold_orders       : fact cấp đơn hàng (sale)
  gold_customers    : khách hàng + tổng hợp (CLV, số đơn, recency) + phân khúc
  gold_products     : sản phẩm + tổng hợp doanh thu/số lượng/lợi nhuận + tồn kho
  dim_campaigns, dim_channels, dim_stock : bảng chiều giữ nguyên
"""
import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lake import Lake  # noqa: E402

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

SILVER, GOLD = 'silver', 'gold'


def add_time_parts(df: pd.DataFrame, col: str) -> pd.DataFrame:
    d = df[col]
    df['year'] = d.dt.year
    df['quarter'] = d.dt.quarter
    df['month'] = d.dt.strftime('%Y-%m')
    df['week'] = d.dt.to_period('W-SUN').dt.start_time.dt.strftime('%Y-%m-%d')  # thứ 2 đầu tuần
    return df


def build_sales_items(items, sales, products):
    df = items.drop(columns=['sale_date', 'channel', 'discounted'], errors='ignore') \
        .merge(sales[['sale_id', 'sale_date', 'channel', 'customer_id', 'country']], on='sale_id', how='left') \
        .merge(products[['product_id', 'product_name', 'category', 'brand', 'color', 'size',
                         'catalog_price', 'cost_price', 'gender']], on='product_id', how='left')
    df = df.rename(columns={'channel_campaigns': 'campaign_channel'})
    df['revenue'] = df['item_total']
    df['gross_revenue'] = df['original_price'] * df['quantity']
    df['discount_amount'] = df['gross_revenue'] - df['revenue']
    df['cost'] = df['cost_price'] * df['quantity']
    df['profit'] = df['revenue'] - df['cost']
    return add_time_parts(df, 'sale_date')


def build_orders(sales, items_gold):
    agg = items_gold.groupby('sale_id').agg(
        item_count=('item_id', 'count'), units=('quantity', 'sum'),
        profit=('profit', 'sum'), discount_amount=('discount_amount', 'sum'),
    ).reset_index()
    df = sales.merge(agg, on='sale_id', how='left')
    df['revenue'] = df['total_amount']
    return add_time_parts(df, 'sale_date')


def segment_customers(df: pd.DataFrame) -> pd.Series:
    """Phân khúc RFM đơn giản:
       VIP         : top 20% CLV và >= 2 đơn
       Trung Thành : >= 2 đơn
       Tiềm Năng   : 1 đơn, CLV >= trung vị
       Mới         : 1 đơn, CLV < trung vị
       Chưa Mua    : 0 đơn"""
    buyers = df[df['order_count'] > 0]
    p80 = buyers['total_revenue'].quantile(0.8) if len(buyers) else 0
    med = buyers['total_revenue'].median() if len(buyers) else 0
    conds = [
        df['order_count'] == 0,
        (df['total_revenue'] >= p80) & (df['order_count'] >= 2),
        df['order_count'] >= 2,
        df['total_revenue'] >= med,
    ]
    return pd.Series(np.select(conds, ['Chưa Mua', 'VIP', 'Trung Thành', 'Tiềm Năng'], 'Mới'), index=df.index)


def build_customers(customers, orders):
    ref_date = orders['sale_date'].max()
    agg = orders.groupby('customer_id').agg(
        total_revenue=('revenue', 'sum'), order_count=('sale_id', 'nunique'),
        total_profit=('profit', 'sum'),
        first_order_date=('sale_date', 'min'), last_order_date=('sale_date', 'max'),
    ).reset_index()
    df = customers.merge(agg, on='customer_id', how='left')
    df[['total_revenue', 'order_count', 'total_profit']] = df[['total_revenue', 'order_count', 'total_profit']].fillna(0)
    df['avg_order_value'] = np.where(df['order_count'] > 0, df['total_revenue'] / df['order_count'].replace(0, 1), 0)
    df['recency_days'] = (ref_date - df['last_order_date']).dt.days
    df['segment'] = segment_customers(df)
    return df


def build_products(products, items_gold, stock):
    agg = items_gold.groupby('product_id').agg(
        total_revenue=('revenue', 'sum'), total_quantity=('quantity', 'sum'),
        total_profit=('profit', 'sum'), order_count=('sale_id', 'nunique'),
        discounted_units=('quantity', lambda q: q[items_gold.loc[q.index, 'discount_applied'] > 0].sum()),
    ).reset_index()
    stk = stock.groupby('product_id')['stock_quantity'].sum().rename('stock_quantity').reset_index()
    df = products.merge(agg, on='product_id', how='left').merge(stk, on='product_id', how='left')
    num = ['total_revenue', 'total_quantity', 'total_profit', 'order_count', 'discounted_units', 'stock_quantity']
    df[num] = df[num].fillna(0)
    df['margin_pct'] = np.where(df['total_revenue'] > 0, df['total_profit'] / df['total_revenue'] * 100, 0)
    return df


def main():
    logger.info("=== STAGE 3: Silver -> Gold ===")
    lake = Lake()
    t = {n: lake.get_parquet(SILVER, n) for n in
         ['sales', 'sale_items', 'products', 'customers', 'campaigns', 'channels', 'stock']}

    gold = {}
    gold['gold_sales_items'] = build_sales_items(t['sale_items'], t['sales'], t['products'])
    gold['gold_orders'] = build_orders(t['sales'], gold['gold_sales_items'])
    gold['gold_customers'] = build_customers(t['customers'], gold['gold_orders'])
    gold['gold_products'] = build_products(t['products'], gold['gold_sales_items'], t['stock'])
    gold['dim_campaigns'] = t['campaigns']
    gold['dim_channels'] = t['channels']
    gold['dim_stock'] = t['stock']

    for name, df in gold.items():
        lake.put_parquet(GOLD, name, df)
        logger.info(f"  {name}: {len(df)} dong")
    logger.info("=== Hoan thanh: Silver -> Gold ===")


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        logger.error(f"Loi stage Gold: {e}")
        sys.exit(1)
