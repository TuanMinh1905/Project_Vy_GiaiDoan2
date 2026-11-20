# CODE RULES — Quy tắc lập trình dự án Analytics Platform
# Version: 1.0 | Cập nhật: 20/11/2026
# QUAN TRỌNG: Mọi task sau đều PHẢI tuân thủ các quy tắc này

---

## 1. NAMING CONVENTIONS

### Files & Folders
- **React Components**: PascalCase — `OverviewDashboard.jsx`, `SidebarNav.jsx`
- **Utility/hooks**: camelCase — `useChartData.js`, `formatCurrency.js`
- **Pages/Tabs**: PascalCase trong folder — `pages/Overview/index.jsx`
- **Python scripts**: snake_case với prefix số — `01_ingest_bronze.py`
- **Config files**: lowercase với dash — `vite.config.js`, `tailwind.config.js`

### Variables & Functions
- **JavaScript/React**: camelCase — `chartData`, `handleFilterChange`
- **Constants**: UPPER_SNAKE_CASE — `MAX_RETRIES`, `DB_PATH`
- **Python**: snake_case — `run_pipeline()`, `load_gold_data()`
- **Electron IPC channels**: kebab-case — `'run-pipeline'`, `'get-dashboard-data'`

### CSS Classes (Tailwind)
- Dùng Tailwind utility classes trực tiếp
- Không tạo custom CSS trừ khi thực sự cần
- Nếu cần custom: đặt trong `src/styles/custom.css`, prefix `.cvy-` (ChiVy)

---

## 2. CẤU TRÚC REACT COMPONENT

```jsx
// Template chuẩn cho mỗi component
import React, { useState, useEffect } from 'react'
import { RuleButton } from '@/components/ui/RuleButton'

// JSDoc cho component quan trọng
/**
 * @description Tab hiển thị tổng quan doanh thu
 * @param {Object} props
 */
const OverviewDashboard = ({ dateRange, snapshot }) => {
  // 1. State declarations
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // 2. Effects
  useEffect(() => {
    // fetch data
  }, [dateRange, snapshot])

  // 3. Handlers (prefix: handle)
  const handleExport = () => {}
  const handleFilterChange = () => {}

  // 4. Render helpers (prefix: render)
  const renderKPICards = () => {}

  // 5. Return JSX
  return (
    <div className="flex flex-col h-full">
      {/* Header của tab với nút Quy Tắc */}
      <TabHeader title="Tổng Quan Doanh Thu" ruleKey="overview" />
      {/* Content */}
    </div>
  )
}

export default OverviewDashboard
```

---

## 3. QUY TẮC NÚT "QUY TẮC" (?) TRÊN MỖI TAB

Mỗi Tab/Container LỚN PHẢI có component `<RuleButton>`:

```jsx
// Luôn đặt ở góc phải của Tab Header
<div className="flex items-center justify-between px-4 py-2 border-b">
  <h2 className="font-semibold text-lg">{title}</h2>
  <RuleButton ruleKey="overview" />  {/* Bắt buộc */}
</div>
```

RuleButton hiển thị:
- Icon `?` nhỏ, màu xám
- Hover: tooltip tóm tắt
- Click: Modal đầy đủ về tab đó

---

## 4. CONFIRM DIALOG — THAO TÁC QUAN TRỌNG

Mọi hành động có thể gây mất data hoặc không thể hoàn tác PHẢI có 2 lần confirm:

```jsx
// Lần 1: Dialog xác nhận
const handleDelete = async () => {
  const confirmed1 = await showConfirm({
    title: 'Xác nhận xóa',
    message: 'Bạn có muốn xóa snapshot này không?',
    confirmText: 'Tiếp tục',
    cancelText: 'Hủy'
  })
  if (!confirmed1) return

  // Lần 2: Dialog xác nhận lần cuối
  const confirmed2 = await showConfirm({
    title: 'Xác nhận lần cuối',
    message: 'Hành động này KHÔNG THỂ hoàn tác. Bạn chắc chắn?',
    confirmText: 'Xác nhận xóa',
    cancelText: 'Hủy',
    variant: 'danger'
  })
  if (!confirmed2) return

  // Thực hiện hành động
}
```

Danh sách hành động cần 2x confirm:
- Xóa snapshot
- Xóa data trong DB
- Reset pipeline
- Chạy lại toàn bộ pipeline (sẽ ghi đè data cũ)
- Thay đổi config quan trọng

---

## 5. KEYBOARD SHORTCUTS

Mỗi Tab phải hỗ trợ các phím tắt phổ biến:

| Phím | Hành động |
|---|---|
| `Ctrl+R` | Refresh/Reload data |
| `Ctrl+E` | Export CSV |
| `Ctrl+F` | Focus vào filter/search |
| `Ctrl+D` | Toggle Dark/Light mode |
| `Ctrl+1..6` | Chuyển tab theo số |
| `Escape` | Đóng modal/dialog |
| `Ctrl+Z` | Undo (nếu có) |

Implement bằng:
```js
useEffect(() => {
  const handler = (e) => {
    if (e.ctrlKey && e.key === 'r') { e.preventDefault(); handleRefresh() }
    if (e.ctrlKey && e.key === 'e') { e.preventDefault(); handleExport() }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [])
```

---

## 6. RESIZABLE CONTAINERS

Giữa các container lớn PHẢI có divider kéo được:

```jsx
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/Resizable'

<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={30} minSize={20}>
    <Sidebar />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={70}>
    <MainContent />
  </ResizablePanel>
</ResizablePanelGroup>
```

---

## 7. ELECTRON IPC PATTERN

```js
// Main process (electron/main.js)
ipcMain.handle('get-dashboard-data', async (event, { tab, dateRange }) => {
  try {
    const data = await queryDB(tab, dateRange)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Renderer (React component)
const data = await window.electron.invoke('get-dashboard-data', { tab, dateRange })
if (!data.success) showError(data.error)
```

---

## 8. PYTHON PIPELINE PATTERN

```python
# Mỗi pipeline script phải có:
import logging
import sys
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    logger.info("Bat dau [Ten Stage]")
    try:
        # Logic chính
        pass
    except Exception as e:
        logger.error(f"Loi: {e}")
        sys.exit(1)
    logger.info("Hoan thanh [Ten Stage]")

if __name__ == "__main__":
    main()
```

---

## 9. QUY TẮC GIT

- **Khi nào commit**: Sau mỗi feature nhỏ hoạt động, không để code broken lên repo
- **Format**: `[Phạm vi] Mô tả tiếng Việt` — không emoji, không icon
- **Phạm vi**: `[Setup]`, `[Pipeline]`, `[UI]`, `[ML]`, `[Fix]`, `[Docs]`
- **Không push**: node_modules, .env, *.db, *.pyc
- **Branch**: chỉ dùng `main` cho dự án này

---

## 10. LƯU Ý QUAN TRỌNG (KHÔNG ĐƯỢC VI PHẠM)

1. **Không dùng Next.js** — đã chuyển sang Electron + React + Vite
2. **Không tạo file CSS riêng** cho từng component trừ khi cực kỳ cần
3. **Không bỏ qua nút Quy tắc (?)** — mỗi Tab lớn phải có
4. **Không bỏ qua 2x confirm** — mọi hành động quan trọng
5. **Không push code chưa chạy được** lên main
6. **Luôn update SUMMARY.md** sau task lớn
