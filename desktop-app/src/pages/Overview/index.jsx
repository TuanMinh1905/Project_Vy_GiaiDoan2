// Overview Dashboard — Tab Tổng Quan Doanh Thu
import React, { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react'
import { TabHeader } from '@/components/layout/TabHeader'
import { KPICard } from '@/components/ui/KPICard'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { formatCurrency, formatNumber, formatPercent, calcChange } from '@/lib/utils'

// === MOCK DATA (thay bằng Electron IPC khi pipeline xong) ===
const MOCK_KPI = {
  revenue: 1245890,       revenueChange: 12.3,
  orders: 8432,           ordersChange: 8.1,
  customers: 3291,        customersChange: 5.7,
  aov: 147.8,             aovChange: 3.9,
}

const MOCK_REVENUE_TREND = [
  { month: 'T1', revenue: 95000, orders: 621 },
  { month: 'T2', revenue: 88000, orders: 589 },
  { month: 'T3', revenue: 112000, orders: 741 },
  { month: 'T4', revenue: 125000, orders: 832 },
  { month: 'T5', revenue: 103000, orders: 695 },
  { month: 'T6', revenue: 134000, orders: 889 },
]

const MOCK_CHANNEL = [
  { channel: 'Website', revenue: 540000, orders: 3650 },
  { channel: 'Mobile App', revenue: 390000, orders: 2810 },
  { channel: 'Social Media', revenue: 198000, orders: 1420 },
  { channel: 'Khác', revenue: 117890, orders: 552 },
]

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
  const [data, setData] = useState({ kpi: MOCK_KPI, trend: MOCK_REVENUE_TREND, channel: MOCK_CHANNEL })
  const [loading, setLoading] = useState(false)

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    try {
      // const result = await window.electron?.getDashboardData({ tab: 'overview' })
      // if (result?.success) setData(result.data)
      await new Promise(r => setTimeout(r, 600)) // simulate
    } finally {
      setLoading(false)
    }
  }, [])

  const handleExport = useCallback(() => {
    // TODO: export CSV
    alert('Tính năng Export sẽ hoạt động sau khi có data thật')
  }, [])

  useKeyboardShortcuts({
    'ctrl+r': handleRefresh,
    'ctrl+e': handleExport,
  })

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <TabHeader
        title="Tổng Quan Doanh Thu"
        ruleKey="overview"
        onRefresh={handleRefresh}
        onExport={handleExport}
        loading={loading}
      />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            title="Doanh thu"
            value={formatCurrency(data.kpi.revenue, 'EUR')}
            change={data.kpi.revenueChange}
            icon={DollarSign}
            loading={loading}
          />
          <KPICard
            title="Đơn hàng"
            value={formatNumber(data.kpi.orders)}
            change={data.kpi.ordersChange}
            icon={ShoppingCart}
            loading={loading}
          />
          <KPICard
            title="Khách hàng"
            value={formatNumber(data.kpi.customers)}
            change={data.kpi.customersChange}
            icon={Users}
            loading={loading}
          />
          <KPICard
            title="Giá trị TB đơn hàng"
            value={formatCurrency(data.kpi.aov, 'EUR')}
            change={data.kpi.aovChange}
            icon={TrendingUp}
            loading={loading}
          />
        </div>

        {/* Revenue Trend Chart */}
        <div className="cvy-card">
          <h3 className="font-medium text-sm text-gray-300 mb-4">Xu hướng doanh thu theo tháng</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `${v/1000}K`} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
              <Line type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} dot={false} name="Doanh thu" />
              <Line type="monotone" dataKey="orders" stroke="#06b6d4" strokeWidth={2} dot={false} name="Đơn hàng" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Performance */}
        <div className="cvy-card">
          <h3 className="font-medium text-sm text-gray-300 mb-4">Doanh thu theo kênh bán hàng</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.channel} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
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
