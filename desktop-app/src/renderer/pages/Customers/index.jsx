// Customers — Tab Phân Tích Khách Hàng
import React, { useState, useCallback } from 'react'
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  FunnelChart, Funnel, LabelList
} from 'recharts'
import { TabHeader } from '@/components/layout/TabHeader'
import { KPICard } from '@/components/ui/KPICard'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Users, Star, Heart, TrendingUp } from 'lucide-react'

const SEGMENT_COLORS = {
  'VIP': '#a855f7',
  'Trung Thành': '#06b6d4',
  'Tiềm Năng': '#10b981',
  'Mới': '#f59e0b',
}

const MOCK_SEGMENTS = [
  { name: 'VIP', value: 420, avgCLV: 1250 },
  { name: 'Trung Thành', value: 890, avgCLV: 580 },
  { name: 'Tiềm Năng', value: 1240, avgCLV: 210 },
  { name: 'Mới', value: 741, avgCLV: 95 },
]

const MOCK_CLV_HISTOGRAM = [
  { range: '0–100€', count: 892 },
  { range: '100–300€', count: 1124 },
  { range: '300–600€', count: 648 },
  { range: '600–1000€', count: 389 },
  { range: '1000–2000€', count: 198 },
  { range: '>2000€', count: 40 },
]

const MOCK_FUNNEL = [
  { name: 'Xem sản phẩm', value: 24000 },
  { name: 'Thêm vào giỏ', value: 8400 },
  { name: 'Bắt đầu checkout', value: 4200 },
  { name: 'Hoàn thành đơn', value: 3291 },
]

const MOCK_KPI = {
  totalCustomers: 3291,
  vipCount: 420,
  avgCLV: 342,
  retentionRate: 68.4,
}

const RADIAN = Math.PI / 180
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  if (percent < 0.06) return null
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11}>{`${(percent * 100).toFixed(0)}%`}</text>
}

export default function Customers() {
  const [loading, setLoading] = useState(false)
  const [filterCountry, setFilterCountry] = useState('all')

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
  }, [])

  const handleExport = useCallback(() => {
    alert('Tính năng Export sẽ hoạt động sau khi có data thật')
  }, [])

  useKeyboardShortcuts({ 'ctrl+r': handleRefresh, 'ctrl+e': handleExport })

  const funnelConvRate = ((MOCK_FUNNEL[3].value / MOCK_FUNNEL[0].value) * 100).toFixed(1)

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <TabHeader
        title="Phân Tích Khách Hàng"
        ruleKey="customers"
        onRefresh={handleRefresh}
        onExport={handleExport}
        loading={loading}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* KPI Row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard title="Tổng khách hàng" value={formatNumber(MOCK_KPI.totalCustomers)} change={5.7} icon={Users} loading={loading} />
          <KPICard title="Khách VIP" value={formatNumber(MOCK_KPI.vipCount)} change={12.1} icon={Star} loading={loading} />
          <KPICard title="CLV trung bình" value={formatCurrency(MOCK_KPI.avgCLV, 'EUR')} change={8.3} icon={TrendingUp} loading={loading} />
          <KPICard title="Retention Rate" value={`${MOCK_KPI.retentionRate}%`} change={2.4} icon={Heart} loading={loading} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Segment Donut */}
          <div className="cvy-card">
            <h3 className="font-medium text-sm text-gray-300 mb-4">Phân khúc khách hàng</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={MOCK_SEGMENTS}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={100}
                  dataKey="value"
                  labelLine={false}
                  label={renderLabel}
                >
                  {MOCK_SEGMENTS.map((s) => (
                    <Cell key={s.name} fill={SEGMENT_COLORS[s.name]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                <Tooltip
                  formatter={(v, name, props) => [`${v} khách (CLV TB: ${formatCurrency(props.payload.avgCLV, 'EUR')})`, name]}
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #2e2e2e', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Segment Legend Detail */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {MOCK_SEGMENTS.map(s => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: SEGMENT_COLORS[s.name] }} />
                  <span className="text-gray-400">{s.name}:</span>
                  <span className="text-white font-medium">{s.value}</span>
                  <span className="text-gray-500 ml-auto">CLV: {formatCurrency(s.avgCLV, 'EUR')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CLV Histogram */}
          <div className="cvy-card">
            <h3 className="font-medium text-sm text-gray-300 mb-4">Phân phối CLV khách hàng</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={MOCK_CLV_HISTOGRAM} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                <XAxis dataKey="range" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #2e2e2e', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v) => [`${v} khách`, 'Số lượng']}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Số khách hàng" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Purchase Funnel */}
        <div className="cvy-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm text-gray-300">Phễu chuyển đổi — Conversion Funnel</h3>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
              Tỷ lệ chuyển đổi tổng: {funnelConvRate}%
            </span>
          </div>
          <div className="flex items-stretch gap-0">
            {MOCK_FUNNEL.map((step, i) => {
              const pct = ((step.value / MOCK_FUNNEL[0].value) * 100).toFixed(1)
              const dropPct = i > 0
                ? (((MOCK_FUNNEL[i - 1].value - step.value) / MOCK_FUNNEL[i - 1].value) * 100).toFixed(1)
                : null
              const colors = ['#a855f7', '#06b6d4', '#10b981', '#f59e0b']
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full flex flex-col items-center justify-center rounded-lg py-5 mb-2 transition-all"
                    style={{ background: `${colors[i]}20`, borderLeft: `3px solid ${colors[i]}` }}
                  >
                    <span className="text-xs text-gray-400 mb-1">{step.name}</span>
                    <span className="text-xl font-bold text-white">{formatNumber(step.value)}</span>
                    <span className="text-xs mt-1" style={{ color: colors[i] }}>{pct}%</span>
                  </div>
                  {dropPct && (
                    <div className="text-center">
                      <span className="text-xs text-red-400">▼ -{dropPct}%</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

