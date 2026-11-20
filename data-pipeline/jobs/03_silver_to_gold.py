#!/usr/bin/env python3
"""
03_silver_to_gold.py
Stage: MinIO Silver → MinIO Gold
Tạo các bảng Gold analytics-ready từ Silver tables
"""
import logging
import sys
import io
import pandas as pd

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

MINIO_ENDPOINT   = 'localhost:9000'
MINIO_ACCESS_KEY = 'minioadmin'
MINIO_SECRET_KEY = 'minioadmin'
SILVER_BUCKET    = 'silver'
GOLD_BUCKET      = 'gold'


def get_minio_client():
    from minio import Minio
    return Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=False)


def read_parquet(client, bucket, name) -> pd.DataFrame:
    r = client.get_object(bucket, f'latest/{name}.parquet')
    return pd.read_parquet(io.BytesIO(r.read()))


def upload_parquet(client, df, bucket, name):
    buf = io.BytesIO()
    df.to_parquet(buf, index=False)
    buf.seek(0)
    client.put_object(bucket, f'latest/{name}.parquet', buf, buf.getbuffer().nbytes,
                      content_type='application/octet-stream')


def build_gold_sales(orders, order_items, products):
    """Gold: orders joined với items và products"""
    df = order_items.merge(orders, on='order_id', how='left')
    df = df.merge(products[['product_id', 'name', 'category', 'brand', 'color', 'price', 'cost']],
                  on='product_id', how='left', suffixes=('', '_product'))

    # Tính revenue, profit
    df['revenue']  = df['unit_price'] * df['quantity']
    df['discount_amount'] = df.get('discount', pd.Series(0)) * df['revenue']
    df['net_revenue'] = df['revenue'] - df['discount_amount']
    df['profit']   = (df['unit_price'] - df['cost']) * df['quantity']

    # Trích ngày
    if 'order_date' in df.columns:
        df['order_date'] = pd.to_datetime(df['order_date'])
        df['year']   = df['order_date'].dt.year
        df['month']  = df['order_date'].dt.month
        df['quarter']= df['order_date'].dt.quarter
        df['week']   = df['order_date'].dt.isocalendar().week.astype(int)

    return df


def build_gold_customers(customers, orders, order_items):
    """Gold: Customer-level aggregation (CLV, frequency, recency)"""
    sales = order_items.merge(orders, on='order_id', how='left')
    sales['revenue'] = sales['unit_price'] * sales['quantity']

    agg = sales.groupby('customer_id').agg(
        total_revenue=('revenue', 'sum'),
        order_count=('order_id', 'nunique'),
        avg_order_value=('revenue', 'mean'),
        last_order_date=('order_date', 'max'),
        first_order_date=('order_date', 'min'),
    ).reset_index()

    df = customers.merge(agg, on='customer_id', how='left')
    df['total_revenue'] = df['total_revenue'].fillna(0)
    df['order_count']   = df['order_count'].fillna(0)
    return df


def build_gold_products_agg(order_items, products, orders):
    """Gold: Product-level aggregation"""
    sales = order_items.merge(orders[['order_id', 'order_date', 'status']], on='order_id', how='left')
    sales['revenue'] = sales['unit_price'] * sales['quantity']
    sales['order_date'] = pd.to_datetime(sales['order_date'])

    agg = sales.groupby('product_id').agg(
        total_revenue=('revenue', 'sum'),
        total_quantity=('quantity', 'sum'),
        order_count=('order_id', 'nunique'),
    ).reset_index()

    df = products.merge(agg, on='product_id', how='left')
    return df


def main():
    logger.info("=== STAGE 3: Silver → Gold ===")
    try:
        client = get_minio_client()
        if not client.bucket_exists(GOLD_BUCKET):
            client.make_bucket(GOLD_BUCKET)

        # Đọc Silver tables
        logger.info("Doc Silver tables...")
        orders      = read_parquet(client, SILVER_BUCKET, 'orders')
        order_items = read_parquet(client, SILVER_BUCKET, 'order_items')
        products    = read_parquet(client, SILVER_BUCKET, 'products')
        customers   = read_parquet(client, SILVER_BUCKET, 'customers')

        # Build Gold tables
        logger.info("Build gold_sales...")
        gold_sales = build_gold_sales(orders, order_items, products)
        upload_parquet(client, gold_sales, GOLD_BUCKET, 'gold_sales')
        logger.info(f"  gold_sales: {len(gold_sales)} ban ghi")

        logger.info("Build gold_customers...")
        gold_customers = build_gold_customers(customers, orders, order_items)
        upload_parquet(client, gold_customers, GOLD_BUCKET, 'gold_customers')
        logger.info(f"  gold_customers: {len(gold_customers)} ban ghi")

        logger.info("Build gold_products_agg...")
        gold_products = build_gold_products_agg(order_items, products, orders)
        upload_parquet(client, gold_products, GOLD_BUCKET, 'gold_products_agg')
        logger.info(f"  gold_products_agg: {len(gold_products)} ban ghi")

        logger.info("=== Hoan thanh: Silver → Gold ===")

    except Exception as e:
        logger.error(f"Loi stage Gold: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
