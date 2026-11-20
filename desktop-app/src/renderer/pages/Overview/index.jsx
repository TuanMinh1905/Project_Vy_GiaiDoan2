// Overview Dashboard — Tab Tổng Quan Doanh Thu (DỮ LIỆU THẬT từ SQLite)
import React, { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { DollarSign, ShoppingCart, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { TabHeader } from '@/components/layout/TabHeader'
import { KPICard } from '@/components/ui/KPICard'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { formatCurrency, formatNumber } from '@/lib/utils'

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="cvy-card text-xs space-y-1 shadow-xl min-w-[140px]">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <span className="font-mono">{formatNumber(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function Overview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.electron?.getDashboardData({ tab: 'overview' })
      if (result?.success) setData(result.data)
      else setError(result?.error || 'Không thể tải dữ liệu')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleExport = useCallback(() => {
    alert('Tính năng Export sẽ được phát triển sau')
  }, [])

  useKeyboardShortcuts({ 'ctrl+r': loadData, 'ctrl+e': handleExport })

  if (!data && !loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden fade-in">
        <TabHeader title="Tổng Quan Doanh Thu" ruleKey="overview" onRefresh={loadData} loading={loading} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
            <p className="text-gray-400">{error || 'Chưa có dữ liệu. Hãy chạy Pipeline trước.'}</p>
          </div>
        </div>
      </div>
    )
  }

  const kpi = data?.kpi || {}
  const trend = data?.trend || []
  const channel = data?.channel || []

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <TabHeader
        title="Tổng Quan Doanh Thu"
        ruleKey="overview"
        onRefresh={loadData}
        onExport={handleExport}
        loading={loading}
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard title="Doanh thu" value={formatCurrency(kpi.revenue, 'EUR')}
            change={kpi.revenueChange} icon={DollarSign} loading={loading} />
          <KPICard title="Đơn hàng" value={formatNumber(kpi.orders)}
            change={kpi.ordersChange} icon={ShoppingCart} loading={loading} />
          <KPICard title="Khách hàng" value={formatNumber(kpi.customers)}
            change={kpi.customersChange} icon={Users} loading={loading} />
          <KPICard title="Giá trị TB đơn hàng" value={formatCurrency(kpi.aov, 'EUR')}
            change={kpi.aovChange} icon={TrendingUp} loading={loading} />
        </div>

        {/* Revenue Trend Chart */}
        <div className="cvy-card">
          <h3 className="font-medium text-sm text-gray-300 mb-4">Xu hướng doanh thu theo tháng</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `${v/1000}K`} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
              <Line type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} name="Doanh thu" />
              <Line type="monotone" dataKey="orders" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} name="Đơn hàng" yAxisId={0} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Performance */}
        <div className="cvy-card">
          <h3 className="font-medium text-sm text-gray-300 mb-4">Doanh thu theo kênh bán hàng</h3>
          <ResponsiveContainer width="100%" height={Math.max(120, channel.length * 50)}>
            <BarChart data={channel} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `${v/1000}K`} />
              <YAxis type="category" dataKey="channel" tick={{ fill: '#d1d5db', fontSize: 12 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Bar dataKey="revenue" fill="#a855f7" radius={[0, 4, 4, 0]} name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
