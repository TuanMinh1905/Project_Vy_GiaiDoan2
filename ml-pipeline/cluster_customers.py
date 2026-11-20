#!/usr/bin/env python3
"""
cluster_customers.py
ML Model 2: Phân nhóm khách hàng đa chiều bằng K-Means Clustering + PCA 2D + Silhouette Score

Đặc trưng huấn luyện (100% từ dữ liệu thật trong SQLite):
  1. recency_days       : Số ngày từ đơn hàng gần nhất
  2. order_count        : Tổng số đơn hàng đã đặt (Frequency)
  3. total_revenue      : Tổng chi tiêu CLV (Monetary - EUR)
  4. avg_order_value    : Giá trị đơn hàng trung bình (AOV - EUR)
  5. discount_ratio     : Tỷ lệ sản phẩm mua có áp dụng giảm giá (Săn sale)
  6. app_ratio          : Tỷ lệ đơn hàng đặt qua App Mobile
  7. category_diversity : Số lượng danh mục sản phẩm khác nhau từng mua
  8. age_numeric        : Độ tuổi trung vị quy đổi từ nhóm tuổi (age_range)

Input : SQLite gold_customers, gold_orders, gold_sales_items
Output: SQLite ml_customer_clusters, ml_cluster_summary, ml_cluster_k_scores, ml_cluster_info
"""
import logging
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SQLITE_PATH = PROJECT_ROOT / 'data-pipeline' / 'data' / 'analytics.db'

AGE_MAP = {
    '16-25': 20.5,
    '26-35': 30.5,
    '36-45': 40.5,
    '46-55': 50.5,
    '56-65': 60.5,
}
RANDOM_STATE = 42
TARGET_K = 4  # 4 cụm hành vi cho khách đã mua + 1 nhóm Chưa Mua


def load_customer_features(conn: sqlite3.Connection) -> pd.DataFrame:
    customers = pd.read_sql("SELECT * FROM gold_customers", conn)
    orders = pd.read_sql("SELECT sale_id, customer_id, channel, revenue FROM gold_orders", conn)
    items = pd.read_sql(
        "SELECT sale_id, customer_id, category, quantity, discount_applied FROM gold_sales_items",
        conn
    )

    # Tỷ lệ đơn mua qua App Mobile
    if len(orders) > 0:
        ch_agg = orders.assign(is_app=(orders['channel'] == 'App Mobile').astype(int)) \
            .groupby('customer_id').agg(app_ratio=('is_app', 'mean')).reset_index()
    else:
        ch_agg = pd.DataFrame(columns=['customer_id', 'app_ratio'])

    # Tỷ lệ săn sale & độ đa dạng danh mục
    if len(items) > 0:
        it_agg = items.assign(disc_qty=items['quantity'] * (items['discount_applied'] > 0)) \
            .groupby('customer_id').agg(
                total_units=('quantity', 'sum'),
                disc_units=('disc_qty', 'sum'),
                category_diversity=('category', 'nunique'),
                fav_category=('category', lambda s: s.value_counts().index[0] if len(s) else 'N/A'),
            ).reset_index()
        it_agg['discount_ratio'] = np.where(
            it_agg['total_units'] > 0,
            it_agg['disc_units'] / it_agg['total_units'],
            0.0
        )
    else:
        it_agg = pd.DataFrame(columns=['customer_id', 'total_units', 'discount_ratio', 'category_diversity', 'fav_category'])

    df = customers.merge(ch_agg, on='customer_id', how='left') \
                  .merge(it_agg[['customer_id', 'total_units', 'discount_ratio', 'category_diversity', 'fav_category']],
                         on='customer_id', how='left')

    df['app_ratio'] = df['app_ratio'].fillna(0.0)
    df['total_units'] = df['total_units'].fillna(0).astype(int)
    df['discount_ratio'] = df['discount_ratio'].fillna(0.0)
    df['category_diversity'] = df['category_diversity'].fillna(0).astype(int)
    df['fav_category'] = df['fav_category'].fillna('Chưa có')
    df['age_numeric'] = df['age_range'].map(AGE_MAP).fillna(38.0)
    df['recency_days'] = df['recency_days'].fillna(999).astype(float)
    return df


