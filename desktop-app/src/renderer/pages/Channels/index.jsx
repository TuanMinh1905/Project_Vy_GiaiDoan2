// Channels — Tab Hiệu Suất Kênh Bán (DỮ LIỆU THẬT)
import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { TabHeader } from '@/components/layout/TabHeader'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Monitor, Smartphone, Share2, Globe, AlertCircle } from 'lucide-react'

const CHANNEL_ICONS = { 'E-commerce': Monitor, 'App Mobile': Smartphone, 'Social Media': Share2, 'Marketplace': Globe }
const CHANNEL_COLORS_MAP = { 'E-commerce': '#a855f7', 'App Mobile': '#06b6d4', 'Social Media': '#10b981', 'Marketplace': '#f59e0b' }
const FALLBACK_COLORS = ['#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function getChannelColor(name, idx) { return CHANNEL_COLORS_MAP[name] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length] }

export default function Channels() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [metric, setMetric] = useState('revenue')

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await window.electron?.getDashboardData({ tab: 'channels' })
      if (r?.success) setData(r.data); else setError(r?.error)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useKeyboardShortcuts({ 'ctrl+r': loadData })

  if (!data && !loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden fade-in">
        <TabHeader title="Hiệu Suất Kênh Bán" ruleKey="channels" onRefresh={loadData} loading={loading} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3"><AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
            <p className="text-gray-400">{error || 'Chưa có dữ liệu.'}</p></div>
        </div>
      </div>
    )
  }

  const channels = data?.channels || []
  const trend = data?.trend || []
  const channelNames = data?.channelNames || channels.map(c => c.channel)
  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <TabHeader title="Hiệu Suất Kênh Bán" ruleKey="channels" onRefresh={loadData} loading={loading} />
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* Channel KPI Cards */}
        <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.min(channels.length, 4)}, 1fr)` }}>
          {channels.map((c, idx) => {
            const color = getChannelColor(c.channel, idx)
            const Icon = CHANNEL_ICONS[c.channel] || Globe
            return (
              <div key={c.channel} className="cvy-card relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${color}, transparent)` }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-1.5 rounded-lg" style={{ background: `${color}20` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <span className="text-xs font-medium text-gray-400">
                      {totalRevenue ? `${((c.revenue / totalRevenue) * 100).toFixed(0)}% tổng` : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{c.channel}</p>
                  <p className="text-xl font-bold text-white mb-1 font-mono">{formatCurrency(c.revenue, 'EUR')}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatNumber(c.orders)} đơn</span>
                    <span>AOV: {formatCurrency(c.avgOrder, 'EUR')}</span>
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
              {[{ key: 'revenue', label: 'Doanh thu' }, { key: 'orders', label: 'Đơn hàng' }, { key: 'avgOrder', label: 'AOV' }].map(opt => (
                <button key={opt.key} onClick={() => setMetric(opt.key)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all ${metric === opt.key ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={channels} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
              <XAxis dataKey="channel" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={v => metric === 'revenue' ? `${v / 1000}K` : v} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2e2e2e', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(v) => [metric === 'revenue' || metric === 'avgOrder' ? formatCurrency(v, 'EUR') : formatNumber(v),
                  metric === 'revenue' ? 'Doanh thu' : metric === 'orders' ? 'Đơn hàng' : 'AOV']} />
              <Bar dataKey={metric} radius={[4, 4, 0, 0]}>
                {channels.map((c, idx) => <Cell key={c.channel} fill={getChannelColor(c.channel, idx)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Line Chart */}
        {trend.length > 1 && (
          <div className="cvy-card">
            <h3 className="font-medium text-sm text-gray-300 mb-4">Xu hướng doanh thu theo kênh</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `${v / 1000}K`} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2e2e2e', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }} formatter={(v) => [formatCurrency(v, 'EUR')]} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                {channelNames.map((ch, idx) => (
                  <Line key={ch} type="monotone" dataKey={ch} stroke={getChannelColor(ch, idx)}
                    strokeWidth={2} dot={{ r: 4 }} name={ch} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Detail Table */}
        <div className="cvy-card">
          <h3 className="font-medium text-sm text-gray-300 mb-4">Bảng chi tiết kênh bán</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left">
                {['Kênh', 'Doanh thu', '% tổng', 'Đơn hàng', 'AOV', 'SP/đơn TB'].map(h => (
                  <th key={h} className="pb-2 text-gray-400 font-medium pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {channels.map((c, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                  <td className="py-2 pr-4">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: getChannelColor(c.channel, idx) }} />
                      <span className="text-gray-200">{c.channel}</span>
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-mono text-purple-300">{formatCurrency(c.revenue, 'EUR')}</td>
                  <td className="py-2 pr-4 text-gray-400">{totalRevenue ? ((c.revenue / totalRevenue) * 100).toFixed(1) : 0}%</td>
                  <td className="py-2 pr-4 text-gray-300">{formatNumber(c.orders)}</td>
                  <td className="py-2 pr-4 font-mono text-cyan-300">{formatCurrency(c.avgOrder, 'EUR')}</td>
                  <td className="py-2 text-gray-300">{c.avgUnits?.toFixed(1) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
