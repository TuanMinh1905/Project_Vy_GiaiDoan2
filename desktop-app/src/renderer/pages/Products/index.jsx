// Products — Tab Hiệu Suất Sản Phẩm
import React, { useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { TabHeader } from '@/components/layout/TabHeader'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

const COLORS = ['#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899']

const MOCK_TOP10 = [
  { name: 'Áo Blazer Nữ Slim Fit', revenue: 48200, orders: 312, refundRate: 3.2 },
  { name: 'Quần Jean Nam Skinny', revenue: 42800, orders: 285, refundRate: 5.1 },
  { name: 'Đầm Maxi Boho Mùa Hè', revenue: 38600, orders: 261, refundRate: 4.8 },
  { name: 'Áo Hoodie Unisex Basic', revenue: 35100, orders: 348, refundRate: 2.1 },
  { name: 'Giày Sneaker Nữ White', revenue: 31400, orders: 196, refundRate: 7.3 },
  { name: 'Áo Sơ Mi Nam Oxford', revenue: 28900, orders: 224, refundRate: 3.5 },
  { name: 'Túi Tote Canvas Minimal', revenue: 25600, orders: 312, refundRate: 1.8 },
  { name: 'Quần Shorts Nam Cargo', revenue: 22300, orders: 189, refundRate: 4.2 },
  { name: 'Áo Crop Top Ribbed', revenue: 19800, orders: 267, refundRate: 6.1 },
  { name: 'Thắt Lưng Da Bò Thật', revenue: 17200, orders: 143, refundRate: 2.9 },
]

const MOCK_CATEGORIES = [
  { name: 'Áo nữ', value: 285000 },
  { name: 'Quần nam', value: 198000 },
  { name: 'Giày dép', value: 156000 },
  { name: 'Áo nam', value: 134000 },
  { name: 'Phụ kiện', value: 98000 },
  { name: 'Quần nữ', value: 87000 },
  { name: 'Khác', value: 52000 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="cvy-card text-xs space-y-1 shadow-xl min-w-[160px]">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <span className="font-mono">{formatNumber(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

const RADIAN = Math.PI / 180
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  if (percent < 0.05) return null
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function Products() {
  const [loading, setLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
  }, [])

  const handleExport = useCallback(() => {
    alert('Tính năng Export sẽ hoạt động sau khi có data thật')
  }, [])

  useKeyboardShortcuts({
    'ctrl+r': handleRefresh,
    'ctrl+e': handleExport,
    'ctrl+f': () => document.getElementById('category-filter')?.focus(),
  })

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <TabHeader
        title="Hiệu Suất Sản Phẩm"
        ruleKey="products"
        onRefresh={handleRefresh}
        onExport={handleExport}
        loading={loading}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* Filter */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400">Lọc danh mục:</label>
          <select
            id="category-filter"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="cvy-input text-sm py-1 px-3"
          >
            <option value="all">Tất cả</option>
            {MOCK_CATEGORIES.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500 ml-2">Ctrl+F để focus filter</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Top 10 horizontal bar */}
          <div className="xl:col-span-2 cvy-card">
            <h3 className="font-medium text-sm text-gray-300 mb-4">Top 10 Sản Phẩm Bán Chạy (theo Doanh thu)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={MOCK_TOP10}
                layout="vertical"
                margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickFormatter={v => `${v / 1000}K`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#d1d5db', fontSize: 11 }}
                  width={180}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#a855f7" radius={[0, 4, 4, 0]} name="Doanh thu" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Donut */}
          <div className="cvy-card">
            <h3 className="font-medium text-sm text-gray-300 mb-4">Doanh thu theo Danh mục</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={MOCK_CATEGORIES}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={95}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {MOCK_CATEGORIES.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
                />
                <Tooltip
                  formatter={(v) => formatCurrency(v, 'EUR')}
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #2e2e2e', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Detail Table */}
        <div className="cvy-card">
          <h3 className="font-medium text-sm text-gray-300 mb-4">Chi tiết Top 10 — Tỷ lệ hoàn hàng</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="pb-2 text-gray-400 font-medium pr-4">#</th>
                  <th className="pb-2 text-gray-400 font-medium">Sản phẩm</th>
                  <th className="pb-2 text-gray-400 font-medium text-right">Doanh thu</th>
                  <th className="pb-2 text-gray-400 font-medium text-right">Đơn hàng</th>
                  <th className="pb-2 text-gray-400 font-medium text-right">Tỷ lệ hoàn</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_TOP10.map((p, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                    <td className="py-2 pr-4 text-gray-500">{i + 1}</td>
                    <td className="py-2 text-gray-200">{p.name}</td>
                    <td className="py-2 text-right font-mono text-purple-300">{formatCurrency(p.revenue, 'EUR')}</td>
                    <td className="py-2 text-right text-gray-300">{formatNumber(p.orders)}</td>
                    <td className="py-2 text-right">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.refundRate > 7 ? 'bg-red-500/20 text-red-400' :
                        p.refundRate > 4 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {p.refundRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