def assign_cluster_personas(summary_df: pd.DataFrame) -> dict:
    """
    Gán tên cụm & chiến lược CSKH dựa trên đặc trưng trung bình thực tế của từng centroid.
    Đảm bảo 4 cụm có 4 tên riêng biệt, phản ánh đúng bản chất dữ liệu.
    """
    remaining = set(summary_df['cluster_id'].tolist())
    personas = {}

    # 1. Cụm VIP: Tổng doanh thu trung bình cao nhất
    vip_row = summary_df.sort_values(['avg_revenue', 'avg_orders'], ascending=False).iloc[0]
    cid_vip = int(vip_row['cluster_id'])
    personas[cid_vip] = {
        'name': 'VIP Đa Danh Mục & Chi Tiêu Cao',
        'badge_color': 'emerald',
        'action': 'Chăm sóc đặc quyền VIP: Ưu tiên giới thiệu BST mới (Early Access), tặng quà sinh nhật & miễn phí vận chuyển.',
        'trait': f"CLV trung bình cao nhất ({vip_row['avg_revenue']:.0f} EUR), mua trung bình {vip_row['avg_orders']:.1f} đơn across {vip_row['avg_categories']:.1f} danh mục.",
    }
    remaining.remove(cid_vip)

    # 2. Cụm Săn Sale: Tỷ lệ mua hàng giảm giá cao nhất trong các cụm còn lại
    sub = summary_df[summary_df['cluster_id'].isin(remaining)]
    promo_row = sub.sort_values('avg_discount_pct', ascending=False).iloc[0]
    cid_promo = int(promo_row['cluster_id'])
    personas[cid_promo] = {
        'name': 'Tín Đồ Săn Sale & Khuyến Mãi',
        'badge_color': 'amber',
        'action': 'Gửi thông báo Flash Sale, mã giảm giá theo combo/giỏ hàng và ưu đãi xả kho cuối mùa.',
        'trait': f"Tỷ lệ mua hàng giảm giá cao nổi bật ({promo_row['avg_discount_pct']:.1f}%), nhạy cảm với các chiến dịch khuyến mãi.",
    }
    remaining.remove(cid_promo)

    # 3. Cụm Ngủ Đông / Nguy cơ rời bỏ: Recency cao nhất trong các cụm còn lại
    sub = summary_df[summary_df['cluster_id'].isin(remaining)]
    risk_row = sub.sort_values('avg_recency', ascending=False).iloc[0]
    cid_risk = int(risk_row['cluster_id'])
    personas[cid_risk] = {
        'name': 'Khách Ngủ Đông (Nguy Cơ Rời Bỏ)',
        'badge_color': 'rose',
        'action': 'Kích hoạt chiến dịch Win-Back qua Email/App: Tặng voucher quay lại có thời hạn 7 ngày.',
        'trait': f"Đã lâu chưa quay lại mua ({risk_row['avg_recency']:.0f} ngày kể từ đơn cuối), cần tái kích hoạt ngay.",
    }
    remaining.remove(cid_risk)

    # 4. Cụm còn lại: Khách Mua Mới / Tiềm Năng
    for cid_new in remaining:
        new_row = summary_df[summary_df['cluster_id'] == cid_new].iloc[0]
        personas[int(cid_new)] = {
            'name': 'Khách Mới Tiềm Năng (Đơn Lẻ Giá Trị)',
            'badge_color': 'cyan',
            'action': 'Gửi ưu đãi Cross-sell cho đơn hàng thứ 2 trong vòng 14 ngày để chuyển đổi thành khách Trung Thành.',
            'trait': f"Mới mua gần đây ({new_row['avg_recency']:.0f} ngày trước), AOV đạt {new_row['avg_aov']:.0f} EUR, tiềm năng mua lặp lại cao.",
        }

    return personas


