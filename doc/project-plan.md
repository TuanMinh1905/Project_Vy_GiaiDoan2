# 📋 DỰ ÁN: HỆ THỐNG ANALYTICS PLATFORM - THỜI TRANG E-COMMERCE

> **Ngày lập:** 20/11/2026  
> **Trạng thái:** Đã chốt scope — Chuẩn bị triển khai

---

## 1. MỤC TIÊU TỔNG QUAN

Xây dựng một hệ thống phân tích dữ liệu e-commerce thời trang với khả năng:

1. **Auto Pipeline**: Đưa data thô vào → Hệ thống tự xử lý qua các tầng Bronze → Silver → Gold
2. **Auto Dashboard**: Tự động hiển thị các Dashboard interactive từ data đã xử lý
3. **Machine Learning**: Dự đoán sản phẩm bán chạy theo quý/mùa, hiển thị cho người dùng

---

## 2. BỐI CẢNH

### 2.1 Dự án gốc
- Project hiện tại (`lakehouse-bi-solution`) đã có pipeline ETL hoạt động cho data **MightyJaxx** (đồ chơi sưu tầm / Art Toys)
- Kiến trúc Medallion 3 lớp: Bronze → Silver → Gold
- Sử dụng: MinIO (Data Lake) + PySpark (ETL) + SQLite (Serving DB) + Plotly (Dashboard HTML tĩnh)
- Pipeline chạy thủ công (chạy từng file Python lần lượt), Dashboard là file HTML tĩnh

### 2.2 Vấn đề cần giải quyết
- Pipeline phải chạy tay từng bước
- Dashboard là HTML tĩnh, không có filter, không tương tác
- Không có ML dự đoán
- Data là đồ chơi sưu tầm, chưa phải thời trang
- Không có cơ chế lưu trữ lịch sử để so sánh

### 2.3 Tầm nhìn dài hạn
Dự án này là **Project 2** trong kế hoạch gồm 2 Project liên kết:
- **Project 1 (sau này):** Web/App shop thời trang thật — sẽ tạo ra data thực tế
- **Project 2 (hiện tại):** Hệ thống Analytics — phân tích data từ Project 1

Khi Project 1 có data thật → Project 2 chỉ cần đổi nguồn data đầu vào (từ Kaggle sang database thật), pipeline phía sau giữ nguyên.

---

## 3. SCOPE ĐÃ CHỐT

### 3.1 Phạm vi thực hiện (Mục tiêu hiện tại)

| # | Hạng mục | Mô tả |
|---|---|---|
| 1 | **Data Source** | Dataset thời trang từ Kaggle ("Multitable E-commerce European Fashion") |
| 2 | **Data Pipeline** | Auto xử lý: CSV → MinIO Bronze → Silver → Gold → SQLite |
| 3 | **Dashboard UI** | Next.js Web App với 5-6 template Dashboard interactive |
| 4 | **Machine Learning** | Dự đoán sản phẩm bán chạy theo quý/mùa |
| 5 | **Tài liệu** | Sơ đồ Use Case, Sequence Diagram, ER Diagram |

### 3.2 Phạm vi KHÔNG làm trong giai đoạn này

| Hạng mục | Lý do |
|---|---|
| AI Chat Box (gõ chữ → ra chart) | Cần LLM API, để giai đoạn sau |
| Deploy lên cloud | Bắt đầu localhost, deploy sau |
| Kết nối Project 1 (shop thời trang) | Project 1 chưa xây, kết nối sau |
| Nhiều ML model cùng lúc | Làm 1 cái trước, ổn định rồi mở rộng |

---

## 4. NGUỒN DATA

### 4.1 Dataset: Multitable E-commerce European Fashion (Kaggle)

Mô phỏng shop thời trang châu Âu, bao gồm các bảng:

| Bảng | Nội dung | Trường chính |
|---|---|---|
| **Customers** | Thông tin khách hàng | customer_id, name, email, gender, age, country, registration_date |
| **Products** | Sản phẩm thời trang | product_id, name, category, brand, color, size, price, cost |
| **Orders** | Đơn hàng | order_id, customer_id, order_date, status, sales_channel |
| **Order Items** | Chi tiết đơn hàng | order_item_id, order_id, product_id, quantity, unit_price, discount |
| **Payments** | Thanh toán | payment_id, order_id, payment_method, status, amount |

### 4.2 Chiến lược Data dài hạn

```
Giai đoạn hiện tại:
  File CSV (Kaggle) ──→ MinIO Bronze → Pipeline → Dashboard

Giai đoạn sau (khi có shop thật):
  Database shop ──→ MinIO Bronze → Pipeline → Dashboard
  (chỉ đổi bước đầu, pipeline sau đó giữ nguyên)
```

**Không cần xây API trung gian** — khi data nằm trong database của mình, kết nối thẳng vào đọc.

### 4.3 Lưu trữ lịch sử (Snapshot)

Mỗi lần chạy pipeline, hệ thống lưu một "snapshot" data tại thời điểm đó:

```
MinIO Storage:
├── snapshots/
│   ├── 2026-11-01/     ← Data tại ngày 1/11
│   ├── 2026-11-15/     ← Data tại ngày 15/11
│   └── 2026-12-01/     ← Data tại ngày 1/12
└── latest/             ← Data mới nhất
```

Dashboard hỗ trợ:
- Chọn xem snapshot theo thời điểm
- So sánh giữa các thời điểm khác nhau

---

## 5. KIẾN TRÚC HỆ THỐNG

### 5.1 Sơ đồ tổng thể

```
┌──────────────────────────────────────────────────────────┐
│                    NGUỒN DATA                             │
│   Kaggle CSV (hiện tại) / Database shop (tương lai)      │
└─────────────────────────┬────────────────────────────────┘
                          │
                   ① Đọc data thô
                          │
┌─────────────────────────▼────────────────────────────────┐
│                   MINIO (Data Lake)                       │
│                                                           │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│   │  Bronze  │───→│  Silver  │───→│   Gold   │           │
│   │  (Raw)   │    │ (Clean)  │    │ (Ready)  │           │
│   └──────────┘    └──────────┘    └────┬─────┘           │
│                                        │                  │
│   📸 Snapshots (lưu lịch sử)          │                  │
└────────────────────────────────────────┼──────────────────┘
                                         │
                   ② Load vào SQLite      │
                                         │
┌────────────────────────────────────────▼──────────────────┐
│                   SQLITE (Serving DB)                      │
│   Gold tables + ML predictions                             │
└────────────────────────────────────────┬──────────────────┘
                                         │
              ┌──────────────────────────┼───────────────┐
              │                          │               │
              ▼                          ▼               ▼
┌──────────────────┐  ┌──────────────────────┐  ┌──────────────┐
│  NEXT.JS WEB APP │  │   ML PIPELINE        │  │   TƯƠNG LAI  │
│                  │  │   (Python)            │  │              │
│  📊 Dashboard 1  │  │   Dự đoán SP bán     │  │  💬 AI Chat  │
│  📊 Dashboard 2  │  │   chạy theo quý/mùa  │  │  🤖 More ML  │
│  📊 Dashboard 3  │  │                      │  │  ☁️ Cloud    │
│  📊 Dashboard 4  │  │   Kết quả → SQLite   │  │              │
│  📊 Dashboard 5  │  │   → Hiển thị trên    │  │              │
│  🤖 ML Forecast  │  │     Dashboard        │  │              │
│                  │  │                      │  │              │
│  ⚙️ Pipeline     │  └──────────────────────┘  └──────────────┘
│     Control      │
└──────────────────┘
```

### 5.2 Tech Stack

