// Geography — Tab Phân Tích Địa Lý (DỮ LIỆU THẬT)
import React, { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TabHeader } from '@/components/layout/TabHeader'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { MapPin, AlertCircle } from 'lucide-react'

const FLAG = {
  'France': '🇫🇷', 'Germany': '🇩🇪', 'Spain': '🇪🇸',
  'Italy': '🇮🇹', 'Netherlands': '🇳🇱', 'Portugal': '🇵🇹',
}

const GRADIENT_COLORS = ['#a855f7', '#9333ea', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#3730a3', '#1d4ed8', '#1e40af', '#1e3a8a']

export default function Geography() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [metric, setMetric] = useState('revenue')
  const [selected, setSelected] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await window.electron?.getDashboardData({ tab: 'geography' })
      if (r?.success) setData(r.data); else setError(r?.error)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useKeyboardShortcuts({ 'ctrl+r': loadData })

  if (!data && !loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden fade-in">
        <TabHeader title="Phân Tích Địa Lý" ruleKey="geography" onRefresh={loadData} loading={loading} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3"><AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
            <p className="text-gray-400">{error || 'Chưa có dữ liệu.'}</p></div>
        </div>
      </div>
    )
  }

  const countries = data?.countries || []
  const totalRevenue = countries.reduce((s, c) => s + c.revenue, 0)
  const chartData = [...countries].sort((a, b) => b[metric] - a[metric])
  const selectedData = selected ? countries.find(c => c.country === selected) : null

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <TabHeader title="Phân Tích Địa Lý" ruleKey="geography" onRefresh={loadData} loading={loading} />
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* Controls */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">Hiển thị theo:</span>
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {[{ key: 'revenue', label: 'Doanh thu' }, { key: 'orders', label: 'Số đơn hàng' }].map(opt => (
              <button key={opt.key} onClick={() => setMetric(opt.key)}
                className={`px-3 py-1 text-xs rounded-md transition-all ${metric === opt.key ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {opt.label}
              </button>
            ))}
          </div>
          {selected && <button onClick={() => setSelected(null)} className="text-xs text-gray-500 hover:text-gray-300 ml-2">✕ Bỏ chọn</button>}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 cvy-card">
            <h3 className="font-medium text-sm text-gray-300 mb-4">
              {metric === 'revenue' ? 'Doanh thu' : 'Số đơn hàng'} theo Quốc gia
              <span className="text-gray-500 text-xs ml-2">(nhấp để xem chi tiết)</span>
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                onClick={(e) => e?.activeLabel && setSelected(e.activeLabel)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                <XAxis dataKey="country" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => metric === 'revenue' ? `${v / 1000}K` : v} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2e2e2e', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v) => [metric === 'revenue' ? formatCurrency(v, 'EUR') : formatNumber(v), metric === 'revenue' ? 'Doanh thu' : 'Đơn hàng']} />
                <Bar dataKey={metric} radius={[4, 4, 0, 0]} cursor="pointer">
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={GRADIENT_COLORS[i] || '#4c1d95'}
                      opacity={selected && chartData[i].country !== selected ? 0.4 : 1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="cvy-card flex flex-col gap-3">
            {selectedData ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{FLAG[selectedData.country] || '🌍'}</span>
                  <div>
                    <h3 className="font-semibold text-white">{selectedData.country}</h3>
                    <p className="text-xs text-gray-400">{((selectedData.revenue / totalRevenue) * 100).toFixed(1)}% tổng doanh thu</p>
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
                {countries.map((c, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelected(c.country)}>
                    <td className="py-2 pr-4 text-gray-200">{FLAG[c.country] || '🌍'} {c.country}</td>
                    <td className="py-2 pr-4 font-mono text-purple-300">{formatCurrency(c.revenue, 'EUR')}</td>
                    <td className="py-2 pr-4 text-gray-400">{((c.revenue / totalRevenue) * 100).toFixed(1)}%</td>
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
