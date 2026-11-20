// MLForecast — Tab ML Dự Đoán Bán Chạy (DỮ LIỆU THẬT từ SQLite)
import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { TabHeader } from '@/components/layout/TabHeader'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useConfirm } from '@/hooks/useConfirm'
import { ConfirmDialog, doubleConfirm } from '@/components/ui/ConfirmDialog'
import { formatNumber } from '@/lib/utils'
import { Brain, TrendingUp, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'

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
      title: 'Chạy lại ML Model?',
      message: 'Quá trình này sẽ train lại model với data mới nhất từ SQLite.',
      dangerMessage: 'Predictions hiện tại sẽ bị ghi đè. Bạn chắc chắn?',
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

  const handleExport = useCallback(() => { alert('Tính năng Export sẽ được phát triển sau') }, [])

  useKeyboardShortcuts({ 'ctrl+r': loadData, 'ctrl+e': handleExport })

  const predictions = data?.predictions || []
  const backtest = data?.backtest || []
  const info = data?.modelInfo || null
  const hasData = predictions.length > 0

  if (!hasData && !loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden fade-in">
        <TabHeader title="ML Dự Đoán Bán Chạy" ruleKey="mlforecast" onRefresh={loadData} loading={loading} />
        <ConfirmDialog {...confirmProps} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Brain className="w-16 h-16 text-purple-500 mx-auto" />
            <p className="text-gray-400">{error || 'Chưa có kết quả ML. Hãy chạy Pipeline rồi chạy ML.'}</p>
            <button onClick={handleRunML} disabled={running}
              className="cvy-btn-primary flex items-center gap-2 mx-auto disabled:opacity-50">
              <Brain className="w-4 h-4" /> {running ? 'Đang chạy...' : 'Chạy ML'}
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

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <TabHeader title="ML Dự Đoán Bán Chạy" ruleKey="mlforecast"
        onRefresh={loadData} onExport={handleExport} loading={loading} />
      <ConfirmDialog {...confirmProps} />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-xs text-gray-400">
            Dự đoán cho kỳ: <span className="text-white font-medium">{period}</span>
          </div>
          <button onClick={handleRunML} disabled={running}
            className="cvy-btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Brain className="w-4 h-4" /> {running ? 'Đang chạy ML...' : 'Chạy ML mới'}
          </button>
        </div>

        {/* Model Info + Stats */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="cvy-card xl:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-purple-400" />
              <h3 className="font-medium text-sm text-gray-300">Thông tin Model</h3>
            </div>
            {info ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                {[
                  { label: 'Thuật toán', value: info.algorithm },
                  { label: 'Mục tiêu', value: info.target },
                  { label: 'MAE', value: `${info.mae} (baseline: ${info.baseline_mae})` },
                  { label: 'R² Score', value: info.r2 },
                  { label: `Top ${info.top_n} Hit Rate`, value: `${info.top_n_hit_pct}%` },
                  { label: 'Phạm vi dữ liệu', value: `${info.data_from} → ${info.data_to}` },
                  { label: 'Số mẫu train', value: info.n_train_samples },
                  { label: 'Top features', value: info.top_features },
                  { label: 'Lần train', value: info.trained_at },
                ].map(item => (
                  <div key={item.label}>
                    <span className="text-gray-500">{item.label}: </span>
                    <span className="text-gray-200">{item.value}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-gray-500">Không có thông tin model</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: TrendingUp, label: 'Độ tin cậy TB', value: `${avgConfidence}%`, color: 'text-green-400', bg: 'bg-green-500/10' },
              { icon: CheckCircle, label: 'MAE', value: info ? `${info.mae}` : '—', color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { icon: Brain, label: 'Dự đoán', value: `${predictions.length} SP`, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { icon: AlertTriangle, label: 'Conf < 70%', value: `${predictions.filter(p => (p.confidence || 0) < 70).length} SP`, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            ].map(stat => (
              <div key={stat.label} className={`cvy-card ${stat.bg} flex flex-col gap-1`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Predictions Table */}
        <div className="cvy-card">
          <h3 className="font-medium text-sm text-gray-300 mb-4">
            Top {predictions.length} Dự đoán Bán Chạy — {period}
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left">
                {['#', 'Sản phẩm', 'Danh mục', 'Dự đoán (SL)', 'Kỳ trước', 'Xu hướng', 'Độ tin cậy'].map(h => (
                  <th key={h} className="pb-2 text-gray-400 font-medium pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {predictions.slice(0, 20).map((p) => (
                <tr key={p.rank} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                  <td className="py-2.5 pr-4 text-gray-500 font-mono">{p.rank}</td>
                  <td className="py-2.5 pr-4 text-gray-200">{p.product_name}</td>
                  <td className="py-2.5 pr-4 text-gray-400 text-xs">{p.category}</td>
                  <td className="py-2.5 pr-4 font-mono text-purple-300">{Number(p.predicted_qty).toFixed(1)}</td>
                  <td className="py-2.5 pr-4 font-mono text-gray-400">{Number(p.last_period_qty).toFixed(0)}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-xs font-medium ${
                      p.trend === 'up' ? 'text-green-400' : p.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {p.trend === 'up' ? '↑ Tăng' : p.trend === 'down' ? '↓ Giảm' : '→ Ổn định'}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-700 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${
                          (p.confidence || 0) >= 80 ? 'bg-green-500' : (p.confidence || 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} style={{ width: `${Math.min(p.confidence || 0, 100)}%` }} />
                      </div>
                      <span className={`text-xs font-mono ${
                        (p.confidence || 0) >= 80 ? 'text-green-400' : (p.confidence || 0) >= 70 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{(p.confidence || 0).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actual vs Predicted Chart (Backtest) */}
        {backtest.length > 0 && (
          <div className="cvy-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm text-gray-300">Backtest — Actual vs Predicted (kỳ gần nhất)</h3>
              <span className="text-xs text-gray-500">Kiểm chứng model trên dữ liệu đã biết</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={backtest.slice(0, 10)} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                <XAxis dataKey="product_name" tick={{ fill: '#9ca3af', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2e2e2e', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                <Bar dataKey="predicted" fill="#a855f7" radius={[4, 4, 0, 0]} name="Dự đoán" />
                <Bar dataKey="actual" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Thực tế" />
                <Bar dataKey="baseline" fill="#4b5563" radius={[4, 4, 0, 0]} name="Baseline (kỳ trước)" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2 text-center">
              * Dự đoán càng gần thực tế = model càng tốt. Baseline = "kỳ sau = kỳ trước".
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
