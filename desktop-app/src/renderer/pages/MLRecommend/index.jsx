// MLRecommend — Tab ML Hệ Thống Gợi Ý Sản Phẩm Hybrid 2 Chiều
// Chế độ 1: Chọn Khách hàng -> Xem hồ sơ, lịch sử đã mua + Top 6 sản phẩm gợi ý (% Match Score & Lý do)
// Chế độ 2: Chọn Sản phẩm -> Xem Top 6 sản phẩm gợi ý mua kèm (Cross-sell / Market Basket Lift) + Bảng Combo Vàng
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { TabHeader } from '@/components/layout/TabHeader'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useConfirm } from '@/hooks/useConfirm'
import { ConfirmDialog, doubleConfirm } from '@/components/ui/ConfirmDialog'
import {
  Sparkles, Brain, UserCheck, ShoppingBag, Package, ArrowRight,
  Search, CheckCircle, Layers, TrendingUp, Tag, Award
} from 'lucide-react'

/**
 * @description Tab ML Hệ Thống Gợi Ý Sản Phẩm Hybrid 2 Chiều
 */
export default function MLRecommend() {
  const [mode, setMode] = useState('customer') // 'customer' | 'product'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [running, setRunning] = useState(false)

  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const searchInputRef = useRef(null)
  const { confirm, confirmProps } = useConfirm()

  const loadData = useCallback(async (custId = selectedCustomerId, prodId = selectedProductId) => {
    setLoading(true); setError(null)
    try {
      const r = await window.electron?.getDashboardData({
        tab: 'mlrecommend',
        customerId: custId,
        productId: prodId,
      })
      if (r?.success) {
        setData(r.data)
        if (!custId && r.data?.selectedCustomerId) setSelectedCustomerId(r.data.selectedCustomerId)
        if (!prodId && r.data?.selectedProductId) setSelectedProductId(r.data.selectedProductId)
      } else {
        setError(r?.error)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [selectedCustomerId, selectedProductId])

  useEffect(() => {
    loadData(null, null)
  }, [])

  const handleSelectCustomer = (cid) => {
    const id = Number(cid)
    setSelectedCustomerId(id)
    loadData(id, selectedProductId)
  }

  const handleSelectProduct = (pid) => {
    const id = Number(pid)
    setSelectedProductId(id)
    loadData(selectedCustomerId, id)
  }

  const handleRunRecommendML = useCallback(async () => {
    const confirmed = await doubleConfirm(confirm, {
      title: 'Huấn luyện lại Hệ thống Gợi ý Hybrid?',
      message: 'Hệ thống sẽ tính toán lại ma trận tương đồng Collaborative Filtering (Cosine), Content Affinity và Market Basket Lift cho 580 khách hàng & 500 sản phẩm.',
      dangerMessage: 'Bảng ml_customer_recommendations và ml_product_affinities hiện tại sẽ bị ghi đè. Tiếp tục?',
    })
    if (!confirmed) return
    setRunning(true)
    try {
      const result = await window.electron?.runPipeline({ stage: 'ml_recommend' })
      if (result?.success) {
        await window.electron?.reloadDatabase()
        await loadData(selectedCustomerId, selectedProductId)
      } else {
        alert('Huấn luyện Recommender thất bại: ' + (result?.stderr || result?.error || 'Unknown error'))
      }
    } catch (e) {
      alert('Lỗi: ' + e.message)
    }
    setRunning(false)
  }, [confirm, loadData, selectedCustomerId, selectedProductId])

  useKeyboardShortcuts({
    'ctrl+r': () => loadData(selectedCustomerId, selectedProductId),
    'ctrl+f': () => searchInputRef.current?.focus(),
  })

  const info = data?.modelInfo || null
  const customers = data?.customers || []
  const products = data?.products || []
  const profile = data?.customerProfile || null
  const history = data?.customerHistory || []
  const customerRecs = data?.customerRecs || []
  const selectedProduct = data?.selectedProduct || null
  const productRecs = data?.productRecs || []
  const topCombos = data?.topCombos || []

  const filteredCustomerOptions = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 120)
    const q = customerSearch.toLowerCase()
    return customers.filter(c =>
      String(c.customer_id).includes(q) ||
      (c.country || '').toLowerCase().includes(q) ||
      (c.cluster_name || '').toLowerCase().includes(q) ||
      (c.fav_category || '').toLowerCase().includes(q)
    ).slice(0, 120)
  }, [customers, customerSearch])

  const filteredProductOptions = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 150)
    const q = productSearch.toLowerCase()
    return products.filter(p =>
      String(p.product_id).includes(q) ||
      (p.product_name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.color || '').toLowerCase().includes(q)
    ).slice(0, 150)
  }, [products, productSearch])

  if (!customers.length && !loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden fade-in">
        <TabHeader title="AI Workbench — Hệ Thống Gợi Ý Sản Phẩm Hybrid 2 Chiều" ruleKey="mlrecommend" onRefresh={() => loadData()} loading={loading} />
        <ConfirmDialog {...confirmProps} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 p-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 max-w-md">
            <Sparkles className="w-16 h-16 text-emerald-400 mx-auto" />
            <p className="text-gray-300 text-sm">
              {error || 'Chưa có dữ liệu gợi ý sản phẩm. Hãy nhấn nút bên dưới để huấn luyện mô hình Hybrid Recommendation.'}
            </p>
            <button onClick={handleRunRecommendML} disabled={running}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium flex items-center gap-2 mx-auto disabled:opacity-50">
              <Brain className="w-4 h-4" /> {running ? 'Đang huấn luyện...' : 'Huấn luyện Recommender ngay'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <ConfirmDialog {...confirmProps} />

      <TabHeader title="AI Workbench — Hệ Thống Gợi Ý Sản Phẩm Hybrid 2 Chiều" ruleKey="mlrecommend" onRefresh={() => loadData(selectedCustomerId, selectedProductId)} loading={loading}>
        <button onClick={handleRunRecommendML} disabled={running}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm shadow-emerald-900/40">
          <Brain className="w-3.5 h-3.5" />
          {running ? 'Đang huấn luyện...' : 'Huấn luyện lại Recommender'}
        </button>
      </TabHeader>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* 1. AI Recommender Banner + 2-Mode Switcher */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-teal-950/25 to-cyan-950/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    HYBRID RECOMMENDER ENGINE
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    Huấn luyện lúc: {info?.trained_at?.replace('T', ' ') || 'N/A'}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mt-1">
                  {info?.algorithm || 'Hybrid Recommendation (Collaborative Filtering + Content Cosine + Market Basket)'}
                </h2>
                <p className="text-xs text-gray-300 mt-0.5">
                  Cá nhân hóa <strong className="text-emerald-300">{info?.total_customer_recs || 3480}</strong> gợi ý cho <strong className="text-emerald-300">{info?.n_customers_covered || 580}</strong> khách mua & <strong className="text-cyan-300">{info?.total_product_pairs || 3000}</strong> cặp sản phẩm mua kèm.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-black/30 border border-emerald-500/20 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-mono">Match Score TB</p>
                <p className="text-lg font-bold text-emerald-400 font-mono">{info?.avg_match_score || 85}%</p>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-black/30 border border-emerald-500/20 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-mono">Độ phủ Catalog</p>
                <p className="text-lg font-bold text-cyan-400 font-mono">{info?.catalog_coverage_pct || 0}%</p>
              </div>
            </div>
          </div>

          {/* 2-Way Mode Toggle Bar */}
          <div className="mt-4 pt-4 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex p-1 rounded-xl bg-gray-950/80 border border-gray-800">
              <button
                onClick={() => setMode('customer')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'customer'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Chế độ 1: Gợi Ý Theo Khách Hàng (Customer → Top 6 Sản Phẩm)
              </button>
              <button
                onClick={() => setMode('product')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'product'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Chế độ 2: Gợi Ý Mua Kèm Theo Sản Phẩm (Cross-sell / Market Basket)
              </button>
            </div>
            <span className="text-xs text-gray-400">
              Phím tắt: <code className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">Ctrl+F</code> để tìm nhanh {mode === 'customer' ? 'Khách hàng' : 'Sản phẩm'}
            </span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* MODE 1: CUSTOMER-TO-PRODUCT PERSONALIZED RECOMMENDATION               */}
        {/* ===================================================================== */}
        {mode === 'customer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column (4 cols): Customer Selector + Profile 360 + Purchase History */}
            <div className="lg:col-span-5 space-y-4">
              {/* Customer Picker Card */}
              <div className="rounded-xl border border-gray-800 bg-surface-dark-2 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    1. Chọn Khách Hàng Cần Gợi Ý
                  </h3>
                  <span className="text-[11px] font-mono text-gray-400">{customers.length} khách đã mua</span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Lọc theo mã KH, quốc gia, cụm, danh mục... (Ctrl+F)"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-xs text-gray-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <select
                  value={selectedCustomerId || ''}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-emerald-500/40 text-xs font-medium text-white focus:outline-none focus:border-emerald-400"
                >
                  {filteredCustomerOptions.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      KH #{c.customer_id} — {c.country} ({c.age_range}) — {c.cluster_name} — CLV: {c.total_revenue}€ ({c.order_count} đơn)
                    </option>
                  ))}
                </select>

                {/* Customer 360 Profile Summary */}
                {profile && (
                  <div className="p-3.5 rounded-xl bg-black/30 border border-gray-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-white">Khách hàng #{profile.customer_id}</span>
                        <span className="ml-2 text-xs text-gray-400">({profile.country} • {profile.age_range} tuổi)</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {profile.cluster_name || profile.segment}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                      <div className="p-2 rounded-lg bg-gray-900/80 border border-gray-800">
                        <span className="text-[10px] text-gray-400 block">Tổng chi tiêu</span>
                        <span className="font-mono font-bold text-emerald-300">{profile.total_revenue} €</span>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-900/80 border border-gray-800">
                        <span className="text-[10px] text-gray-400 block">Số đơn / AOV</span>
                        <span className="font-mono font-bold text-white">{profile.order_count} đơn • {profile.avg_order_value}€</span>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-900/80 border border-gray-800">
                        <span className="text-[10px] text-gray-400 block">Danh mục Gu</span>
                        <span className="font-semibold text-cyan-300">{profile.fav_category || 'Đa dạng'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Purchase History Card */}
              <div className="rounded-xl border border-gray-800 bg-surface-dark-2 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-400" />
                    Lịch Sử Đã Mua Của KH #{selectedCustomerId} ({history.length} món)
                  </h3>
                </div>
                <div className="max-h-[330px] overflow-y-auto scrollbar-thin divide-y divide-gray-800/70">
                  {history.map((h, i) => (
                    <div key={`${h.sale_id}-${h.product_id}-${i}`} className="px-4 py-2.5 hover:bg-gray-800/40 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <p className="font-medium text-white">
                          {h.product_name}
                          <span className="ml-1.5 text-[11px] text-gray-400 font-mono">(#{h.product_id})</span>
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {h.category} • Màu <span className="text-gray-300">{h.color}</span> • Size {h.size} • Ngày {h.sale_date}
                        </p>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <p className="font-semibold text-gray-200">{h.revenue} €</p>
                        <p className="text-[10px] text-gray-400">SL: {h.quantity} × {h.unit_price}€</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (7 cols): Top 6 Personalized Product Recommendations */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-xl border border-gray-800 bg-surface-dark-2 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Top 6 Sản Phẩm AI Gợi Ý Riêng Cho Khách Hàng #{selectedCustomerId}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Loại trừ các sản phẩm khách đã mua • Sắp xếp theo độ phù hợp (% Match Score) từ Collaborative Filtering & Content Affinity
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {customerRecs.map((rec) => (
                    <div
                      key={rec.product_id}
                      className="rounded-xl border border-gray-800 hover:border-emerald-500/40 bg-gray-900/70 p-3.5 flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            TOP #{rec.rank}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-20 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                                style={{ width: `${Math.min(rec.match_score, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              {rec.match_score}% Match
                            </span>
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-white leading-snug">
                          {rec.product_name}
                          <span className="ml-1.5 text-xs font-mono text-gray-500">#{rec.product_id}</span>
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-300">
                          <span className="px-2 py-0.5 rounded bg-gray-800 text-cyan-300 font-medium">
                            {rec.category}
                          </span>
                          <span>Màu: <strong>{rec.color}</strong></span>
                          <span>• Size: <strong>{rec.size}</strong></span>
                          <span className="ml-auto font-mono font-bold text-white text-sm">
                            {rec.catalog_price} €
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-gray-800/80 flex items-start justify-between gap-2">
                        <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                          <strong className="text-emerald-400">Lý do AI gợi ý:</strong> {rec.reason}
                        </p>
                        <button
                          onClick={() => {
                            setMode('product')
                            handleSelectProduct(rec.product_id)
                          }}
                          title="Xem gợi ý mua kèm cho sản phẩm này"
                          className="shrink-0 text-[10px] font-mono px-2 py-1 rounded bg-gray-800 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 border border-gray-700 transition-colors"
                        >
                          Mua kèm →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Match Score Comparison Bar Chart */}
              <div className="rounded-xl border border-gray-800 bg-surface-dark-2 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3">
                  Biểu Đồ So Sánh Độ Phù Hợp (% Match Score) — KH #{selectedCustomerId}
                </h4>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customerRecs} layout="vertical" margin={{ top: 0, right: 24, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} unit="%" stroke="#9ca3af" fontSize={11} />
                      <YAxis type="category" dataKey="product_name" width={140} stroke="#d1d5db" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: 8, fontSize: 12 }}
                        formatter={(val) => [`${val}% Phù hợp`, 'Match Score']}
                      />
                      <Bar dataKey="match_score" radius={[0, 6, 6, 0]}>
                        {customerRecs.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? '#10b981' : i < 3 ? '#06b6d4' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODE 2: PRODUCT-TO-PRODUCT CROSS-SELL / MARKET BASKET                 */}
        {/* ===================================================================== */}
        {mode === 'product' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left (4 cols): Source Product Selector */}
              <div className="lg:col-span-4 rounded-xl border border-gray-800 bg-surface-dark-2 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    1. Chọn Sản Phẩm Đang Xem / Trong Giỏ
                  </h3>
                  <span className="text-[11px] font-mono text-gray-400">500 Sản phẩm</span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Tìm tên SP, mã SP, danh mục, màu... (Ctrl+F)"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <select
                  value={selectedProductId || ''}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-cyan-500/40 text-xs font-medium text-white focus:outline-none focus:border-cyan-400"
                >
                  {filteredProductOptions.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      #{p.product_id} — {p.product_name} ({p.category} • {p.color}) — {p.catalog_price}€ (Đã bán: {p.total_quantity})
                    </option>
                  ))}
                </select>

                {selectedProduct && (
                  <div className="p-4 rounded-xl bg-black/30 border border-cyan-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        SẢN PHẨM GỐC #{selectedProduct.product_id}
                      </span>
                      <span className="text-sm font-mono font-bold text-white">
                        {selectedProduct.catalog_price} €
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{selectedProduct.product_name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Danh mục: <strong className="text-gray-200">{selectedProduct.category}</strong> • Màu: <strong className="text-gray-200">{selectedProduct.color}</strong> • Size: <strong className="text-gray-200">{selectedProduct.size}</strong>
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                      <div className="p-2 rounded-lg bg-gray-900/80 border border-gray-800">
                        <span className="text-[10px] text-gray-400 block">Đã bán</span>
                        <span className="font-mono font-bold text-cyan-300">{selectedProduct.total_quantity} chiếc</span>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-900/80 border border-gray-800">
                        <span className="text-[10px] text-gray-400 block">Doanh thu</span>
                        <span className="font-mono font-bold text-emerald-300">{selectedProduct.total_revenue} €</span>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-900/80 border border-gray-800">
                        <span className="text-[10px] text-gray-400 block">Biên LN / Tồn</span>
                        <span className="font-mono font-bold text-white">{selectedProduct.margin_pct}% • {selectedProduct.stock_quantity}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right (8 cols): Top 6 Cross-sell Recommendations for Selected Product */}
              <div className="lg:col-span-8 rounded-xl border border-gray-800 bg-surface-dark-2 p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-cyan-400" />
                    Top 6 Sản Phẩm Gợi Ý Mua Kèm (Cross-sell / Bundle) Với "{selectedProduct?.product_name}"
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Tính toán từ tần suất xuất hiện chung trong giỏ hàng (Market Basket Lift) + độ tương đồng hành vi khách mua
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {productRecs.map((rec) => (
                    <div
                      key={rec.recommended_product_id}
                      onClick={() => handleSelectProduct(rec.recommended_product_id)}
                      className="rounded-xl border border-gray-800 hover:border-cyan-500/40 bg-gray-900/70 p-3.5 cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            MUA KÈM #{rec.rank}
                          </span>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                              Lift {rec.lift}x
                            </span>
                            <span className="text-emerald-400 font-bold">{rec.match_score}%</span>
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-white">
                          {rec.recommended_product_name}
                          <span className="ml-1.5 text-xs font-mono text-gray-500">#{rec.recommended_product_id}</span>
                        </h4>

                        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-300">
                          <span className="px-2 py-0.5 rounded bg-gray-800 text-cyan-300">{rec.recommended_category}</span>
                          <span>Màu: <strong>{rec.recommended_color}</strong></span>
                          <span>• Size: <strong>{rec.recommended_size}</strong></span>
                          <span className="ml-auto font-mono font-bold text-white">{rec.catalog_price} €</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-gray-800/80 text-[11px] text-cyan-300/90">
                        <strong>Insight giỏ hàng:</strong> {rec.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Table: Top Store-Wide Product Combos (Market Basket Leaders) */}
            <div className="rounded-xl border border-gray-800 bg-surface-dark-2 overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Bảng "Combo Vàng" Toàn Cửa Hàng — Top Cặp Sản Phẩm Mua Kèm Hiệu Quả Nhất
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Dùng để thiết kế chương trình "Mua Kèm Deal Sốc" hoặc đóng gói Combo giảm giá trên E-commerce & App Mobile
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-900/90 text-gray-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Sản Phẩm Chính (A)</th>
                      <th className="py-2.5 px-4">Sản Phẩm Gợi Ý Mua Kèm (B)</th>
                      <th className="py-2.5 px-3 text-center">Lượt Mua Kết Hợp</th>
                      <th className="py-2.5 px-3 text-center">Hệ Số Nâng (Lift)</th>
                      <th className="py-2.5 px-3 text-center">Độ Hợp Cạ</th>
                      <th className="py-2.5 px-4">Lý Do Kết Hợp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/70">
                    {topCombos.map((c, idx) => (
                      <tr
                        key={`${c.source_product_id}-${c.recommended_product_id}-${idx}`}
                        onClick={() => handleSelectProduct(c.source_product_id)}
                        className="hover:bg-gray-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-4 font-medium text-white">
                          {c.source_product_name} <span className="text-gray-500 font-mono">(#{c.source_product_id} • {c.source_category})</span>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-cyan-300">
                          {c.recommended_product_name} <span className="text-gray-400 font-mono">(#{c.recommended_product_id} • {c.recommended_category})</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-white">
                          {c.co_occurrence} lượt
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                            {c.lift}x
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">
                          {c.match_score}%
                        </td>
                        <td className="py-2.5 px-4 text-gray-300">{c.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

