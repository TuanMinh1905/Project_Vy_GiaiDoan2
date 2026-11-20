# SUMMARY — Hệ thống Analytics Platform Thời trang E-Commerce
# Dành cho: AI conversation mới / người đọc lần đầu
# Cập nhật lần cuối: 20/11/2026

---

## 1. DỰ ÁN LÀ GÌ

Hệ thống phân tích dữ liệu bán hàng thời trang e-commerce chạy trực tiếp trên máy tính (Desktop App):
- **Auto Pipeline**: CSV thô (`raw_data/`) → Data Lake (Bronze → Silver → Gold, hỗ trợ cả MinIO Docker và Local Lake fallback) → SQLite (`data-pipeline/data/analytics.db`)
- **Desktop App**: Electron 28 + React 18 + Vite + Tailwind + Recharts — 5 Dashboard phân tích BI + **3 tab Machine Learning chuyên sâu** + 1 tab Pipeline Control, tất cả đọc dữ liệu thật từ SQLite qua Electron IPC (`better-sqlite3`)
- **Bộ 3 Mô hình Machine Learning (100% Dữ liệu thật từ 7 file CSV gốc)**:
  1. **ML Dự Đoán Bán Chạy (`predict_bestsellers.py`)**: `RandomForestRegressor` (scikit-learn, 300 cây) dự đoán sản phẩm bán chạy trong kỳ 14 ngày tới, có Backtest so sánh Dự đoán vs Thực tế vs Baseline.
  2. **ML Phân Cụm Khách Hàng (`cluster_customers.py`)**: `K-Means Clustering` đa chiều (8 features chuẩn hóa `StandardScaler`) + đánh giá số cụm tối ưu bằng `Silhouette Score` ($K=2..6$) + giảm chiều `PCA 2D` vẽ biểu đồ phân tán và tự động gán chân dung & chiến lược CSKH cho 4 cụm khách mua.
  3. **ML Gợi Ý Sản Phẩm Hybrid 2 Chiều (`recommend_products.py`)**: Kết hợp `Item-Item Collaborative Filtering (Cosine Similarity)`, `Content-Based Affinity` và `Market Basket Co-occurrence (Lift & Confidence)` phục vụ gợi ý cá nhân hóa theo Khách hàng (Customer $\to$ Top 6 Products) và gợi ý Mua kèm theo Sản phẩm (Product $\to$ Top 6 Cross-sell).

---

## 2. GITHUB

| Repository | Mục đích |
|---|---|
| `Project_Vy_GiaiDoan2` | Repo chính — đang làm |
| `Project_ChiVy_GiaiDoan1` | Phase 1 cũ — tham khảo pipeline |

---

## 3. TECH STACK

| Layer | Công nghệ | Vai trò |
|---|---|---|
| Desktop | Electron 28 + electron-vite | Native desktop app |
| Frontend | React 18 + Vite | UI renderer |
| Styling | Tailwind CSS | Utility CSS + `.cvy-*` classes |
| Charts | Recharts | Biểu đồ tương tác (Bar, Line, Pie, Scatter PCA 2D) |
| Data Lake | MinIO (Docker) / Local Parquet Lake | Lưu trữ phân tầng Bronze/Silver/Gold |
| ETL | Python 3 + pandas + pyarrow | Làm sạch và tổng hợp dữ liệu |
| Serving DB | SQLite + `better-sqlite3` | Truy vấn đồng bộ tốc độ cao cho Dashboard |
| ML | scikit-learn (`RandomForestRegressor`, `KMeans`, `PCA`, `cosine_similarity`) | Bộ 3 mô hình ML: Dự báo bán chạy, Phân cụm khách hàng, Gợi ý sản phẩm 2 chiều |

---

## 4. TRẠNG THÁI HIỆN TẠI

### Phase 0: Setup — HOÀN THÀNH
- [x] Git init + remote origin set
- [x] `.gitignore` (bỏ qua `node_modules`, `*.db`, `data-pipeline/data/`, `out/`)
- [x] `.agent` (4 quy tắc tự động)
- [x] `doc/CODE_RULES.md`
- [x] `doc/SUMMARY.md` (file này)
- [x] Electron + React + Vite + Tailwind config