def main():
    logger.info("=== ML MODEL 2: Phan nhom khach hang K-Means + PCA ===")
    if not SQLITE_PATH.exists():
        logger.error(f"Khong tim thay SQLite: {SQLITE_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(SQLITE_PATH)
    df = load_customer_features(conn)

    buyers = df[df['order_count'] > 0].copy()
    non_buyers = df[df['order_count'] == 0].copy()
    logger.info(f"  Tong khach hang: {len(df)} (Da mua: {len(buyers)}, Chua mua: {len(non_buyers)})")

    feature_cols = [
        'recency_days',
        'order_count',
        'total_revenue',
        'avg_order_value',
        'discount_ratio',
        'app_ratio',
        'category_diversity',
        'age_numeric',
    ]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(buyers[feature_cols].values)

    # 1. Đánh giá Silhouette Score qua các giá trị K = 2..6
    k_records = []
    for k in range(2, 7):
        km_test = KMeans(n_clusters=k, n_init=20, random_state=RANDOM_STATE)
        labels_test = km_test.fit_predict(X_scaled)
        sil = float(silhouette_score(X_scaled, labels_test))
        inertia = float(km_test.inertia_)
        k_records.append({
            'k': k,
            'silhouette': round(sil, 4),
            'inertia': round(inertia, 1),
            'is_selected': 1 if k == TARGET_K else 0,
        })
        logger.info(f"  K={k}: Silhouette={sil:.4f}, Inertia={inertia:.1f}")

    k_scores_df = pd.DataFrame(k_records)
    best_sil = k_scores_df.loc[k_scores_df['k'] == TARGET_K, 'silhouette'].iloc[0]

    # 2. Huấn luyện K-Means chính thức với K = TARGET_K (4 cụm khách mua)
    km = KMeans(n_clusters=TARGET_K, n_init=30, random_state=RANDOM_STATE)
    buyers['cluster_id'] = km.fit_predict(X_scaled)

    # 3. Giảm chiều PCA 2D để vẽ biểu đồ phân tán (Scatter Plot)
    pca = PCA(n_components=2, random_state=RANDOM_STATE)
    coords = pca.fit_transform(X_scaled)
    buyers['pca_x'] = np.round(coords[:, 0], 3)
    buyers['pca_y'] = np.round(coords[:, 1], 3)
    explained_var = float(pca.explained_variance_ratio_.sum() * 100)

    # 4. Tổng hợp thống kê từng cụm để đặt tên tự động dựa trên Centroid
    raw_summary = buyers.groupby('cluster_id').agg(
        customer_count=('customer_id', 'count'),
        avg_revenue=('total_revenue', 'mean'),
        total_cluster_revenue=('total_revenue', 'sum'),
        avg_orders=('order_count', 'mean'),
        avg_aov=('avg_order_value', 'mean'),
        avg_recency=('recency_days', 'mean'),
        avg_discount_pct=('discount_ratio', lambda s: s.mean() * 100),
        avg_app_pct=('app_ratio', lambda s: s.mean() * 100),
        avg_categories=('category_diversity', 'mean'),
        top_country=('country', lambda s: s.value_counts().index[0] if len(s) else 'N/A'),
        top_category=('fav_category', lambda s: s.value_counts().index[0] if len(s) else 'N/A'),
    ).reset_index()

    personas = assign_cluster_personas(raw_summary)

    raw_summary['cluster_name'] = raw_summary['cluster_id'].map(lambda c: personas[int(c)]['name'])
    raw_summary['badge_color'] = raw_summary['cluster_id'].map(lambda c: personas[int(c)]['badge_color'])
    raw_summary['recommended_action'] = raw_summary['cluster_id'].map(lambda c: personas[int(c)]['action'])
    raw_summary['key_trait'] = raw_summary['cluster_id'].map(lambda c: personas[int(c)]['trait'])
    raw_summary['revenue_share_pct'] = np.round(
        raw_summary['total_cluster_revenue'] / max(buyers['total_revenue'].sum(), 1) * 100, 1
    )

    # Làm tròn các cột số trong summary
    for col in ['avg_revenue', 'total_cluster_revenue', 'avg_aov', 'avg_recency', 'avg_discount_pct', 'avg_app_pct']:
        raw_summary[col] = np.round(raw_summary[col], 1)
    for col in ['avg_orders', 'avg_categories']:
        raw_summary[col] = np.round(raw_summary[col], 2)

    # Sắp xếp cụm theo doanh thu trung bình giảm dần
    raw_summary = raw_summary.sort_values('avg_revenue', ascending=False).reset_index(drop=True)

    # Gán tên cụm cho từng khách hàng
    buyers['cluster_name'] = buyers['cluster_id'].map(lambda c: personas[int(c)]['name'])
    buyers['badge_color'] = buyers['cluster_id'].map(lambda c: personas[int(c)]['badge_color'])
    buyers['discount_pct'] = np.round(buyers['discount_ratio'] * 100, 1)
    buyers['app_pct'] = np.round(buyers['app_ratio'] * 100, 1)
    buyers['preferred_channel'] = np.where(
        buyers['app_ratio'] > 0.5, 'App Mobile',
        np.where(buyers['app_ratio'] < 0.5, 'E-commerce', 'Đa kênh (50/50)')
    )

    cols_out = [
        'customer_id', 'country', 'age_range', 'signup_date',
        'order_count', 'total_revenue', 'avg_order_value', 'recency_days',
        'discount_pct', 'app_pct', 'preferred_channel', 'category_diversity', 'fav_category',
        'segment', 'cluster_id', 'cluster_name', 'badge_color', 'pca_x', 'pca_y'
    ]
    clusters_out = buyers[cols_out].sort_values(['total_revenue', 'order_count'], ascending=False)

    info_df = pd.DataFrame([{
        'algorithm': 'K-Means Clustering (scikit-learn) + PCA 2D Projection',
        'n_clusters': TARGET_K,
        'n_buyers_clustered': len(buyers),
        'n_total_customers': len(df),
        'n_non_buyers': len(non_buyers),
        'silhouette_score': round(best_sil, 4),
        'pca_explained_var_pct': round(explained_var, 1),
        'features_used': 'Recency, Số đơn, Tổng chi tiêu (CLV), AOV, Tỷ lệ săn Sale, Tỷ lệ dùng App, Độ đa dạng danh mục, Độ tuổi',
        'trained_at': datetime.now().isoformat(timespec='seconds'),
    }])

    clusters_out.to_sql('ml_customer_clusters', conn, if_exists='replace', index=False)
    raw_summary.to_sql('ml_cluster_summary', conn, if_exists='replace', index=False)
    k_scores_df.to_sql('ml_cluster_k_scores', conn, if_exists='replace', index=False)
    info_df.to_sql('ml_cluster_info', conn, if_exists='replace', index=False)
    conn.commit()
    conn.close()

    logger.info(f"  Hoan thanh phan cum {len(buyers)} khach mua thanh {TARGET_K} cum (PCA 2D giai thich {explained_var:.1f}% phuong sai)")
    for r in raw_summary.itertuples():
        logger.info(f"    * [{r.cluster_name}]: {r.customer_count} KH | CLV TB: {r.avg_revenue} EUR | Sale: {r.avg_discount_pct}%")
    logger.info("=== Hoan thanh ML Customer Clustering ===")


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        logger.exception(f"Loi ML Customer Clustering: {e}")
        sys.exit(1)
