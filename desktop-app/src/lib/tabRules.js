// Store các nội dung "Quy tắc" cho từng Tab
// Mỗi khi tạo Tab mới, thêm key tương ứng vào đây

export const TAB_RULES = {
  overview: {
    title: 'Tổng Quan Doanh Thu',
    purpose: 'Cung cấp cái nhìn toàn diện về hiệu suất kinh doanh: doanh thu, đơn hàng, khách hàng và xu hướng theo thời gian.',
    dataSource: 'SQLite — bảng gold_sales, gold_orders, gold_customers (cập nhật mỗi lần chạy pipeline)',
    steps: [
      '1. Chọn khoảng thời gian bằng Date Range Filter (góc trên phải)',
      '2. Tùy chọn: chọn Snapshot để so sánh với dữ liệu tại thời điểm khác',
      '3. Xem KPI Cards ở hàng đầu: Revenue, Orders, Customers, AOV',
      '4. Phân tích xu hướng qua Line Chart (Revenue theo ngày/tuần/tháng)',
      '5. So sánh kênh bán qua Bar Chart bên dưới',
      '6. Export CSV nếu cần lấy data ra phân tích ngoài (Ctrl+E)',
    ],
    shortcuts: ['Ctrl+R: Refresh data', 'Ctrl+E: Export CSV', 'Ctrl+D: Đổi Dark/Light mode', 'Ctrl+1: Chuyển tab này'],
    notes: [
      'Revenue hiển thị theo đơn vị EUR (tiền tệ gốc của dataset)',
      'So sánh 2 kỳ: chọn snapshot cũ ở dropdown Snapshot Selector',
      'Các card màu xanh = tăng so với kỳ trước, màu đỏ = giảm',
    ],
  },
  products: {
    title: 'Hiệu Suất Sản Phẩm',
    purpose: 'Phân tích doanh thu và hiệu suất từng sản phẩm, danh mục, thương hiệu. Xác định top sellers và sản phẩm cần cải thiện.',
    dataSource: 'SQLite — gold_products, gold_order_items, gold_orders',
    steps: [
      '1. Chọn khoảng thời gian và category (nếu cần lọc theo ngành hàng)',
      '2. Xem Top 10 sản phẩm bán chạy ở Horizontal Bar Chart',
      '3. Phân tích doanh thu theo Category ở Pie/Donut chart',
      '4. Kiểm tra tỷ lệ hoàn hàng (Refund Rate) ở cột bên phải',
      '5. Nhấp vào sản phẩm để xem chi tiết: lịch sử bán, biến động giá',
    ],
    shortcuts: ['Ctrl+R: Refresh', 'Ctrl+E: Export', 'Ctrl+F: Focus filter category'],
    notes: [
      'Refund Rate cao (>10%) cần chú ý — sản phẩm có thể có vấn đề chất lượng',
      'Color coding: Xanh lá = hiệu suất tốt, Vàng = trung bình, Đỏ = cần cải thiện',
    ],
  },
  customers: {
    title: 'Phân Tích Khách Hàng',
    purpose: 'Phân khúc khách hàng theo giá trị (CLV), tần suất mua và hành vi. Hỗ trợ chiến lược giữ chân và phát triển khách hàng.',
    dataSource: 'SQLite — gold_customers, gold_orders, gold_order_items',
    steps: [
      '1. Xem phân bổ khách hàng theo phân khúc: VIP / Trung Thành / Tiềm Năng / Mới',
      '2. Phân tích CLV (Customer Lifetime Value) histogram',
      '3. Xem funnel: Khách xem → Thêm giỏ → Thanh toán → Hoàn thành',
      '4. Lọc theo quốc gia hoặc độ tuổi để phân tích nhóm cụ thể',
    ],
    shortcuts: ['Ctrl+R: Refresh', 'Ctrl+E: Export danh sách khách hàng'],
    notes: ['CLV tính dựa trên tổng doanh thu từ khách đó trong toàn bộ lịch sử'],
  },
  geography: {
    title: 'Phân Tích Địa Lý',
    purpose: 'Xem doanh thu và số đơn hàng theo quốc gia và khu vực châu Âu.',
    dataSource: 'SQLite — gold_orders JOIN gold_customers (trường country)',
    steps: [
      '1. Xem Bar Chart doanh thu theo quốc gia (sắp xếp giảm dần)',
      '2. Toggle giữa "Doanh thu" và "Số đơn hàng" bằng switch phía trên',
      '3. Nhấp vào một quốc gia để drill-down xem sản phẩm bán chạy ở đó',
    ],
    shortcuts: ['Ctrl+R: Refresh', 'Ctrl+E: Export theo quốc gia'],
    notes: ['Dataset gốc gồm khách hàng từ các nước châu Âu: Pháp, Đức, Tây Ban Nha, Ý, v.v.'],
  },
  channels: {
    title: 'Hiệu Suất Kênh Bán',
    purpose: 'So sánh hiệu suất giữa các kênh bán hàng: Website, Mobile App, Social Media, v.v.',
    dataSource: 'SQLite — gold_orders (trường sales_channel)',
    steps: [
      '1. Xem Comparison Chart so sánh Revenue và Orders theo kênh',
      '2. Xem tỷ lệ chuyển đổi (Conversion Rate) của từng kênh',
      '3. Phân tích xu hướng kênh theo thời gian ở Line Chart',
    ],
    shortcuts: ['Ctrl+R: Refresh', 'Ctrl+E: Export theo kênh'],
    notes: ['Kênh có Conversion Rate thấp nhưng Traffic cao = cần tối ưu UX'],
  },
  mlforecast: {
    title: 'ML Dự Đoán Bán Chạy',
    purpose: 'Hiển thị kết quả ML model dự đoán sản phẩm bán chạy quý/mùa tới dựa trên pattern lịch sử.',
    dataSource: 'SQLite — ml_predictions (do ml-pipeline/predict_bestsellers.py tạo ra)',
    steps: [
      '1. Chọn Quý/Mùa muốn dự đoán ở dropdown phía trên',
      '2. Xem Bảng xếp hạng Top 10 sản phẩm dự đoán bán chạy',
      '3. Xem Biểu đồ so sánh Actual vs Predicted cho kỳ đã qua',
      '4. Kiểm tra Confidence Level: > 70% là đáng tin cậy',
      '5. Nhấn "Chạy ML mới" để cập nhật predictions (cần chạy pipeline trước)',
    ],
    shortcuts: ['Ctrl+R: Refresh predictions', 'Ctrl+E: Export danh sách dự đoán'],
    notes: [
      'Model cần ít nhất 1 năm data lịch sử để dự đoán chính xác',
      'Predictions được tính lại mỗi khi chạy ML Pipeline trong tab Pipeline Control',
      'Confidence < 50% = không đủ data, cần bổ sung lịch sử',
    ],
  },
  pipeline: {
    title: 'Pipeline Control',
    purpose: 'Điều khiển và theo dõi quá trình chạy ETL Data Pipeline từ CSV thô đến SQLite sẵn sàng cho Dashboard.',
    dataSource: 'raw_data/ CSV → MinIO → SQLite (data-pipeline/jobs/)',
    steps: [
      '1. Kiểm tra trạng thái từng stage (Bronze/Silver/Gold/SQLite) ở Status Panel',
      '2. Nhấn "Chạy Toàn Bộ" để chạy tất cả stage từ đầu đến cuối',
      '3. Hoặc nhấn từng stage riêng lẻ nếu cần chạy lại một phần',
      '4. Theo dõi log realtime trong Log Panel bên dưới',
      '5. Sau khi pipeline xong, nhấn "Làm mới Dashboard" để load data mới',
    ],
    shortcuts: ['Ctrl+R: Refresh status', 'Ctrl+L: Clear log'],
    notes: [
      'CẢNH BÁO: Chạy lại pipeline sẽ ghi đè data hiện tại trong SQLite',
      'Luôn tạo Snapshot trước khi chạy lại pipeline nếu muốn giữ data cũ',
      'MinIO (Docker) phải đang chạy trước khi chạy pipeline',
      'Stage Bronze → Silver → Gold → SQLite phải chạy theo thứ tự',
    ],
  },
}