### Phase 1: Data Pipeline — HOÀN THÀNH (DỮ LIỆU THẬT)
- [x] `data-pipeline/lake.py` — Lớp trừu tượng Data Lake: tự động dùng MinIO (`localhost:9000`) nếu đang chạy, hoặc fallback về thư mục `data-pipeline/data/lake/` khi chưa bật Docker
- [x] `01_ingest_bronze.py` — Đọc 7 file CSV trong `raw_data/` đưa vào Bronze (`latest/` và `snapshots/<YYYY-MM-DD>/`)
- [x] `02_bronze_to_silver.py` — Làm sạch, chuẩn hóa kiểu số/ngày/phần trăm, kiểm tra khóa chính và toàn vẹn tham chiếu cho 7 bảng (`customers`: 1000, `products`: 500, `sales`: 905, `sale_items`: 2253, `channels`: 2, `campaigns`: 7, `stock`: 1000)
- [x] `03_silver_to_gold.py` — Tạo các bảng phân tích Gold: `gold_sales_items`, `gold_orders`, `gold_customers`, `gold_products`, `dim_campaigns`, `dim_channels`, `dim_stock`
- [x] `04_gold_to_sqlite.py` — Nạp toàn bộ bảng Gold vào SQLite `data-pipeline/data/analytics.db` (ghi nguyên tử qua file tạm, giữ lại toàn bộ các bảng của 3 mô hình ML khi chạy lại ETL)

### Phase 2: Desktop App UI + Kết nối SQLite — HOÀN THÀNH (9 TABS)
- [x] `desktop-app/src/main/db.js` — Truy vấn SQLite bằng `better-sqlite3` cho 5 tab BI + 3 tab ML
- [x] `desktop-app/src/main/index.js` — IPC handlers `get-dashboard-data`, `reload-database`, `run-pipeline` (hỗ trợ chạy cả bộ ML `run_all_ml.py` hoặc chạy lẻ từng model `ml_forecast`, `ml_cluster`, `ml_recommend`)
- [x] Tab 1 (`Ctrl+1`) — **Tổng Quan (Overview)**: KPI doanh thu (324,236.66 EUR), 905 đơn, 580 khách mua, AOV 358.27 EUR, xu hướng tháng T4–T6/2025, doanh thu theo kênh
- [x] Tab 2 (`Ctrl+2`) — **Sản Phẩm (Products)**: Lọc theo danh mục (`Ctrl+F`), Top 10 sản phẩm theo doanh thu, Donut doanh thu 5 danh mục, bảng chi tiết số lượng và biên lợi nhuận
- [x] Tab 3 (`Ctrl+3`) — **Khách Hàng (Customers)**: KPI khách hàng & tỷ lệ mua lại, Donut phân khúc RFM, CLV Histogram, phân bổ độ tuổi
- [x] Tab 4 (`Ctrl+4`) — **Địa Lý (Geography)**: Biểu đồ & bảng tổng hợp 6 quốc gia châu Âu (Germany, France, Italy, Netherlands, Spain, Portugal), click xem chi tiết từng nước
- [x] Tab 5 (`Ctrl+5`) — **Kênh Bán (Channels)**: So sánh `E-commerce` và `App Mobile` theo Doanh thu / Đơn hàng / AOV và xu hướng theo tháng
- [x] Tab 6 (`Ctrl+6`) — **ML Dự Đoán (MLForecast)**: Dự báo Top 20 sản phẩm bán chạy 14 ngày tới bằng Random Forest, biểu đồ Backtest, nút huấn luyện lại riêng
- [x] Tab 7 (`Ctrl+7`) — **ML Phân Cụm KH (MLClustering)**: Biểu đồ Silhouette Score ($K=2..6$), Bản đồ phân tán cụm 2D PCA (`ScatterChart`), 4 Thẻ Hồ Sơ Cụm & Chiến dịch CSKH, bảng lọc & đối chiếu Cụm K-Means với RFM truyền thống
- [x] Tab 8 (`Ctrl+8`) — **ML Gợi Ý SP (MLRecommend)**: Chuyển đổi 2 chế độ: (1) Chọn Khách hàng $\to$ Hồ sơ 360°, Lịch sử mua & Top 6 sản phẩm gợi ý kèm % Match Score & Lý do; (2) Chọn Sản phẩm $\to$ Top 6 sản phẩm mua kèm (Lift & Confidence) + Bảng Combo Vàng toàn cửa hàng
- [x] Tab 9 (`Ctrl+9`) — **Pipeline Control**: Điều khiển chạy từng stage hoặc toàn bộ pipeline + bộ 3 mô hình ML qua Python subprocess, xem log realtime, tự động reload SQLite

### Phase 3: Machine Learning — HOÀN THÀNH (3 MODELS DỮ LIỆU THẬT)
- [x] `ml-pipeline/predict_bestsellers.py` — Random Forest (300 cây) dự báo sản phẩm bán chạy 14 ngày tới (`ml_predictions`, `ml_backtest`, `ml_model_info`)
- [x] `ml-pipeline/cluster_customers.py` — K-Means Clustering (8 chiều hành vi) + Silhouette Score + PCA 2D (`ml_customer_clusters`, `ml_cluster_summary`, `ml_cluster_k_scores`, `ml_cluster_info`)
- [x] `ml-pipeline/recommend_products.py` — Hybrid Recommendation 2 chiều: Item-Item Collaborative Filtering + Content Cosine + Market Basket (`ml_customer_recommendations`, `ml_product_affinities`, `ml_recommend_info`)
- [x] `ml-pipeline/run_all_ml.py` — Script điều phối chạy tuần tự cả 3 mô hình ML cho Stage 5 của Pipeline Control

