#!/usr/bin/env python3
"""
predict_bestsellers.py
ML: Dự đoán sản phẩm bán chạy trong kỳ tới (14 ngày)

Dữ liệu chỉ có ~2.5 tháng (04/2025 -> 06/2025) nên không thể dự đoán theo quý/mùa.
Cách làm:
  1. Chia lịch sử thành các kỳ 14 ngày, tính lùi từ ngày bán cuối cùng.
  2. Mỗi (sản phẩm, kỳ t) là 1 mẫu: features = lịch sử bán tới kỳ t-1 + thuộc tính sản phẩm,
     target = số lượng bán trong kỳ t.
  3. Backtest: train trên các kỳ cũ, test trên kỳ gần nhất -> so sánh Dự đoán vs Thực tế,
     so với baseline "kỳ sau = kỳ trước".
  4. Train lại trên toàn bộ, dự đoán kỳ kế tiếp (14 ngày sau ngày cuối).

Input : SQLite gold_sales_items, gold_products
Output: SQLite ml_predictions, ml_backtest, ml_model_info
"""
import logging
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SQLITE_PATH = PROJECT_ROOT / 'data-pipeline' / 'data' / 'analytics.db'

PERIOD_DAYS = 14
MIN_HISTORY = 2      # cần ít nhất 2 kỳ lịch sử để làm features
TOP_N = 20
RANDOM_STATE = 42


def load(conn):
    items = pd.read_sql("SELECT product_id, sale_id, sale_date, quantity, discount_applied FROM gold_sales_items", conn,
                        parse_dates=['sale_date'])
    products = pd.read_sql("SELECT product_id, product_name, category, catalog_price, cost_price, stock_quantity "
                           "FROM gold_products", conn)
    return items, products


