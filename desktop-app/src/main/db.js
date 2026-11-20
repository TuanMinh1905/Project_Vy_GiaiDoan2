// db.js — Lớp truy vấn SQLite cho Dashboard
// Dùng better-sqlite3 (đồng bộ, nhanh) trong Electron main process

import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync } from 'fs'

const PROJECT_ROOT = join(__dirname, '../../..')
const DB_PATH = join(PROJECT_ROOT, 'data-pipeline/data/analytics.db')

let db = null

export function openDatabase() {
  closeDatabase()
  if (!existsSync(DB_PATH)) return false
  db = new Database(DB_PATH, { readonly: true, fileMustExist: true })
  db.pragma('journal_mode = WAL')
  return true
}

export function closeDatabase() {
  if (db) { try { db.close() } catch {} }
  db = null
}

export function isReady() { return !!db }
export function getDbPath() { return DB_PATH }

function tableExists(name) {
  if (!db) return false
  return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name)
}

function monthLabel(m) {
  // '2025-04' -> 'T4'
  return 'T' + parseInt(m.split('-')[1])
}

function pctChange(curr, prev) {
  if (!prev || prev === 0) return 0
  return Math.round((curr - prev) / Math.abs(prev) * 1000) / 10
}

// ============================================================
// OVERVIEW
// ============================================================
export function queryOverview() {
  if (!db || !tableExists('gold_orders')) return null

  const totals = db.prepare(`
    SELECT ROUND(SUM(revenue),2) as revenue, COUNT(*) as orders,
           COUNT(DISTINCT customer_id) as customers, ROUND(AVG(revenue),2) as aov
    FROM gold_orders`).get()

  const monthly = db.prepare(`
    SELECT month, ROUND(SUM(revenue),2) as revenue, COUNT(*) as orders,
           COUNT(DISTINCT customer_id) as customers, ROUND(AVG(revenue),2) as aov
    FROM gold_orders GROUP BY month ORDER BY month`).all()

  // Change: so sánh 2 tháng gần nhất
  const m1 = monthly[monthly.length - 1] || {}
  const m0 = monthly.length >= 2 ? monthly[monthly.length - 2] : null

  const kpi = {
    revenue: totals.revenue, orders: totals.orders,
    customers: totals.customers, aov: totals.aov,
    revenueChange: m0 ? pctChange(m1.revenue, m0.revenue) : 0,
    ordersChange: m0 ? pctChange(m1.orders, m0.orders) : 0,
    customersChange: m0 ? pctChange(m1.customers, m0.customers) : 0,
    aovChange: m0 ? pctChange(m1.aov, m0.aov) : 0,
  }

  const trend = monthly.map(r => ({ month: r.month, label: monthLabel(r.month), revenue: r.revenue, orders: r.orders }))

  const channel = db.prepare(`
    SELECT channel, ROUND(SUM(revenue),2) as revenue, COUNT(*) as orders
    FROM gold_orders GROUP BY channel ORDER BY revenue DESC`).all()

  return { kpi, trend, channel }
}

// ============================================================
// PRODUCTS
// ============================================================
export function queryProducts() {
  if (!db || !tableExists('gold_products')) return null

  const allRanked = db.prepare(`
    SELECT product_name as name, ROUND(total_revenue,2) as revenue,
           CAST(total_quantity AS INTEGER) as quantity,
           CAST(order_count AS INTEGER) as orders,
           category, ROUND(margin_pct,1) as margin
    FROM gold_products WHERE total_revenue > 0
    ORDER BY total_revenue DESC`).all()

  const top10 = allRanked.slice(0, 10)

  const categories = db.prepare(`
    SELECT category as name, ROUND(SUM(total_revenue),2) as value
    FROM gold_products GROUP BY category ORDER BY value DESC`).all()

  return { top10, allProducts: allRanked, categories }
}