### Phase 4: Tài liệu & Sơ đồ — CHƯA LÀM (Bước tiếp theo nếu cần)
- [ ] Use Case Diagram
- [ ] Sequence Diagram
- [ ] ER Diagram (Database Schema)

---

## 5. CẤU TRÚC THƯ MỤC

```
Pr_Vy/
├── .agent                        # 4 quy tắc tự động sau mỗi task lớn
├── .gitignore
├── docker-compose.yml            # MinIO container (tùy chọn, có local fallback)
├── run-app.bat                   # Build + chạy Desktop App
├── run-dev.bat                   # Chạy chế độ dev (hot reload)
├── doc/
│   ├── project-plan.md
│   ├── CODE_RULES.md
│   └── SUMMARY.md
├── raw_data/                     # 7 file CSV dữ liệu gốc
│   ├── dataset_fashion_store_campaigns.csv
│   ├── dataset_fashion_store_channels.csv
│   ├── dataset_fashion_store_customers.csv
│   ├── dataset_fashion_store_products.csv
│   ├── dataset_fashion_store_sales.csv
│   ├── dataset_fashion_store_salesitems.csv
│   └── dataset_fashion_store_stock.csv
├── data-pipeline/
│   ├── lake.py                   # Lớp Data Lake (MinIO / Local fallback)
│   ├── run_all.py                # Chạy tuần tự 01 -> 04
│   ├── requirements.txt
│   ├── data/                     # (gitignored) analytics.db + local lake
│   └── jobs/
│       ├── 01_ingest_bronze.py
│       ├── 02_bronze_to_silver.py
│       ├── 03_silver_to_gold.py
│       └── 04_gold_to_sqlite.py
├── ml-pipeline/
│   ├── run_all_ml.py             # Chạy tuần tự cả 3 mô hình ML
│   ├── predict_bestsellers.py    # ML 1: Random Forest dự đoán bán chạy 14 ngày tới
│   ├── cluster_customers.py      # ML 2: K-Means + PCA 2D phân cụm khách hàng đa chiều
│   ├── recommend_products.py     # ML 3: Hybrid Recommendation gợi ý sản phẩm 2 chiều
│   └── requirements.txt
└── desktop-app/
    ├── package.json
    ├── electron.vite.config.js
    └── src/
        ├── main/
        │   ├── index.js          # Electron main process + IPC
        │   └── db.js             # Truy vấn SQLite cho 5 tab BI + 3 tab ML
        ├── preload/
        │   └── index.js          # ContextBridge API (window.electron)
        └── renderer/
            ├── App.jsx
            ├── lib/
            │   ├── tabRules.js   # Nội dung nút Quy tắc (?) cho 9 tab
            │   └── utils.js
            └── pages/
                ├── Overview/index.jsx
                ├── Products/index.jsx
                ├── Customers/index.jsx
                ├── Geography/index.jsx
                ├── Channels/index.jsx
                ├── MLForecast/index.jsx
                ├── MLClustering/index.jsx
                ├── MLRecommend/index.jsx
                └── PipelineControl/index.jsx
```

---

## 6. CÁCH CHẠY DỰ ÁN

```powershell
# 1. Chạy Data Pipeline (tạo data-pipeline/data/analytics.db từ raw_data/*.csv)
python data-pipeline/run_all.py

# 2. Chạy toàn bộ 3 mô hình Machine Learning (lưu kết quả vào SQLite)
python ml-pipeline/run_all_ml.py

# 3. Chạy Desktop App (từ thư mục gốc Pr_Vy)
.\run-app.bat
# Hoặc chạy chế độ phát triển (hot reload):
.\run-dev.bat
```

---

## 7. LƯU Ý KỸ THUẬT QUAN TRỌNG

1. **Biến môi trường `ELECTRON_RUN_AS_NODE`**: Nếu môi trường terminal có `ELECTRON_RUN_AS_NODE=1`, Electron sẽ chạy như Node thường làm `require('electron')` lỗi. Các file `run-app.bat` và `run-dev.bat` đã tự động xóa biến này (`set ELECTRON_RUN_AS_NODE=`).
2. **Native addon `better-sqlite3`**: Phải được build khớp ABI của Electron 28 (`npx electron-builder install-app-deps` trong thư mục `desktop-app`).
3. **Data Lake Fallback**: Không bắt buộc phải bật Docker MinIO — khi port 9000 không mở, `lake.py` tự động đọc/ghi Parquet vào `data-pipeline/data/lake/`.
