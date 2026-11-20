// Store các nội dung "Quy tắc" cho từng Tab
// Mỗi khi tạo Tab mới hoặc thay đổi nguồn dữ liệu, cập nhật key tương ứng vào đây

export const TAB_RULES = {
  overview: {
    title: 'Tổng Quan Doanh Thu',
    purpose: 'Cung cấp cái nhìn toàn diện về hiệu suất kinh doanh từ dữ liệu thật: tổng doanh thu (EUR), số đơn hàng, số khách hàng đã mua và xu hướng theo tháng.',
    dataSource: 'SQLite (data-pipeline/data/analytics.db) — bảng gold_orders (905 đơn hàng từ 04/2025 đến 06/2025)',
    steps: [
      '1. Xem 4 KPI Cards ở hàng đầu: Doanh thu, Đơn hàng, Khách hàng, Giá trị TB đơn hàng (AOV)',
      '2. Chỉ số % trên KPI thể hiện biến động giữa 2 tháng gần nhất trong dataset',
      '3. Phân tích xu hướng doanh thu và số đơn theo tháng ở Line Chart',
      '4. So sánh doanh thu giữa E-commerce và App Mobile ở Bar Chart bên dưới',
      '5. Nhấn Làm mới (Ctrl+R) sau khi chạy lại Pipeline để cập nhật số liệu',
    ],
    shortcuts: ['Ctrl+R: Refresh data từ SQLite', 'Ctrl+E: Export CSV', 'Ctrl+D: Đổi Dark/Light mode', 'Ctrl+1: Chuyển tab này'],
    notes: [
      'Doanh thu hiển thị theo đơn vị EUR (tiền tệ gốc của dataset fashion store)',
      'Tổng doanh thu thực tế: 324,236.66 EUR trên 905 đơn hàng của 580 khách mua',
    ],
  },
  products: {
    title: 'Hiệu Suất Sản Phẩm',
    purpose: 'Phân tích doanh thu, sản lượng bán và biên lợi nhuận của 500 sản phẩm qua 5 danh mục (Dresses, T-Shirts, Sleepwear, Shoes, Pants).',
    dataSource: 'SQLite — bảng gold_products (tổng hợp từ gold_sales_items và dim_stock)',
    steps: [
      '1. Dùng bộ lọc Danh mục (Ctrl+F) để xem Top 10 sản phẩm của từng ngành hàng hoặc toàn bộ',
      '2. Xem Top 10 sản phẩm bán chạy theo doanh thu ở Horizontal Bar Chart',
      '3. Phân tích cơ cấu doanh thu theo 5 danh mục ở Donut Chart bên phải',
      '4. Xem chi tiết sản lượng bán và biên lợi nhuận (%) ở bảng phía dưới',
    ],
    shortcuts: ['Ctrl+R: Refresh', 'Ctrl+F: Focus bộ lọc danh mục', 'Ctrl+2: Chuyển tab này'],
    notes: [
      'Biên lợi nhuận = (Doanh thu - Giá vốn) / Doanh thu * 100%',
      'Màu xanh lá: biên lợi nhuận > 50%, Vàng: 30%–50%, Đỏ: < 30%',
    ],
  },
  customers: {
    title: 'Phân Tích Khách Hàng',
    purpose: 'Phân khúc 1,000 khách hàng theo mô hình RFM (VIP, Trung Thành, Tiềm Năng, Mới, Chưa Mua), phân phối CLV và độ tuổi.',
    dataSource: 'SQLite — bảng gold_customers (1,000 khách hàng đăng ký, 580 khách đã phát sinh đơn)',
    steps: [
      '1. Xem 4 KPI: Tổng khách hàng, số khách VIP, CLV trung bình của khách đã mua và Tỷ lệ mua lại (>= 2 đơn)',
      '2. Xem biểu đồ Donut phân khúc khách hàng và CLV trung bình từng nhóm',
      '3. Phân tích phân phối chi tiêu (CLV Histogram) theo các mức từ 0–100€ đến >1K€',
      '4. Xem phân bổ khách hàng theo 5 nhóm độ tuổi (16-25 đến 56-65)',
    ],
    shortcuts: ['Ctrl+R: Refresh', 'Ctrl+3: Chuyển tab này'],
    notes: [
      'VIP: Top 20% CLV và có từ 2 đơn trở lên',
      'Trung Thành: từ 2 đơn trở lên; Tiềm Năng: 1 đơn có CLV >= trung vị; Mới: 1 đơn có CLV < trung vị',
    ],
  },
  geography: {
    title: 'Phân Tích Địa Lý',
    purpose: 'Phân tích doanh thu, đơn hàng, số khách hàng và AOV theo 6 quốc gia châu Âu trong dataset.',
    dataSource: 'SQLite — bảng gold_orders (trường country: Germany, France, Italy, Netherlands, Spain, Portugal)',
    steps: [
      '1. Chọn chỉ số hiển thị: Doanh thu hoặc Số đơn hàng',
      '2. Nhấp vào cột quốc gia trên biểu đồ hoặc dòng trong bảng để xem thẻ chi tiết bên phải',
      '3. So sánh tỷ trọng % đóng góp doanh thu và AOV giữa các quốc gia',
    ],
    shortcuts: ['Ctrl+R: Refresh', 'Ctrl+4: Chuyển tab này'],
    notes: ['Germany (74.6K EUR) và France (72.3K EUR) là 2 thị trường lớn nhất trong dataset'],
  },
  channels: {
    title: 'Hiệu Suất Kênh Bán',
    purpose: 'So sánh hiệu suất giữa 2 kênh bán chính: E-commerce (Website) và App Mobile.',
    dataSource: 'SQLite — bảng gold_orders (trường channel, month, units)',
    steps: [
      '1. Xem thẻ KPI tổng quan doanh thu, tỷ trọng %, số đơn và AOV của từng kênh',
      '2. Chuyển đổi giữa Doanh thu, Đơn hàng và AOV trên Bar Chart so sánh',
      '3. Theo dõi xu hướng doanh thu theo tháng của từng kênh trên Line Chart',
      '4. Xem số lượng sản phẩm trung bình mỗi đơn (SP/đơn TB) ở bảng chi tiết',
    ],
    shortcuts: ['Ctrl+R: Refresh', 'Ctrl+5: Chuyển tab này'],
    notes: ['E-commerce chiếm ~53% doanh thu (171.7K EUR), App Mobile chiếm ~47% (152.6K EUR)'],
  },
  mlforecast: {
    title: 'ML Dự Đoán Bán Chạy',
    purpose: 'Dự đoán Top 20 sản phẩm bán chạy trong kỳ 14 ngày tới bằng thuật toán Random Forest Regressor (scikit-learn).',
    dataSource: 'SQLite — bảng ml_predictions, ml_backtest, ml_model_info (do ml-pipeline/predict_bestsellers.py tạo)',
    steps: [
      '1. Xem Thông tin Model: thuật toán, MAE so với baseline, phạm vi dữ liệu và độ quan trọng của các features',
      '2. Xem Bảng xếp hạng Top 20 sản phẩm dự đoán bán chạy trong 14 ngày tới kèm xu hướng và độ tin cậy',
      '3. Xem biểu đồ Backtest (Actual vs Predicted vs Baseline) trên kỳ 14 ngày gần nhất để kiểm chứng model',
      '4. Nhấn "Chạy ML mới" (có xác nhận 2 bước) để huấn luyện lại model khi có dữ liệu mới',
    ],
    shortcuts: ['Ctrl+R: Refresh kết quả dự đoán', 'Ctrl+6: Chuyển tab này'],
    notes: [
      'Vì dataset gốc dài ~2.5 tháng (04/2025 -> 06/2025), model chia lịch sử thành 6 kỳ x 14 ngày để học',
      'Features: sản lượng 2 kỳ gần nhất (lag1, lag2), trung bình/đỉnh lịch sử, xu hướng, tỷ lệ giảm giá, giá bán, biên lợi nhuận, tồn kho và sức mua danh mục',
      'Độ tin cậy được tính từ mức độ đồng thuận (độ lệch chuẩn) giữa 300 cây quyết định trong Random Forest',
    ],
  },
  pipeline: {
    title: 'Pipeline Control',
    purpose: 'Điều khiển chạy thực tế chuỗi ETL Python (Bronze → Silver → Gold → SQLite) và ML ngay trên ứng dụng.',
    dataSource: 'raw_data/*.csv → Data Lake (MinIO hoặc thư mục local data-pipeline/data/lake/) → SQLite (analytics.db)',
    steps: [
      '1. Nhấn "Chạy Toàn Bộ" (xác nhận 2 lần) để chạy lần lượt 5 bước: Bronze, Silver, Gold, SQLite, ML',
      '2. Hoặc nhấn vào từng thẻ Stage để chạy riêng từng bước',
      '3. Theo dõi tiến trình và log Python trả về theo thời gian thực ở khung Log bên dưới',
      '4. Sau khi chạy xong, ứng dụng tự động reload kết nối SQLite để các tab Dashboard có dữ liệu mới',
    ],
    shortcuts: ['Ctrl+R: Reset trạng thái hiển thị', 'Ctrl+L: Xóa log', 'Ctrl+7: Chuyển tab này'],
    notes: [
      'Tự động fallback: Nếu Docker MinIO đang chạy ở localhost:9000 thì lưu vào MinIO; nếu không thì tự động lưu vào data-pipeline/data/lake/',
      'Mọi thao tác chạy Pipeline đều yêu cầu xác nhận 2 bước để tránh ghi đè dữ liệu ngoài ý muốn',
    ],
  },
}