| Layer | Công nghệ | Vai trò |
|---|---|---|
| **Data Lake** | MinIO (Docker) | Object storage cho Bronze/Silver/Gold |
| **ETL Pipeline** | Python (pandas / PySpark) | Xử lý data qua các tầng |
| **Serving DB** | SQLite | Lưu Gold tables + ML predictions để query nhanh |
| **Frontend** | Next.js 14 + TypeScript | Web App Dashboard |
| **UI Framework** | shadcn/ui + Tailwind CSS | Giao diện đẹp, hiện đại |
| **Charts** | Recharts | Biểu đồ interactive |
| **API Layer** | Next.js API Routes | Đọc SQLite, trigger pipeline |
| **ML** | Python (scikit-learn / Prophet) | Dự đoán sản phẩm bán chạy |
| **Container** | Docker Compose | Chạy MinIO |

---

## 6. DASHBOARD TEMPLATES

Hệ thống cung cấp 5-6 template Dashboard có sẵn. Người dùng chọn template → data tự điền → Dashboard hiện ra.

| # | Template | KPI chính | Biểu đồ |
|---|---|---|---|
| 1 | **📈 Tổng Quan Doanh Thu** | Revenue, AOV, Conversion Rate, tỷ lệ hủy/hoàn | Line chart xu hướng, Bar chart theo kênh |
| 2 | **🎁 Hiệu Suất Sản Phẩm** | Top sản phẩm, doanh thu theo category | Horizontal bar top 10, Refund distribution |
| 3 | **👥 Phân Tích Khách Hàng** | Phân khúc KH, CLV, tần suất mua | Donut chart segments, Funnel checkout→order |
| 4 | **🌍 Phân Tích Địa Lý** | Doanh thu theo quốc gia/khu vực | Bar chart theo region |
| 5 | **📱 Hiệu Suất Kênh Bán** | Web vs Mobile App performance | Comparison chart |
| 6 | **🤖 ML: Dự Đoán Bán Chạy** | Top SP dự đoán bán chạy quý tới | Forecast chart + ranking table |

Tính năng chung:
- Date range filter (chọn khoảng thời gian)
- Chọn snapshot lịch sử để so sánh
- Dark / Light mode
- Export data ra CSV

---

## 7. MACHINE LEARNING

### 7.1 Model đầu tiên: Dự đoán sản phẩm bán chạy theo quý/mùa

**Input:** Lịch sử bán hàng (Orders + Products + thời gian)

**Output:** Danh sách sản phẩm dự kiến bán chạy trong quý/mùa tiếp theo

**Cách hoạt động:**
```
Lịch sử: "Áo khoác bán 500 cái Q4/2025, 600 cái Q4/2026..."
    ↓
ML học pattern theo mùa
    ↓
Dự đoán: "Q1/2027 — Top 5: Áo khoác, Giày boot, Khăn len..."
```

**Hiển thị:** Trang ML Forecast trên Dashboard, bao gồm:
- Bảng xếp hạng sản phẩm dự đoán bán chạy
- Biểu đồ so sánh Actual vs Predicted
- Confidence level (độ tin cậy)

### 7.2 Các ML có thể mở rộng sau này

| # | ML Model | Mô tả |
|---|---|---|
| 1 | Dự đoán doanh thu | Tổng doanh thu tháng/quý tới |
| 2 | Dự đoán tồn kho | Khi nào hết hàng, cần nhập thêm bao nhiêu |
| 3 | Dự đoán khách rời bỏ | Khách nào sắp không quay lại |
| 4 | Dự đoán giá trị khách hàng | Khách này sẽ chi tổng bao nhiêu |
| 5 | Dự đoán tỉ lệ hoàn hàng | Sản phẩm nào hay bị trả |
| 6 | Dự đoán xu hướng mùa | Mùa nào bán category gì |
| 7 | Phân nhóm khách hàng (RFM) | Auto chia VIP / Trung thành / Sắp rời |
| 8 | Phân tích giỏ hàng | Mua A hay kèm B |
| 9 | Phát hiện bất thường | Doanh thu giảm đột biến, đơn hàng lạ |
| 10 | Tối ưu giá | Giá bao nhiêu thì lời nhất |