// ============================================================
// CUSTOMERS
// ============================================================
export function queryCustomers() {
  if (!db || !tableExists('gold_customers')) return null

  const stats = db.prepare(`
    SELECT COUNT(*) as totalCustomers,
           SUM(CASE WHEN order_count > 0 THEN 1 ELSE 0 END) as buyers,
           SUM(CASE WHEN segment = 'VIP' THEN 1 ELSE 0 END) as vipCount,
           ROUND(AVG(CASE WHEN order_count > 0 THEN total_revenue END),2) as avgCLV
    FROM gold_customers`).get()

  const repeatRow = db.prepare(`
    SELECT ROUND(CAST(SUM(CASE WHEN order_count>=2 THEN 1 ELSE 0 END) AS REAL) /
           NULLIF(CAST(SUM(CASE WHEN order_count>=1 THEN 1 ELSE 0 END) AS REAL),0)*100, 1) as repeatRate
    FROM gold_customers`).get()

  const kpi = { ...stats, repeatRate: repeatRow?.repeatRate || 0 }

  const segments = db.prepare(`
    SELECT segment as name, COUNT(*) as value,
           ROUND(AVG(CASE WHEN order_count>0 THEN total_revenue ELSE 0 END),2) as avgCLV
    FROM gold_customers GROUP BY segment
    ORDER BY CASE segment WHEN 'VIP' THEN 1 WHEN 'Trung Thành' THEN 2
             WHEN 'Tiềm Năng' THEN 3 WHEN 'Mới' THEN 4 ELSE 5 END`).all()

  // CLV histogram (chỉ khách đã mua)
  const clvRows = db.prepare('SELECT total_revenue FROM gold_customers WHERE order_count > 0').all()
  const bins = [
    { min: 0, max: 100, label: '0–100€' },
    { min: 100, max: 300, label: '100–300€' },
    { min: 300, max: 500, label: '300–500€' },
    { min: 500, max: 1000, label: '500–1K€' },
    { min: 1000, max: Infinity, label: '>1K€' },
  ]
  const clvHistogram = bins.map(b => ({
    range: b.label,
    count: clvRows.filter(r => r.total_revenue >= b.min && r.total_revenue < b.max).length,
  }))

  // Phân phối tuổi
  const ageRanges = db.prepare(`
    SELECT age_range as range, COUNT(*) as count
    FROM gold_customers GROUP BY age_range ORDER BY age_range`).all()

  // Phân phối theo quốc gia
  const countries = db.prepare(`
    SELECT country, COUNT(*) as count,
           ROUND(SUM(total_revenue),2) as totalRevenue
    FROM gold_customers GROUP BY country ORDER BY totalRevenue DESC`).all()

  return { kpi, segments, clvHistogram, ageRanges, countries }
}

// ============================================================
// GEOGRAPHY
// ============================================================
export function queryGeography() {
  if (!db || !tableExists('gold_orders')) return null

  const countries = db.prepare(`
    SELECT country, ROUND(SUM(revenue),2) as revenue,
           COUNT(*) as orders, COUNT(DISTINCT customer_id) as customers,
           ROUND(AVG(revenue),2) as avgOrder
    FROM gold_orders GROUP BY country ORDER BY revenue DESC`).all()

  return { countries }
}

// ============================================================
// CHANNELS
// ============================================================
export function queryChannels() {
  if (!db || !tableExists('gold_orders')) return null

  const channels = db.prepare(`
    SELECT channel, ROUND(SUM(revenue),2) as revenue, COUNT(*) as orders,
           ROUND(AVG(revenue),2) as avgOrder,
           ROUND(AVG(units),1) as avgUnits,
           ROUND(SUM(discount_amount),2) as totalDiscount
    FROM gold_orders GROUP BY channel ORDER BY revenue DESC`).all()

  // Xu hướng theo tháng x kênh
  const rows = db.prepare(`
    SELECT month, channel, ROUND(SUM(revenue),2) as revenue
    FROM gold_orders GROUP BY month, channel ORDER BY month`).all()

  // Pivot: [{month, label, 'E-commerce': x, 'App Mobile': y}]
  const channelNames = [...new Set(rows.map(r => r.channel))]
  const months = [...new Set(rows.map(r => r.month))].sort()
  const trend = months.map(m => {
    const row = { month: m, label: monthLabel(m) }
    for (const ch of channelNames) {
      const found = rows.find(r => r.month === m && r.channel === ch)
      row[ch] = found ? found.revenue : 0
    }
    return row
  })

  return { channels, trend, channelNames }
}

// ============================================================
// ML FORECAST
// ============================================================
export function queryML() {
  const result = { predictions: [], backtest: [], modelInfo: null }
  if (!db) return result

  if (tableExists('ml_predictions')) {
    result.predictions = db.prepare('SELECT * FROM ml_predictions ORDER BY rank LIMIT 20').all()
  }
  if (tableExists('ml_backtest')) {
    result.backtest = db.prepare(`
      SELECT product_name, ROUND(predicted,1) as predicted, actual, baseline
      FROM ml_backtest WHERE actual > 0 ORDER BY actual DESC LIMIT 15`).all()
  }
  if (tableExists('ml_model_info')) {
    result.modelInfo = db.prepare('SELECT * FROM ml_model_info LIMIT 1').get() || null
  }
  return result
}

