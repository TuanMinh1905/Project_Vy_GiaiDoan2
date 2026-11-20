// Customers — Tab Phân Tích Khách Hàng (DỮ LIỆU THẬT)
import React, { useState, useEffect, useCallback } from 'react'
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { TabHeader } from '@/components/layout/TabHeader'
import { KPICard } from '@/components/ui/KPICard'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Users, Star, Heart, TrendingUp, AlertCircle } from 'lucide-react'

const SEGMENT_COLORS = {
  'VIP': '#a855f7', 'Trung Thành': '#06b6d4',
  'Tiềm Năng': '#10b981', 'Mới': '#f59e0b', 'Chưa Mua': '#6b7280',
}
const AGE_COLOR = '#8b5cf6'

const RADIAN = Math.PI / 180
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  if (percent < 0.06) return null
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11}>{`${(percent * 100).toFixed(0)}%`}</text>
}

export default function Customers() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await window.electron?.getDashboardData({ tab: 'customers' })
      if (r?.success) setData(r.data); else setError(r?.error)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useKeyboardShortcuts({ 'ctrl+r': loadData })

  if (!data && !loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden fade-in">
        <TabHeader title="Phân Tích Khách Hàng" ruleKey="customers" onRefresh={loadData} loading={loading} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3"><AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
            <p className="text-gray-400">{error || 'Chưa có dữ liệu.'}</p></div>
        </div>
      </div>
    )
  }

  const kpi = data?.kpi || {}
  const segments = data?.segments || []
  const clvHistogram = data?.clvHistogram || []
  const ageRanges = data?.ageRanges || []

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <TabHeader title="Phân Tích Khách Hàng" ruleKey="customers" onRefresh={loadData} loading={loading} />
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* KPI Row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard title="Tổng khách hàng" value={formatNumber(kpi.totalCustomers)} icon={Users} loading={loading} />
          <KPICard title="Khách VIP" value={formatNumber(kpi.vipCount)} icon={Star} loading={loading} />
          <KPICard title="CLV trung bình (đã mua)" value={formatCurrency(kpi.avgCLV, 'EUR')} icon={TrendingUp} loading={loading} />
          <KPICard title="Tỷ lệ mua lại" value={`${kpi.repeatRate || 0}%`} icon={Heart} loading={loading} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Segment Donut */}
          <div className="cvy-card">
            <h3 className="font-medium text-sm text-gray-300 mb-4">Phân khúc khách hàng</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={segments} cx="50%" cy="45%" innerRadius={65} outerRadius={100}
                  dataKey="value" labelLine={false} label={renderLabel}>
                  {segments.map((s) => <Cell key={s.name} fill={SEGMENT_COLORS[s.name] || '#6b7280'} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                <Tooltip formatter={(v, name, props) => [`${v} khách (CLV TB: ${formatCurrency(props.payload.avgCLV, 'EUR')})`, name]}
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #2e2e2e', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {segments.map(s => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: SEGMENT_COLORS[s.name] || '#6b7280' }} />
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
              <BarChart data={clvHistogram} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                <XAxis dataKey="range" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2e2e2e', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }} formatter={(v) => [`${v} khách`, 'Số lượng']} />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Số khách hàng" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Phân phối tuổi */}
        <div className="cvy-card">
          <h3 className="font-medium text-sm text-gray-300 mb-4">Phân phối khách hàng theo độ tuổi</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ageRanges} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
              <XAxis dataKey="range" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2e2e2e', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }} formatter={(v) => [`${v} khách`, 'Số lượng']} />
              <Bar dataKey="count" fill={AGE_COLOR} radius={[4, 4, 0, 0]} name="Số khách hàng" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
