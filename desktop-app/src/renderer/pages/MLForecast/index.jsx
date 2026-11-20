// MLForecast — Tab ML Dự Đoán Bán Chạy (Giao diện AI Workbench riêng biệt — Emerald/Cyan theme)
import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { TabHeader } from '@/components/layout/TabHeader'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useConfirm } from '@/hooks/useConfirm'
import { ConfirmDialog, doubleConfirm } from '@/components/ui/ConfirmDialog'
import {
  Brain, TrendingUp, AlertTriangle, CheckCircle, Sparkles,
  Cpu, Layers, ArrowRight, Activity, ShieldCheck
} from 'lucide-react'

export default function MLForecast() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [running, setRunning] = useState(false)
  const { confirm, confirmProps } = useConfirm()

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await window.electron?.getDashboardData({ tab: 'mlforecast' })
      if (r?.success) setData(r.data); else setError(r?.error)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRunML = useCallback(async () => {
    const confirmed = await doubleConfirm(confirm, {
      title: 'Huấn luyện lại ML Model?',
      message: 'Hệ thống sẽ trích xuất 14 features từ SQLite Gold và huấn luyện lại Random Forest (300 cây).',
      dangerMessage: 'Bảng dự báo ml_predictions và ml_backtest hiện tại sẽ bị ghi đè. Tiếp tục?',
    })
    if (!confirmed) return
    setRunning(true)
    try {
      const result = await window.electron?.runPipeline({ stage: 'ml' })
      if (result?.success) {
        await window.electron?.reloadDatabase()
        await loadData()
      } else {
        alert('ML thất bại: ' + (result?.stderr || result?.error || 'Unknown error'))
      }
    } catch (e) {
      alert('Lỗi: ' + e.message)
    }
    setRunning(false)
  }, [confirm, loadData])

  useKeyboardShortcuts({ 'ctrl+r': loadData })

  const predictions = data?.predictions || []
  const backtest = data?.backtest || []
  const info = data?.modelInfo || null
  const hasData = predictions.length > 0

  if (!hasData && !loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden fade-in">
        <TabHeader title="AI Workbench — Dự Báo Sản Phẩm Bán Chạy" ruleKey="mlforecast" onRefresh={loadData} loading={loading} />
        <ConfirmDialog {...confirmProps} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 p-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/10">
            <Brain className="w-16 h-16 text-emerald-400 mx-auto" />
            <p className="text-gray-300">{error || 'Chưa có kết quả huấn luyện ML. Hãy chạy Pipeline rồi huấn luyện Model.'}</p>
            <button onClick={handleRunML} disabled={running}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium flex items-center gap-2 mx-auto disabled:opacity-50">
              <Brain className="w-4 h-4" /> {running ? 'Đang huấn luyện...' : 'Huấn luyện ML ngay'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const period = predictions.length > 0
    ? `${predictions[0].period_start} → ${predictions[0].period_end}`
    : ''

  const avgConfidence = predictions.length
    ? (predictions.reduce((s, p) => s + (p.confidence || 0), 0) / predictions.length).toFixed(0)
    : 0

  const improvementPct = info && info.baseline_mae > 0
    ? (((info.baseline_mae - info.mae) / info.baseline_mae) * 100).toFixed(1)
    : null

  // Parse top features "price (19%), margin (17%)..."
  const parsedFeatures = (info?.top_features || '').split(',').map(s => {
    const m = s.trim().match(/^(.+?)\s*\((\d+)%\)$/)
    return m ? { name: m[1], pct: Number(m[2]) } : null
  }).filter(Boolean)

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <TabHeader title="AI Workbench — Dự Báo Sản Phẩm Bán Chạy" ruleKey="mlforecast"
        onRefresh={loadData} loading={loading}>
        <button onClick={handleRunML} disabled={running}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm shadow-emerald-900/40">
          <Sparkles className="w-3.5 h-3.5" />
          {running ? 'Đang train model...' : 'Huấn luyện lại Model'}
        </button>
      </TabHeader>
      <ConfirmDialog {...confirmProps} />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* AI Pipeline Banner — Khác biệt hoàn toàn với các tab BI Dashboard */}
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-teal-950/25 to-cyan-950/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Mô hình đang hoạt động</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    READY
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {info?.algorithm || 'Random Forest Regressor'}
                </p>
                <p className="text-xs text-gray-400">
                  Mục tiêu: <span className="text-gray-200">{info?.target}</span> • Kỳ dự báo: <span className="text-emerald-300 font-mono font-semibold">{period}</span>
                </p>
              </div>
            </div>

            {/* Sơ đồ mini luồng ML */}
            <div className="flex items-center gap-2 text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-black/30 border border-gray-700 text-gray-300">
                <span className="text-gray-500 block text-[10px]">Dữ liệu huấn luyện</span>
                <span className="font-mono font-semibold text-white">{info?.n_train_samples || 0} mẫu ({info?.n_periods || 6} kỳ)</span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <div className="px-3 py-1.5 rounded-lg bg-black/30 border border-emerald-500/30 text-emerald-200">
                <span className="text-emerald-400/80 block text-[10px]">Feature Engineering</span>
                <span className="font-mono font-semibold">14 biến đặc trưng</span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-200">
                <span className="text-emerald-300 block text-[10px]">Đầu ra dự báo</span>
                <span className="font-mono font-semibold">Top {predictions.length} sản phẩm</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Thẻ Đánh Giá Mô Hình (Model Evaluation Metrics) + Feature Importance */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Cột trái: 4 chỉ số ML */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-300 font-medium">Sai số MAE (Model)</span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white font-mono my-1">{info ? info.mae : '—'}</p>
              <p className="text-[11px] text-emerald-300/80">
                Baseline MAE: <span className="font-mono">{info?.baseline_mae}</span>
                {improvementPct && ` (Tốt hơn ${improvementPct}%)`}
              </p>
            </div>

            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-cyan-300 font-medium">Độ tin cậy TB</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-white font-mono my-1">{avgConfidence}%</p>
              <p className="text-[11px] text-cyan-300/80">Đồng thuận giữa 300 cây quyết định</p>
            </div>

            <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-teal-300 font-medium">Phạm vi lịch sử</span>
                <Activity className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-sm font-bold text-white font-mono my-1">
                {info ? `${info.data_from} → ${info.data_to}` : '—'}
              </p>
              <p className="text-[11px] text-teal-300/80">Lần train: {info?.trained_at?.replace('T', ' ')}</p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-300 font-medium">Cảnh báo phương sai</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-white font-mono my-1">
                {predictions.filter(p => (p.confidence || 0) < 70).length} SP
              </p>
              <p className="text-[11px] text-amber-300/80">Sản phẩm có độ tin cậy &lt; 70%</p>
            </div>
          </div>

          {/* Cột phải (2 phần): Feature Importance Bar + Giải thích */}
          <div className="xl:col-span-2 cvy-card border-emerald-500/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-sm text-white">Mức độ đóng góp đặc trưng (Top Feature Importances)</h3>
                </div>
                <span className="text-xs text-gray-400">Trích xuất từ `final.feature_importances_`</span>
              </div>
              <div className="space-y-2.5">
                {parsedFeatures.map((f, i) => (
                  <div key={f.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono text-emerald-300">{i + 1}. {f.name}</span>
                      <span className="font-mono text-gray-300">{f.pct}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                        style={{ width: `${Math.min(f.pct * 3.5, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-800">
              Mô hình kết hợp tín hiệu giá (`price`, `margin`), tồn kho (`stock`) và quán tính sức mua (`hist_mean`, `cat_lag1_mean`, `lag1`) để dự báo số lượng bán.
            </p>
          </div>
        </div>

        {/* Bảng Xếp Hạng Dự Báo & Biểu Đồ Backtest */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          {/* Bảng dự báo (3 cột) */}
          <div className="xl:col-span-3 cvy-card border-emerald-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Bảng Xếp Hạng Top {predictions.length} Sản Phẩm Dự Báo Bán Chạy
              </h3>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                Kỳ: {period}
              </span>
            </div>
            <div className="overflow-x-auto max-h-[360px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-dark-2">
                  <tr className="border-b border-gray-700 text-left text-xs">
                    {['Hạng', 'Sản phẩm', 'Danh mục', 'Dự báo (SL)', 'Kỳ trước', 'Xu hướng', 'Độ tin cậy'].map(h => (
                      <th key={h} className="pb-2 text-gray-400 font-medium pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {predictions.slice(0, 20).map((p) => (
                    <tr key={p.rank} className="border-b border-gray-800/80 hover:bg-emerald-500/5 transition-colors">
                      <td className="py-2 pr-3 font-mono text-xs">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold ${
                          p.rank <= 3 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-gray-500'
                        }`}>
                          {p.rank}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-gray-100 font-medium">{p.product_name}</td>
                      <td className="py-2 pr-3 text-gray-400 text-xs">{p.category}</td>
                      <td className="py-2 pr-3 font-mono font-bold text-emerald-300">{Number(p.predicted_qty).toFixed(1)}</td>
                      <td className="py-2 pr-3 font-mono text-gray-400">{Number(p.last_period_qty).toFixed(0)}</td>
                      <td className="py-2 pr-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          p.trend === 'up' ? 'bg-emerald-500/15 text-emerald-300' :
                          p.trend === 'down' ? 'bg-red-500/15 text-red-300' : 'bg-gray-700/50 text-gray-300'
                        }`}>
                          {p.trend === 'up' ? '↑ Tăng' : p.trend === 'down' ? '↓ Giảm' : '→ Ổn định'}
                        </span>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-800 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${
                              (p.confidence || 0) >= 80 ? 'bg-emerald-400' : (p.confidence || 0) >= 70 ? 'bg-cyan-400' : 'bg-amber-400'
                            }`} style={{ width: `${Math.min(p.confidence || 0, 100)}%` }} />
                          </div>
                          <span className="text-xs font-mono text-gray-300">{(p.confidence || 0).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Biểu đồ Backtest kiểm chứng (2 cột) */}
          {backtest.length > 0 && (
            <div className="xl:col-span-2 cvy-card border-cyan-500/20 flex flex-col justify-between">
              <div>
                <div className="mb-3">
                  <h3 className="font-semibold text-sm text-white">Kiểm Chứng Backtest (Dự báo vs Thực tế)</h3>
                  <p className="text-xs text-gray-400">Đối chiếu trên kỳ 14 ngày gần nhất có dữ liệu thật</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={backtest.slice(0, 8)} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                    <XAxis dataKey="product_name" tick={{ fill: '#9ca3af', fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #10b98140', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                    <Bar dataKey="predicted" fill="#10b981" radius={[3, 3, 0, 0]} name="ML Dự báo" />
                    <Bar dataKey="actual" fill="#06b6d4" radius={[3, 3, 0, 0]} name="Thực tế bán" />
                    <Bar dataKey="baseline" fill="#4b5563" radius={[3, 3, 0, 0]} name="Baseline (Kỳ trước)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-800">
                * Cột xanh ngọc (ML Dự báo) bám sát cột xanh dương (Thực tế) tốt hơn so với Baseline ngây thơ.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