def assign_periods(items: pd.DataFrame):
    """period 0 = kỳ cũ nhất, period P-1 = 14 ngày cuối cùng."""
    last = items['sale_date'].max().normalize()
    back = ((last - items['sale_date'].dt.normalize()).dt.days // PERIOD_DAYS)
    n_periods = int(back.max()) + 1
    items = items.assign(period=(n_periods - 1 - back).astype(int))
    starts = {p: last - pd.Timedelta(days=(n_periods - p) * PERIOD_DAYS - 1) for p in range(n_periods + 1)}
    return items, n_periods, starts


def build_panel(items, products, n_periods):
    qty = items.pivot_table(index='product_id', columns='period', values='quantity', aggfunc='sum', fill_value=0)
    qty = qty.reindex(index=products['product_id'], columns=range(n_periods), fill_value=0)
    disc = items.assign(dq=items['quantity'] * (items['discount_applied'] > 0)) \
        .pivot_table(index='product_id', columns='period', values='dq', aggfunc='sum', fill_value=0) \
        .reindex(index=products['product_id'], columns=range(n_periods), fill_value=0)
    return qty, disc


def make_features(t, qty, disc, products, categories):
    """Features cho kỳ mục tiêu t (chỉ dùng dữ liệu < t)."""
    hist = qty.loc[:, :t - 1]
    f = pd.DataFrame(index=qty.index)
    f['lag1'] = qty[t - 1]
    f['lag2'] = qty[t - 2]
    f['hist_mean'] = hist.mean(axis=1)
    f['hist_max'] = hist.max(axis=1)
    f['trend'] = f['lag1'] - f['lag2']
    f['disc_share_lag1'] = np.where(f['lag1'] > 0, disc[t - 1] / f['lag1'].replace(0, 1), 0)
    p = products.set_index('product_id').reindex(qty.index)
    f['price'] = p['catalog_price']
    f['margin'] = (p['catalog_price'] - p['cost_price']) / p['catalog_price']
    f['stock'] = p['stock_quantity']
    # Độ phổ biến của danh mục ở kỳ trước
    cat = p['category']
    f['cat_lag1_mean'] = f.groupby(cat)['lag1'].transform('mean')
    for c in categories:
        f[f'cat_{c}'] = (cat == c).astype(int)
    return f


def build_xy(periods, qty, disc, products, categories):
    X, y = [], []
    for t in periods:
        X.append(make_features(t, qty, disc, products, categories))
        y.append(qty[t])
    return pd.concat(X), pd.concat(y)


def new_model():
    return RandomForestRegressor(n_estimators=300, min_samples_leaf=3, random_state=RANDOM_STATE, n_jobs=-1)


def tree_confidence(model, X, pred):
    """Độ tin cậy ~ mức đồng thuận giữa các cây (std nhỏ so với dự đoán -> tin cậy cao)."""
    all_preds = np.stack([t.predict(X.values) for t in model.estimators_])
    std = all_preds.std(axis=0)
    return np.clip(100 * (1 - std / (np.abs(pred) + std + 1e-9)), 0, 100)


def main():
    logger.info("=== ML: Du doan san pham ban chay (14 ngay toi) ===")
    if not SQLITE_PATH.exists():
        logger.error(f"Khong tim thay SQLite: {SQLITE_PATH}. Chay pipeline truoc.")
        sys.exit(1)

    conn = sqlite3.connect(SQLITE_PATH)
    items, products = load(conn)
    items, P, starts = assign_periods(items)
    categories = sorted(products['category'].dropna().unique())
    qty, disc = build_panel(items, products, P)
    logger.info(f"  {len(products)} san pham, {P} ky x {PERIOD_DAYS} ngay")

    if P < MIN_HISTORY + 2:
        logger.error("Khong du lich su de train + backtest")
        sys.exit(1)

    # ---- 1. Backtest: train kỳ [2..P-2], test kỳ P-1 ----
    X_tr, y_tr = build_xy(range(MIN_HISTORY, P - 1), qty, disc, products, categories)
    X_te = make_features(P - 1, qty, disc, products, categories)
    y_te = qty[P - 1]
    m = new_model().fit(X_tr.values, y_tr.values)
    pred_te = m.predict(X_te.values)
    baseline = X_te['lag1'].values

    mae = mean_absolute_error(y_te, pred_te)
    mae_base = mean_absolute_error(y_te, baseline)
    r2 = r2_score(y_te, pred_te)
    top_pred = set(X_te.index[np.argsort(-pred_te)[:TOP_N]])
    top_act = set(y_te.sort_values(ascending=False).index[:TOP_N])
    hit = len(top_pred & top_act) / TOP_N * 100
    logger.info(f"  Backtest: MAE={mae:.2f} (baseline {mae_base:.2f}), R2={r2:.3f}, Top{TOP_N} hit={hit:.0f}%")

    names = products.set_index('product_id')
    backtest = pd.DataFrame({
        'product_id': X_te.index, 'product_name': names.loc[X_te.index, 'product_name'].values,
        'category': names.loc[X_te.index, 'category'].values,
        'predicted': np.round(pred_te, 2), 'actual': y_te.values, 'baseline': baseline,
        'period_start': starts[P - 1].strftime('%Y-%m-%d'),
        'period_end': (starts[P] - pd.Timedelta(days=1)).strftime('%Y-%m-%d'),
    })

    # ---- 2. Train lại toàn bộ, dự đoán kỳ P (tương lai) ----
    X_all, y_all = build_xy(range(MIN_HISTORY, P), qty, disc, products, categories)
    final = new_model().fit(X_all.values, y_all.values)
    X_fut = make_features(P, qty.assign(**{str(P): 0}).rename(columns={str(P): P}),
                          disc.assign(**{str(P): 0}).rename(columns={str(P): P}), products, categories)
    pred = final.predict(X_fut.values)
    conf = tree_confidence(final, X_fut, pred)
    last_qty = X_fut['lag1'].values
    trend = np.where(pred > last_qty * 1.1, 'up', np.where(pred < last_qty * 0.9, 'down', 'stable'))

    period_start = starts[P - 1] + pd.Timedelta(days=PERIOD_DAYS)
    preds = pd.DataFrame({
        'product_id': X_fut.index, 'product_name': names.loc[X_fut.index, 'product_name'].values,
        'category': names.loc[X_fut.index, 'category'].values,
        'predicted_qty': np.round(pred, 2), 'last_period_qty': last_qty,
        'trend': trend, 'confidence': np.round(conf, 1),
        'period_start': period_start.strftime('%Y-%m-%d'),
        'period_end': (period_start + pd.Timedelta(days=PERIOD_DAYS - 1)).strftime('%Y-%m-%d'),
    }).sort_values('predicted_qty', ascending=False)
    preds.insert(0, 'rank', range(1, len(preds) + 1))

    importances = sorted(zip(X_all.columns, final.feature_importances_), key=lambda x: -x[1])
    info = pd.DataFrame([{
        'algorithm': 'Random Forest Regressor (scikit-learn, 300 cây)',
        'target': f'Số lượng bán mỗi sản phẩm trong {PERIOD_DAYS} ngày tới',
        'horizon_days': PERIOD_DAYS,
        'mae': round(mae, 3), 'baseline_mae': round(mae_base, 3), 'r2': round(r2, 3),
        'top_n': TOP_N, 'top_n_hit_pct': round(hit, 1),
        'n_train_samples': len(X_all), 'n_products': len(products), 'n_periods': P,
        'data_from': items['sale_date'].min().strftime('%Y-%m-%d'),
        'data_to': items['sale_date'].max().strftime('%Y-%m-%d'),
        'top_features': ', '.join(f'{n} ({v:.0%})' for n, v in importances[:5]),
        'trained_at': datetime.now().isoformat(timespec='seconds'),
    }])

    preds.to_sql('ml_predictions', conn, if_exists='replace', index=False)
    backtest.to_sql('ml_backtest', conn, if_exists='replace', index=False)
    info.to_sql('ml_model_info', conn, if_exists='replace', index=False)
    conn.commit()
    conn.close()
    logger.info(f"  Du doan ky {preds['period_start'].iloc[0]} -> {preds['period_end'].iloc[0]}")
    logger.info("  Top 5: " + '; '.join(f"{r.product_name} ({r.predicted_qty:.1f})" for r in preds.head(5).itertuples()))
    logger.info("=== Hoan thanh ML prediction ===")


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        logger.exception(f"Loi ML prediction: {e}")
        sys.exit(1)
