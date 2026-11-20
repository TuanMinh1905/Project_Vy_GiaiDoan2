// MLClustering — Tab ML Phân Cụm Khách Hàng Đa Chiều (K-Means + PCA 2D + Silhouette Score)
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, Legend
} from 'recharts'
import { TabHeader } from '@/components/layout/TabHeader'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useConfirm } from '@/hooks/useConfirm'
import { ConfirmDialog, doubleConfirm } from '@/components/ui/ConfirmDialog'
import { exportToCSV } from '@/lib/utils'
import {
  Network, Brain, Users, Sparkles, Search, Download,
  Target, TrendingUp, Tag, Smartphone, CheckCircle2, Layers
} from 'lucide-react'

const CLUSTER_COLORS = {
  emerald: { hex: '#10b981', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40', card: 'border-emerald-500/40 bg-emerald-950/15' },
  amber:   { hex: '#f59e0b', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',     card: 'border-amber-500/40 bg-amber-950/15' },
  cyan:    { hex: '#06b6d4', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',         card: 'border-cyan-500/40 bg-cyan-950/15' },
  rose:    { hex: '#f43f5e', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/40',         card: 'border-rose-500/40 bg-rose-950/15' },
}

/**
 * @description Tab ML Phân Cụm Khách Hàng Đa Chiều (K-Means + PCA 2D)
 */
export default function MLClustering() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [running, setRunning] = useState(false)
  const [selectedCluster, setSelectedCluster] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const searchRef = useRef(null)
  const { confirm, confirmProps } = useConfirm()

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await window.electron?.getDashboardData({ tab: 'mlclustering' })
      if (r?.success) setData(r.data); else setError(r?.error)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRunClusterML = useCallback(async () => {
    const confirmed = await doubleConfirm(confirm, {
      title: 'Huấn luyện lại K-Means Phân Cụm Khách Hàng?',
      message: 'Hệ thống sẽ trích xuất 8 chiều hành vi của khách hàng từ SQLite Gold, chuẩn hóa StandardScaler, chạy K-Means (K=2..6) và chiếu PCA 2D.',
      dangerMessage: 'Bảng kết quả ml_customer_clusters và ml_cluster_summary hiện tại sẽ bị ghi đè. Tiếp tục?',
    })
    if (!confirmed) return
    setRunning(true)
    try {
      const result = await window.electron?.runPipeline({ stage: 'ml_cluster' })
      if (result?.success) {
        await window.electron?.reloadDatabase()
        await loadData()
      } else {
        alert('Huấn luyện K-Means thất bại: ' + (result?.stderr || result?.error || 'Unknown error'))
      }
    } catch (e) {
      alert('Lỗi: ' + e.message)
    }
    setRunning(false)
  }, [confirm, loadData])

  const customers = data?.customers || []
  const summary = data?.summary || []
  const kScores = data?.kScores || []
  const info = data?.modelInfo || null

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (selectedCluster !== 'ALL' && c.cluster_name !== selectedCluster) return false
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        return (
          String(c.customer_id).includes(q) ||
          (c.country || '').toLowerCase().includes(q) ||
          (c.cluster_name || '').toLowerCase().includes(q) ||
          (c.fav_category || '').toLowerCase().includes(q) ||
          (c.segment || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [customers, selectedCluster, searchTerm])

  const handleExport = useCallback(() => {
    if (!filteredCustomers.length) return
    exportToCSV(filteredCustomers, 'ml_customer_kmeans_clusters.csv')
  }, [filteredCustomers])

  useKeyboardShortcuts({
    'ctrl+r': loadData,
    'ctrl+f': () => searchRef.current?.focus(),
    'ctrl+e': handleExport,
  })

  if (!customers.length && !loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden fade-in">
        <TabHeader title="AI Workbench — Phân Cụm Khách Hàng Đa Chiều (K-Means & PCA)" ruleKey="mlclustering" onRefresh={loadData} loading={loading} />
        <ConfirmDialog {...confirmProps} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 p-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 max-w-md">
            <Network className="w-16 h-16 text-emerald-400 mx-auto" />
            <p className="text-gray-300 text-sm">
              {error || 'Chưa có dữ liệu phân cụm K-Means. Hãy nhấn nút bên dưới để huấn luyện mô hình.'}
            </p>
            <button onClick={handleRunClusterML} disabled={running}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium flex items-center gap-2 mx-auto disabled:opacity-50">
              <Brain className="w-4 h-4" /> {running ? 'Đang huấn luyện K-Means...' : 'Huấn luyện K-Means ngay'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <ConfirmDialog {...confirmProps} />

      <TabHeader title="AI Workbench — Phân Cụm Khách Hàng Đa Chiều (K-Means & PCA)" ruleKey="mlclustering" onRefresh={loadData} loading={loading}>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700 transition-colors">
          <Download className="w-3.5 h-3.5" /> Xuất CSV (Ctrl+E)
        </button>
        <button onClick={handleRunClusterML} disabled={running}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm shadow-emerald-900/40">
          <Brain className="w-3.5 h-3.5" />
          {running ? 'Đang chạy K-Means...' : 'Huấn luyện lại K-Means'}
        </button>
      </TabHeader>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* 1. AI Model Engine Header Banner */}
        <div className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-teal-950/25 to-cyan-950/30 p-5 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Network className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    UNSUPERVISED ML ENGINE
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    Huấn luyện lúc: {info?.trained_at?.replace('T', ' ') || 'N/A'}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mt-1">
                  {info?.algorithm || 'K-Means Clustering (scikit-learn) + PCA 2D Projection'}
                </h2>
                <p className="text-xs text-gray-300 mt-0.5">
                  8 chiều đặc trưng chuẩn hóa StandardScaler: <span className="text-emerald-300 font-mono">{info?.features_used}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-black/30 border border-emerald-500/20 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-mono">Số cụm (K)</p>
                <p className="text-lg font-bold text-emerald-400 font-mono">{info?.n_clusters || 4} Cụm</p>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-black/30 border border-emerald-500/20 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-mono">Silhouette Score</p>
                <p className="text-lg font-bold text-cyan-400 font-mono">{info?.silhouette_score || '—'}</p>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-black/30 border border-emerald-500/20 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-mono">Khách mua phân cụm</p>
                <p className="text-lg font-bold text-white font-mono">
                  {info?.n_buyers_clustered || customers.length} <span className="text-xs text-gray-400 font-normal">/ {info?.n_total_customers || 1000}</span>
                </p>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-black/30 border border-emerald-500/20 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-mono">Phương sai PCA 2D</p>
                <p className="text-lg font-bold text-amber-300 font-mono">{info?.pca_explained_var_pct || 0}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Top Charts Row: Silhouette Score Evaluation + 2D PCA Cluster Scatter Plot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Silhouette Score by K */}
          <div className="lg:col-span-4 rounded-xl border border-gray-800 bg-surface-dark-2 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-200">
                  Đánh Giá Số Cụm (Silhouette Score)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                K = 2..6
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">
              So sánh độ tách biệt Silhouette giữa các số cụm K. Mô hình chọn <strong className="text-emerald-300">K = 4</strong> để tách rõ 4 chân dung hành vi CSKH.
            </p>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kScores} margin={{ top: 10, right: 12, left: -12, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="k" tickFormatter={(v) => `K=${v}`} stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: 8, fontSize: 12 }}
                    formatter={(val, name, props) => [
                      `${val} (Inertia: ${props.payload.inertia})`,
                      'Silhouette Score'
                    ]}
                    labelFormatter={(k) => `Số cụm K = ${k}`}
                  />
                  <Bar dataKey="silhouette" radius={[6, 6, 0, 0]}>
                    {kScores.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.is_selected ? '#10b981' : '#374151'}
                        stroke={entry.is_selected ? '#34d399' : 'none'}
                        strokeWidth={entry.is_selected ? 1.5 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: 2D PCA Scatter Map */}
          <div className="lg:col-span-8 rounded-xl border border-gray-800 bg-surface-dark-2 p-4 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-200">
                  Bản Đồ Phân Tán Cụm 2D (PCA Projection — 580 Khách Mua)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedCluster('ALL')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                    selectedCluster === 'ALL'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-gray-800/70 text-gray-400 border-gray-700 hover:text-gray-200'
                  }`}
                >
                  Tất cả ({customers.length})
                </button>
                {summary.map((s) => {
                  const active = selectedCluster === s.cluster_name
                  const cStyle = CLUSTER_COLORS[s.badge_color] || CLUSTER_COLORS.emerald
                  return (
                    <button
                      key={s.cluster_id}
                      onClick={() => setSelectedCluster(active ? 'ALL' : s.cluster_name)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                        active ? cStyle.badge : 'bg-gray-800/70 text-gray-400 border-gray-700 hover:text-gray-200'
                      }`}
                    >
                      {s.cluster_name.split(' (')[0]} ({s.customer_count})
                    </button>
                  )
                })}
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mb-2">
              Mỗi điểm là 1 khách hàng trên mặt phẳng 2 thành phần chính (PCA X & PCA Y). Rê chuột vào từng điểm để xem hồ sơ chi tiêu của khách đó.
            </p>
            <div className="flex-1 min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis type="number" dataKey="pca_x" name="PCA 1" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis type="number" dataKey="pca_y" name="PCA 2" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <ZAxis type="number" dataKey="total_revenue" range={[35, 220]} name="CLV" />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="rounded-xl border border-gray-700 bg-gray-950/95 p-3 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">
                            Khách hàng #{d.customer_id} ({d.country} • {d.age_range} tuổi)
                          </p>
                          <p className="text-emerald-300 font-medium">{d.cluster_name}</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pt-1 text-gray-300 font-mono text-[11px]">
                            <span>CLV: <strong>{d.total_revenue?.toFixed(2)} €</strong></span>
                            <span>Số đơn: <strong>{d.order_count} đơn</strong></span>
                            <span>Recency: <strong>{d.recency_days} ngày</strong></span>
                            <span>Săn Sale: <strong>{d.discount_pct}%</strong></span>
                            <span>Kênh: <strong>{d.preferred_channel}</strong></span>
                            <span>Gu: <strong>{d.fav_category}</strong></span>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {summary.map((s) => {
                    if (selectedCluster !== 'ALL' && selectedCluster !== s.cluster_name) return null
                    const cStyle = CLUSTER_COLORS[s.badge_color] || CLUSTER_COLORS.emerald
                    const points = customers.filter(c => c.cluster_id === s.cluster_id)
                    return (
                      <Scatter
                        key={s.cluster_id}
                        name={s.cluster_name}
                        data={points}
                        fill={cStyle.hex}
                        fillOpacity={0.82}
                      />
                    )
                  })}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 3. Cluster Persona Cards + Actionable CRM Strategy */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Hồ Sơ 4 Cụm Hành Vi & Gợi Ý Chiến Dịch CSKH Tự Động (Nhấp vào thẻ để lọc)
            </h3>
            {selectedCluster !== 'ALL' && (
              <button
                onClick={() => setSelectedCluster('ALL')}
                className="text-xs text-emerald-400 hover:underline"
              >
                Bỏ lọc cụm ({selectedCluster})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {summary.map((s) => {
              const cStyle = CLUSTER_COLORS[s.badge_color] || CLUSTER_COLORS.emerald
              const isSelected = selectedCluster === s.cluster_name
              return (
                <div
                  key={s.cluster_id}
                  onClick={() => setSelectedCluster(isSelected ? 'ALL' : s.cluster_name)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? `${cStyle.card} ring-2 ring-emerald-400/50`
                      : 'border-gray-800 bg-surface-dark-2 hover:border-gray-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cStyle.badge}`}>
                        Cụm #{s.cluster_id + 1} • {s.customer_count} KH
                      </span>
                      <span className="text-xs font-mono text-gray-400">
                        {s.revenue_share_pct}% Doanh thu
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-2 leading-snug">
                      {s.cluster_name}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-black/25 border border-gray-800/80 text-xs mb-3">
                      <div>
                        <span className="text-[10px] text-gray-400 block">CLV Trung bình</span>
                        <span className="font-mono font-bold text-white">{s.avg_revenue} €</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">Số đơn / AOV</span>
                        <span className="font-mono font-bold text-gray-200">{s.avg_orders} đơn • {s.avg_aov}€</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">Tỷ lệ săn Sale</span>
                        <span className="font-mono font-bold text-amber-300">{s.avg_discount_pct}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">Recency / App</span>
                        <span className="font-mono font-bold text-cyan-300">{s.avg_recency}d • {s.avg_app_pct}% App</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-300 leading-relaxed mb-2.5">
                      <strong className="text-gray-200">Đặc trưng: </strong>{s.key_trait}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-gray-800/80">
                    <p className="text-[11px] text-emerald-300 leading-relaxed flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                      <span><strong>Hành động CSKH:</strong> {s.recommended_action}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 4. Customer Clustering Table (with comparison against traditional Rule-based RFM) */}
        <div className="rounded-xl border border-gray-800 bg-surface-dark-2 overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Danh Sách Khách Hàng Đã Phân Cụm ({filteredCustomers.length} khách)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                So sánh trực tiếp giữa <strong className="text-emerald-300">Cụm K-Means Đa Chiều (ML)</strong> và <strong className="text-purple-300">Phân khúc RFM truyền thống (Luật cố định)</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm mã KH, quốc gia, danh mục... (Ctrl+F)"
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 w-64"
                />
              </div>
              <select
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-xs text-gray-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Tất cả cụm ML ({customers.length})</option>
                {summary.map((s) => (
                  <option key={s.cluster_id} value={s.cluster_name}>
                    {s.cluster_name} ({s.customer_count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[360px] scrollbar-thin">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-900/90 text-gray-400 uppercase font-mono text-[10px] sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Mã KH</th>
                  <th className="py-2.5 px-3">Quốc Gia / Tuổi</th>
                  <th className="py-2.5 px-3">Cụm K-Means (ML)</th>
                  <th className="py-2.5 px-3">RFM Truyền Thống</th>
                  <th className="py-2.5 px-3 text-right">Tổng Chi Tiêu</th>
                  <th className="py-2.5 px-3 text-center">Số Đơn</th>
                  <th className="py-2.5 px-3 text-center">Recency</th>
                  <th className="py-2.5 px-3 text-center">Tỷ Lệ Săn Sale</th>
                  <th className="py-2.5 px-3">Kênh & Danh Mục Gu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/70">
                {filteredCustomers.slice(0, 120).map((c) => {
                  const cStyle = CLUSTER_COLORS[c.badge_color] || CLUSTER_COLORS.emerald
                  return (
                    <tr key={c.customer_id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-white">#{c.customer_id}</td>
                      <td className="py-2.5 px-3 text-gray-300">
                        {c.country} <span className="text-gray-500 font-mono">({c.age_range})</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${cStyle.badge}`}>
                          {c.cluster_name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[11px]">
                          {c.segment}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-300">
                        {Number(c.total_revenue).toFixed(2)} €
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-gray-200">{c.order_count}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-gray-300">{c.recency_days} ngày</td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className={c.discount_pct > 20 ? 'text-amber-300 font-bold' : 'text-gray-400'}>
                          {c.discount_pct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-300">
                        <span className="text-cyan-300">{c.preferred_channel}</span> • {c.fav_category}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