---

## 8. ROADMAP TRIỂN KHAI

### Giai đoạn 1: Nền tảng Data
- Tải dataset Fashion từ Kaggle
- Đẩy vào MinIO Bronze
- Viết pipeline mới: Bronze → Silver → Gold (cho data thời trang)
- Load Gold → SQLite
- Cơ chế Snapshot lưu lịch sử

### Giai đoạn 2: Dashboard UI
- Khởi tạo Next.js project + Tailwind + shadcn/ui
- Layout: Sidebar menu + Header
- Kết nối API Routes → SQLite
- Trang Pipeline Control (nút chạy pipeline + progress)
- Xây 5-6 template Dashboard interactive
- Date filter, snapshot selector, dark/light mode

### Giai đoạn 3: Machine Learning
- Viết Python script dự đoán SP bán chạy theo quý/mùa
- Lưu predictions vào SQLite
- Tích hợp vào pipeline auto
- Trang ML Forecast trên Dashboard

### Giai đoạn 4: Hoàn thiện
- Vẽ sơ đồ Use Case
- Vẽ Sequence Diagram
- Vẽ ER Diagram (Database schema)
- Viết tài liệu báo cáo
- Polish UI, responsive, error handling

---

## 9. CẤU TRÚC THƯ MỤC DỰ KIẾN

```
Project_ChiVy/
│
├── doc/                              # 📄 Tài liệu dự án
│   ├── project-plan.md               # File này
│   ├── use-case-diagram.md
│   ├── sequence-diagram.md
│   └── er-diagram.md
│
├── lakehouse-bi-solution/            # 🗂️ Project gốc (tham khảo)
│   ├── docker-compose.yml            # MinIO Docker
│   ├── ecom_analytics/               # Pipeline MightyJaxx cũ
│   └── ...
│
├── analytics-dashboard/              # 🆕 Next.js Web App
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Overview Dashboard
│   │   │   ├── products/page.tsx     # Product Performance
│   │   │   ├── customers/page.tsx    # Customer & Funnel
│   │   │   ├── geography/page.tsx    # Geographic Analysis
│   │   │   ├── channels/page.tsx     # Channel Performance
│   │   │   ├── forecast/page.tsx     # ML Predictions
│   │   │   ├── pipeline/page.tsx     # Pipeline Control
│   │   │   └── api/                  # API Routes
│   │   ├── components/
│   │   └── lib/
│   └── package.json
│
├── data-pipeline/                    # 🆕 ETL Pipeline (fashion)
│   ├── jobs/
│   │   ├── 01_ingest_bronze.py
│   │   ├── 02_bronze_to_silver.py
│   │   ├── 03_silver_to_gold.py
│   │   └── 04_gold_to_sqlite.py
│   ├── config/
│   └── requirements.txt
│
└── ml-pipeline/                      # 🆕 ML Models
    ├── predict_bestsellers.py
    ├── requirements.txt
    └── models/
```

---

## 10. NGUYÊN TẮC PHÁT TRIỂN

1. **Pipeline trước, UI sau** — Data chảy đúng trước khi lo đẹp
2. **Từng bước chất lượng** — Hoàn thiện giai đoạn trước mới sang giai đoạn sau
3. **Thiết kế linh hoạt** — Sau này đổi data source (Kaggle → DB thật) chỉ cần sửa 1 file
4. **Git commit thường xuyên** — Mỗi feature xong là commit
5. **Kiểm chứng bằng đối chiếu** — So sánh output Dashboard với data gốc để verify

---

> **Ghi chú:** Pipeline MightyJaxx cũ (`lakehouse-bi-solution`) giữ lại làm tham khảo. Pipeline mới (`data-pipeline`) sẽ được viết riêng cho data thời trang vì cấu trúc data khác nhau, nhưng logic tổng (Bronze → Silver → Gold) giữ nguyên.

