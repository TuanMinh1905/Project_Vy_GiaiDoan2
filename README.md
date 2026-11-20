# Analytics Platform — Hệ thống Analytics Thời trang E-Commerce

## Giới thiệu
Desktop App phân tích dữ liệu bán hàng thời trang với Auto Pipeline ETL và ML Dự đoán.

## Yêu cầu hệ thống
- Node.js 18+
- Python 3.10+
- Docker Desktop (để chạy MinIO)

## Cài đặt nhanh

### 1. Clone và cài dependencies
```bash
git clone https://github.com/TuanMinh1905/Project_Vy_GiaiDoan2.git
cd Project_Vy_GiaiDoan2

# Cài Desktop App
cd desktop-app
npm install

# Cài Python dependencies
cd ../data-pipeline
pip install -r requirements.txt

cd ../ml-pipeline
pip install -r requirements.txt
```

### 2. Khởi động MinIO (cần Docker Desktop)
```bash
# Từ thư mục gốc
docker compose up -d
# Truy cập MinIO Console: http://localhost:9001
# User: minioadmin / Pass: minioadmin
```

### 3. Chạy Desktop App
```bash
cd desktop-app
npm run electron:dev   # Development mode (Vite + Electron cùng lúc)
```

### 4. Chạy Pipeline (trong app hoặc thủ công)
```bash
cd data-pipeline
python run_all.py
```

## Cấu trúc thư mục

```
Pr_Vy/
├── .agent              # Quy tắc tự động (4 rules)
├── .gitignore
├── docker-compose.yml  # MinIO service
├── doc/
│   ├── project-plan.md
│   ├── CODE_RULES.md
│   └── SUMMARY.md
├── desktop-app/        # Electron + React App
├── data-pipeline/      # ETL Pipeline Python
├── ml-pipeline/        # ML Models
└── raw_data/           # CSV gốc
```

## Phím tắt chính

| Phím | Hành động |
|---|---|
| `Ctrl+1..7` | Chuyển tab |
| `Ctrl+D` | Dark/Light mode |
| `Ctrl+R` | Refresh data |
| `Ctrl+E` | Export CSV |
| `Ctrl+F` | Focus filter |
| `Escape` | Đóng modal |

## Quy tắc commit
Format: `[Phạm vi] Mô tả tiếng Việt` (không emoji, không icon)
