# SUMMARY — Hệ thống Analytics Platform Thời trang E-Commerce
# Dành cho: AI conversation mới / người đọc lần đầu
# Cập nhật lần cuối: 20/11/2026

---

## 1. DỰ ÁN LÀ GÌ

Hệ thống phân tích dữ liệu bán hàng thời trang e-commerce chạy trực tiếp trên máy tính (Desktop App):
- **Auto Pipeline**: CSV thô (`raw_data/`) → Data Lake (Bronze → Silver → Gold, hỗ trợ cả MinIO Docker và Local Lake fallback) → SQLite (`data-pipeline/data/analytics.db`)
- **Desktop App**: Electron 28 + React 18 + Vite + Tailwind + Recharts — 5 Dashboard phân tích + 1 tab ML Dự đoán + 1 tab Pipeline Control, tất cả đọc dữ liệu thật từ SQLite qua Electron IPC (`better-sqlite3`)
- **Machine Learning**: `RandomForestRegressor` (scikit-learn, 300 cây) dự đoán sản phẩm bán chạy trong kỳ 14 ngày tới, có Backtest so sánh Dự đoán vs Thực tế vs Baseline.

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
| Charts | Recharts | Biểu đồ tương tác |
| Data Lake | MinIO (Docker) / Local Parquet Lake | Lưu trữ phân tầng Bronze/Silver/Gold |
| ETL | Python 3 + pandas + pyarrow | Làm sạch và tổng hợp dữ liệu |
| Serving DB | SQLite + `better-sqlite3` | Truy vấn đồng bộ tốc độ cao cho Dashboard |
| ML | scikit-learn (`RandomForestRegressor`) | Dự đoán sản phẩm bán chạy + Backtest |

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
- [x] `03_silver_to_gold.py` — Tạo các bảng phân tích Gold: `gold_sales_items`, `gold_orders`, `gold_customers` (kèm phân khúc RFM: VIP, Trung Thành, Tiềm Năng, Mới, Chưa Mua), `gold_products` (kèm biên lợi nhuận & tồn kho), `dim_campaigns`, `dim_channels`, `dim_stock`
- [x] `04_gold_to_sqlite.py` — Nạp toàn bộ bảng Gold vào SQLite `data-pipeline/data/analytics.db` (ghi nguyên tử qua file tạm, giữ lại bảng ML khi chạy lại ETL)

### Phase 2: Desktop App UI + Kết nối SQLite — HOÀN THÀNH
- [x] `desktop-app/src/main/db.js` — Truy vấn SQLite bằng `better-sqlite3` (đã rebuild native addon cho Electron 28)
- [x] `desktop-app/src/main/index.js` — IPC handlers `get-dashboard-data`, `reload-database`, `run-pipeline`
- [x] Tab 1 — **Tổng Quan (Overview)**: KPI doanh thu (324,236.66 EUR), 905 đơn, 580 khách mua, AOV 358.27 EUR, xu hướng tháng T4–T6/2025, doanh thu theo kênh
- [x] Tab 2 — **Sản Phẩm (Products)**: Lọc theo danh mục (`Ctrl+F`), Top 10 sản phẩm theo doanh thu, Donut doanh thu 5 danh mục, bảng chi tiết số lượng và biên lợi nhuận
- [x] Tab 3 — **Khách Hàng (Customers)**: KPI khách hàng & tỷ lệ mua lại, Donut phân khúc RFM, CLV Histogram, phân bổ độ tuổi
- [x] Tab 4 — **Địa Lý (Geography)**: Biểu đồ & bảng tổng hợp 6 quốc gia châu Âu (Germany, France, Italy, Netherlands, Spain, Portugal), click xem chi tiết từng nước
- [x] Tab 5 — **Kênh Bán (Channels)**: So sánh `E-commerce` và `App Mobile` theo Doanh thu / Đơn hàng / AOV và xu hướng theo tháng
- [x] Tab 6 — **ML Dự Đoán (MLForecast)**: Hiển thị thông tin model thật, bảng Top 20 sản phẩm dự đoán bán chạy kèm xu hướng & độ tin cậy, biểu đồ Backtest (Dự đoán vs Thực tế vs Baseline), nút chạy lại ML
- [x] Tab 7 — **Pipeline Control**: Điều khiển chạy từng stage hoặc toàn bộ pipeline + ML thật qua Python subprocess, xem log realtime, tự động reload SQLite sau khi chạy xong

### Phase 3: Machine Learning — HOÀN THÀNH (1 MODEL)
- [x] `ml-pipeline/predict_bestsellers.py` — Chia dữ liệu thành các kỳ 14 ngày, tạo 14 features (lag1, lag2, hist_mean, hist_max, trend, tỷ lệ giảm giá, giá, biên lợi nhuận, tồn kho, sức mua danh mục, one-hot category), huấn luyện `RandomForestRegressor` (300 cây), đánh giá Backtest (MAE = 2.39 so với Baseline MAE = 3.18) và lưu `ml_predictions`, `ml_backtest`, `ml_model_info` vào SQLite

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
│   ├── predict_bestsellers.py    # Random Forest dự đoán bán chạy 14 ngày tới
│   └── requirements.txt
└── desktop-app/
    ├── package.json
    ├── electron.vite.config.js
    └── src/
        ├── main/
        │   ├── index.js          # Electron main process + IPC
        │   └── db.js             # Truy vấn SQLite cho 6 tab dữ liệu
        ├── preload/
        │   └── index.js          # ContextBridge API (window.electron)
        └── renderer/
            ├── App.jsx
            ├── lib/
            │   ├── tabRules.js   # Nội dung nút Quy tắc (?) cho 7 tab
            │   └── utils.js
            └── pages/
                ├── Overview/index.jsx
                ├── Products/index.jsx
                ├── Customers/index.jsx
                ├── Geography/index.jsx
                ├── Channels/index.jsx
                ├── MLForecast/index.jsx
                └── PipelineControl/index.jsx
```

---

## 6. CÁCH CHẠY DỰ ÁN

```powershell
# 1. Chạy Data Pipeline (tạo data-pipeline/data/analytics.db từ raw_data/*.csv)
python data-pipeline/run_all.py

# 2. Chạy Machine Learning (tạo bảng ml_predictions, ml_backtest, ml_model_info trong SQLite)
python ml-pipeline/predict_bestsellers.py

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
