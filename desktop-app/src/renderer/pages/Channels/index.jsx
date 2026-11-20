// Channels — Tab Hiệu Suất Kênh Bán
import React, { useState, useCallback } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { TabHeader } from '@/components/layout/TabHeader'
import { KPICard } from '@/components/ui/KPICard'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { Monitor, Smartphone, Share2, Globe } from 'lucide-react'

const CHANNEL_ICONS = {
  'Website': Monitor,
  'Mobile App': Smartphone,
  'Social Media': Share2,
  'Marketplace': Globe,
}

const CHANNEL_COLORS = {
  'Website': '#a855f7',
  'Mobile App': '#06b6d4',
  'Social Media': '#10b981',
  'Marketplace': '#f59e0b',
}

const MOCK_CHANNELS = [
  { channel: 'Website', revenue: 540000, orders: 3650, conversion: 4.2, sessions: 86900, avgOrder: 147.9 },
  { channel: 'Mobile App', revenue: 390000, orders: 2810, conversion: 5.8, sessions: 48450, avgOrder: 138.8 },
  { channel: 'Social Media', revenue: 198000, orders: 1420, conversion: 2.1, sessions: 67600, avgOrder: 139.4 },
  { channel: 'Marketplace', revenue: 117890, orders: 980, conversion: 6.4, sessions: 15300, avgOrder: 120.3 },
]

const MOCK_TREND = [
  { month: 'T7', website: 85000, mobile: 61000, social: 31000, marketplace: 18000 },
  { month: 'T8', website: 90000, mobile: 65000, social: 33000, marketplace: 19500 },
  { month: 'T9', website: 88000, mobile: 63000, social: 30000, marketplace: 18800 },
  { month: 'T10', website: 95000, mobile: 68000, social: 36000, marketplace: 20100 },
  { month: 'T11', website: 92000, mobile: 67000, social: 34000, marketplace: 19600 },
  { month: 'T12', website: 90000, mobile: 66000, social: 34000, marketplace: 21890 },
]

const TOTAL_REVENUE = MOCK_CHANNELS.reduce((s, c) => s + c.revenue, 0)

export default function Channels() {
  const [loading, setLoading] = useState(false)
  const [metric, setMetric] = useState('revenue')

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
  }, [])

  const handleExport = useCallback(() => {
    alert('Tính năng Export sẽ hoạt động sau khi có data thật')
  }, [])

  useKeyboardShortcuts({ 'ctrl+r': handleRefresh, 'ctrl+e': handleExport })

  const comparisonData = MOCK_CHANNELS.map(c => ({
    name: c.channel,
    revenue: c.revenue,
    orders: c.orders,
    conversion: c.conversion,
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <TabHeader
        title="Hiệu Suất Kênh Bán"
        ruleKey="channels"
        onRefresh={handleRefresh}
        onExport={handleExport}
        loading={loading}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* Channel KPI Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {MOCK_CHANNELS.map(c => {
            const Icon = CHANNEL_ICONS[c.channel] || Globe
            return (
              <div key={c.channel} className="cvy-card relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ background: `linear-gradient(135deg, ${CHANNEL_COLORS[c.channel]}, transparent)` }}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="p-1.5 rounded-lg"
                      style={{ background: `${CHANNEL_COLORS[c.channel]}20` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: CHANNEL_COLORS[c.channel] }} />
                    </div>
                    <span className="text-xs font-medium text-gray-400">
                      {((c.revenue / TOTAL_REVENUE) * 100).toFixed(0)}% tổng
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{c.channel}</p>
                  <p className="text-xl font-bold text-white mb-1 font-mono">{formatCurrency(c.revenue, 'EUR')}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatNumber(c.orders)} đơn</span>
                    <span className="text-green-400">{c.conversion}% conv</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Comparison Bar Chart */}
        <div className="cvy-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm text-gray-300">So sánh kênh bán theo chỉ số</h3>
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              {[
                { key: 'revenue', label: 'Doanh thu' },
                { key: 'orders', label: 'Đơn hàng' },
                { key: 'conversion', label: 'Conversion %' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setMetric(opt.key)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                    metric === opt.key ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={v =>
                  metric === 'revenue' ? `${v / 1000}K` :
                  metric === 'conversion' ? `${v}%` : v
                }
              />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #2e2e2e', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(v) => [
                  metric === 'revenue' ? formatCurrency(v, 'EUR') :
                  metric === 'conversion' ? `${v}%` : formatNumber(v),
                  metric === 'revenue' ? 'Doanh thu' :
                  metric === 'conversion' ? 'Conversion Rate' : 'Đơn hàng'
                ]}
              />
              <Bar dataKey={metric} radius={[4, 4, 0, 0]}>
                {comparisonData.map((c) => (
                  <Cell key={c.name} fill={CHANNEL_COLORS[c.name] || '#a855f7'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Line Chart */}
        <div className="cvy-card">
          <h3 className="font-medium text-sm text-gray-300 mb-4">Xu hướng doanh thu theo kênh (6 tháng gần nhất)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={MOCK_TREND} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `${v / 1000}K`} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #2e2e2e', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(v) => [formatCurrency(v, 'EUR')]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
              <Line type="monotone" dataKey="website" stroke="#a855f7" strokeWidth={2} dot={false} name="Website" />
              <Line type="monotone" dataKey="mobile" stroke="#06b6d4" strokeWidth={2} dot={false} name="Mobile App" />
              <Line type="monotone" dataKey="social" stroke="#10b981" strokeWidth={2} dot={false} name="Social Media" />
              <Line type="monotone" dataKey="marketplace" stroke="#f59e0b" strokeWidth={2} dot={false} name="Marketplace" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Detail Table */}
        <div className="cvy-card">
          <h3 className="font-medium text-sm text-gray-300 mb-4">Bảng chi tiết kênh bán</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left">
                {['Kênh', 'Doanh thu', '% tổng', 'Đơn hàng', 'Sessions', 'Conversion', 'AOV'].map(h => (
                  <th key={h} className="pb-2 text-gray-400 font-medium pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_CHANNELS.map((c, i) => (
                <tr key={i} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                  <td className="py-2 pr-4">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: CHANNEL_COLORS[c.channel] }} />
                      <span className="text-gray-200">{c.channel}</span>
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-mono text-purple-300">{formatCurrency(c.revenue, 'EUR')}</td>
                  <td className="py-2 pr-4 text-gray-400">{((c.revenue / TOTAL_REVENUE) * 100).toFixed(1)}%</td>
                  <td className="py-2 pr-4 text-gray-300">{formatNumber(c.orders)}</td>
                  <td className="py-2 pr-4 text-gray-400">{formatNumber(c.sessions)}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      c.conversion >= 5 ? 'bg-green-500/20 text-green-400' :
                      c.conversion >= 3 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {c.conversion}%
                    </span>
                  </td>
                  <td className="py-2 font-mono text-cyan-300">{formatCurrency(c.avgOrder, 'EUR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

