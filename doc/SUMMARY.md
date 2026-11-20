# SUMMARY — Hệ thống Analytics Platform Thời trang E-Commerce
# Dành cho: AI conversation mới / người đọc lần đầu
# Cập nhật lần cuối: 20/11/2026

---

## 1. DỰ ÁN LÀ GÌ

Hệ thống phân tích dữ liệu bán hàng thời trang e-commerce với:
- **Auto Pipeline**: CSV thô → MinIO (Bronze→Silver→Gold) → SQLite
- **Desktop App**: Electron + React — 6 Dashboard interactive
- **ML**: Dự đoán sản phẩm bán chạy theo quý/mùa

**Không phải web app** — là phần mềm chạy trực tiếp trên máy tính.

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
| Desktop | Electron 32+ | Native app wrapper |
| Frontend | React 18 + Vite | UI renderer |
| Styling | Tailwind CSS | Không dùng Next.js |
| Charts | Recharts | Biểu đồ interactive |
| Data Lake | MinIO (Docker) | Lưu Bronze/Silver/Gold |
| ETL | Python + pandas | Pipeline xử lý data |
| Serving DB | SQLite | Query nhanh cho Dashboard |
| ML | scikit-learn | Dự đoán bán chạy |

---

## 4. TRẠNG THÁI HIỆN TẠI

### Phase 0: Setup — ĐANG LÀM
- [x] Git init + remote origin set
- [x] .gitignore
- [x] .agent (4 quy tắc tự động)
- [x] doc/CODE_RULES.md
- [x] doc/SUMMARY.md (file này)
- [ ] Electron + React skeleton
- [ ] Vite + Tailwind config

### Phase 1: Data Pipeline — CHƯA LÀM
- [ ] 01_ingest_bronze.py
- [ ] 02_bronze_to_silver.py
- [ ] 03_silver_to_gold.py
- [ ] 04_gold_to_sqlite.py
- [ ] Docker Compose cho MinIO
- [ ] Snapshot mechanism

### Phase 2: Desktop App UI — CHƯA LÀM
- [ ] Layout chính (Sidebar + Header)
- [ ] Tab Overview Dashboard
- [ ] Tab Product Performance
- [ ] Tab Customer Analysis
- [ ] Tab Geography
- [ ] Tab Channel Performance
- [ ] Tab ML Forecast
- [ ] Tab Pipeline Control

### Phase 3: Machine Learning — CHƯA LÀM
- [ ] predict_bestsellers.py
- [ ] Tích hợp vào pipeline

### Phase 4: Tài liệu — CHƯA LÀM
- [ ] Use Case Diagram
- [ ] Sequence Diagram
- [ ] ER Diagram

---

## 5. CẤU TRÚC THƯ MỤC (cập nhật)

```
Pr_Vy/
├── .agent                    # Quy tắc tự động (4 rules)
├── .gitignore
├── doc/
│   ├── project-plan.md       # Kế hoạch gốc
│   ├── CODE_RULES.md         # Quy tắc code
│   ├── SUMMARY.md            # File này
│   └── ...
├── desktop-app/              # Electron + React (CHƯA TẠO)
├── data-pipeline/            # ETL Python (CHƯA TẠO)
├── ml-pipeline/              # ML Models (CHƯA TẠO)
└── raw_data/                 # CSV gốc (đã có)
    ├── dataset_fashion_store_campaigns.csv
    ├── dataset_fashion_store_channels.csv
    ├── dataset_fashion_store_customers.csv
    ├── dataset_fashion_store_products.csv
    ├── dataset_fashion_store_sales.csv
    ├── dataset_fashion_store_salesitems.csv
    └── dataset_fashion_store_stock.csv
```

---

## 6. CÁCH CHẠY DỰ ÁN (sẽ cập nhật khi có code)

```bash
# Desktop App
cd desktop-app
npm install
npm run dev        # Development
npm run electron   # Chạy Electron

# Data Pipeline
cd data-pipeline
pip install -r requirements.txt
python jobs/01_ingest_bronze.py

# ML
cd ml-pipeline
pip install -r requirements.txt
python predict_bestsellers.py
```

---

## 7. QUYẾT ĐỊNH KIẾN TRÚC QUAN TRỌNG

| Quyết định | Lý do |
|---|---|
| Dùng Electron thay Next.js | Next.js bị lỗi CSS, chuyển sang desktop app |
| Tailwind thuần (không Next.js) | Tránh vấn đề CSS framework conflict |
| SQLite làm serving DB | Query nhanh, không cần server riêng |
| Nút "Quy tắc" (?) trên mỗi Tab | Người mới/AI mới đọc hiểu hệ thống ngay trên UI |
| Confirm dialog 2 lần | Tránh thao tác nhầm cho các hành động quan trọng |
| Resizable containers | UI linh hoạt, responsive |


## Cap nhat: Desktop App chay duoc (Electron + electron-vite)

- Da hoan thanh 7 tab: Overview, Products, Customers, Geography, Channels, MLForecast, PipelineControl (du lieu mock, chua noi SQLite).
- Cach chay: run-app.bat (build + chay) hoac run-dev.bat (hot reload). Main process dung CommonJS do electron-vite build, KHONG them "type": "module".
- LOI QUAN TRONG DA GAP: bien moi truong ELECTRON_RUN_AS_NODE=1 lam electron.exe chay nhu Node thuong, khien require('electron') tra ve chuoi duong dan va app.whenReady undefined. Cac file .bat da xoa bien nay. Neu chay tay trong terminal, phai xoa bien truoc (PowerShell: Remove-Item Env:ELECTRON_RUN_AS_NODE).
- Viec con lai: noi SQLite (better-sqlite3) qua IPC get-dashboard-data, thay mock data bang data that.
