import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes safely
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format số tiền VND / USD
 */
export function formatCurrency(value, currency = 'USD') {
  if (value == null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format số lớn (1200 → 1.2K, 1200000 → 1.2M)
 */
export function formatNumber(value) {
  if (value == null) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString('vi-VN')
}

/**
 * Format phần trăm
 */
export function formatPercent(value, decimals = 1) {
  if (value == null) return '—'
  return `${value.toFixed(decimals)}%`
}

/**
 * Format ngày tháng
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

/**
 * Tính % thay đổi giữa 2 kỳ
 */
export function calcChange(current, previous) {
  if (!previous || previous === 0) return null
  return ((current - previous) / previous) * 100
}

/**
 * Xuất mảng object ra file CSV và tự động tải xuống
 */
export function exportToCSV(rows, filename = 'export.csv') {
  if (!rows || !rows.length) return
  const headers = Object.keys(rows[0])
  const csvLines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] == null ? '' : String(row[h]).replace(/"/g, '""')
        return /[",\n]/.test(val) ? `"${val}"` : val
      }).join(',')
    ),
  ]
  const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

