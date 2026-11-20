// Geography — Tab Phân Tích Địa Lý
import React, { useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { TabHeader } from '@/components/layout/TabHeader'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { MapPin } from 'lucide-react'

const FLAG = {
  'Pháp': '🇫🇷', 'Đức': '🇩🇪', 'Tây Ban Nha': '🇪🇸',
  'Ý': '🇮🇹', 'Hà Lan': '🇳🇱', 'Ba Lan': '🇵🇱',
  'Bỉ': '🇧🇪', 'Bồ Đào Nha': '🇵🇹', 'Áo': '🇦🇹', 'Thụy Điển': '🇸🇪',
}

const MOCK_GEO = [
  { country: 'Pháp', revenue: 384000, orders: 2621, customers: 1024, avgOrder: 146.5 },
  { country: 'Đức', revenue: 298000, orders: 2089, customers: 812, avgOrder: 142.7 },
  { country: 'Tây Ban Nha', revenue: 187000, orders: 1312, customers: 521, avgOrder: 142.5 },
  { country: 'Ý', revenue: 156000, orders: 1098, customers: 429, avgOrder: 142.1 },
  { country: 'Hà Lan', revenue: 98000, orders: 712, customers: 285, avgOrder: 137.6 },
  { country: 'Ba Lan', revenue: 76000, orders: 591, customers: 234, avgOrder: 128.6 },
  { country: 'Bỉ', revenue: 54000, orders: 398, customers: 158, avgOrder: 135.7 },
  { country: 'Bồ Đào Nha', revenue: 42000, orders: 318, customers: 127, avgOrder: 132.1 },
  { country: 'Áo', revenue: 38000, orders: 289, customers: 115, avgOrder: 131.5 },
  { country: 'Thụy Điển', revenue: 32000, orders: 254, customers: 98, avgOrder: 126.0 },
]

const TOTAL_REVENUE = MOCK_GEO.reduce((s, c) => s + c.revenue, 0)

const GRADIENT_COLORS = [
  '#a855f7', '#9333ea', '#7c3aed', '#6d28d9', '#5b21b6',
  '#4c1d95', '#3730a3', '#1d4ed8', '#1e40af', '#1e3a8a'
]

export default function Geography() {
  const [loading, setLoading] = useState(false)
  const [metric, setMetric] = useState('revenue') // 'revenue' | 'orders'
  const [selected, setSelected] = useState(null)

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
  }, [])

  const handleExport = useCallback(() => {
    alert('Tính năng Export sẽ hoạt động sau khi có data thật')
  }, [])

  useKeyboardShortcuts({ 'ctrl+r': handleRefresh, 'ctrl+e': handleExport })

  const chartData = [...MOCK_GEO].sort((a, b) => b[metric] - a[metric])
  const selectedData = selected ? MOCK_GEO.find(c => c.country === selected) : null

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <TabHeader
        title="Phân Tích Địa Lý"
        ruleKey="geography"
        onRefresh={handleRefresh}
        onExport={handleExport}
        loading={loading}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* Controls */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">Hiển thị theo:</span>
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {[
              { key: 'revenue', label: 'Doanh thu' },
              { key: 'orders', label: 'Số đơn hàng' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setMetric(opt.key)}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  metric === opt.key
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {selected && (
            <button onClick={() => setSelected(null)} className="text-xs text-gray-500 hover:text-gray-300 ml-2">
              ✕ Bỏ chọn
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Main Chart */}
          <div className="xl:col-span-2 cvy-card">
            <h3 className="font-medium text-sm text-gray-300 mb-4">
              {metric === 'revenue' ? 'Doanh thu' : 'Số đơn hàng'} theo Quốc gia
              <span className="text-gray-500 text-xs ml-2">(nhấp để xem chi tiết)</span>
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                onClick={(e) => e?.activeLabel && setSelected(e.activeLabel)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                <XAxis dataKey="country" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickFormatter={v => metric === 'revenue' ? `${v / 1000}K` : v}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #2e2e2e', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v) => [
                    metric === 'revenue' ? formatCurrency(v, 'EUR') : formatNumber(v),
                    metric === 'revenue' ? 'Doanh thu' : 'Đơn hàng'
                  ]}
                />
                <Bar dataKey={metric} radius={[4, 4, 0, 0]} cursor="pointer">
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={GRADIENT_COLORS[i] || '#4c1d95'}
                      opacity={selected && chartData[i].country !== selected ? 0.4 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Country Detail Panel */}
          <div className="cvy-card flex flex-col gap-3">
            {selectedData ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{FLAG[selectedData.country] || '🌍'}</span>
                  <div>
                    <h3 className="font-semibold text-white">{selectedData.country}</h3>
                    <p className="text-xs text-gray-400">
                      {((selectedData.revenue / TOTAL_REVENUE) * 100).toFixed(1)}% tổng doanh thu
                    </p>
                  </div>
                </div>
                {[
                  { label: 'Doanh thu', value: formatCurrency(selectedData.revenue, 'EUR'), color: 'text-purple-300' },
                  { label: 'Số đơn hàng', value: formatNumber(selectedData.orders), color: 'text-cyan-300' },
                  { label: 'Số khách hàng', value: formatNumber(selectedData.customers), color: 'text-green-300' },
                  { label: 'AOV', value: formatCurrency(selectedData.avgOrder, 'EUR'), color: 'text-yellow-300' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-xs text-gray-400">{item.label}</span>
                    <span className={`text-sm font-semibold font-mono ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <MapPin className="w-10 h-10 text-gray-600" />
                <p className="text-sm text-gray-400">Nhấp vào cột trên biểu đồ</p>
                <p className="text-xs text-gray-600">để xem chi tiết quốc gia</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Table */}
        <div className="cvy-card">
          <h3 className="font-medium text-sm text-gray-300 mb-4">Tổng hợp tất cả quốc gia</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  {['Quốc gia', 'Doanh thu', '% tổng', 'Đơn hàng', 'Khách hàng', 'AOV'].map(h => (
                    <th key={h} className="pb-2 text-gray-400 font-medium pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_GEO.map((c, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-800 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelected(c.country)}
                  >
                    <td className="py-2 pr-4 text-gray-200">
                      {FLAG[c.country] || '🌍'} {c.country}
                    </td>
                    <td className="py-2 pr-4 font-mono text-purple-300">{formatCurrency(c.revenue, 'EUR')}</td>
                    <td className="py-2 pr-4 text-gray-400">{((c.revenue / TOTAL_REVENUE) * 100).toFixed(1)}%</td>
                    <td className="py-2 pr-4 text-gray-300">{formatNumber(c.orders)}</td>
                    <td className="py-2 pr-4 text-gray-300">{formatNumber(c.customers)}</td>
                    <td className="py-2 font-mono text-cyan-300">{formatCurrency(c.avgOrder, 'EUR')}</td>
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

