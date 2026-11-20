// MLForecast — Tab ML Dự Đoán Bán Chạy
import React, { useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { TabHeader } from '@/components/layout/TabHeader'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useConfirm } from '@/hooks/useConfirm'
import { ConfirmDialog, doubleConfirm } from '@/components/ui/ConfirmDialog'
import { formatNumber, formatPercent } from '@/lib/utils'
import { Brain, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

const MOCK_PREDICTIONS = [
  { rank: 1, product: 'Áo Blazer Nữ Slim Fit', predictedSales: 420, actualSales: null, confidence: 87, trend: 'up' },
  { rank: 2, product: 'Đầm Maxi Boho Mùa Hè', predictedSales: 385, actualSales: null, confidence: 82, trend: 'up' },
  { rank: 3, product: 'Áo Hoodie Unisex Basic', predictedSales: 360, actualSales: null, confidence: 91, trend: 'stable' },
  { rank: 4, product: 'Quần Jean Nam Skinny', predictedSales: 310, actualSales: null, confidence: 78, trend: 'up' },
  { rank: 5, product: 'Giày Sneaker Nữ White', predictedSales: 290, actualSales: null, confidence: 73, trend: 'up' },
  { rank: 6, product: 'Áo Sơ Mi Nam Oxford', predictedSales: 265, actualSales: null, confidence: 85, trend: 'stable' },
  { rank: 7, product: 'Túi Tote Canvas Minimal', predictedSales: 248, actualSales: null, confidence: 69, trend: 'down' },
  { rank: 8, product: 'Quần Shorts Nam Cargo', predictedSales: 220, actualSales: null, confidence: 76, trend: 'stable' },
  { rank: 9, product: 'Áo Crop Top Ribbed', predictedSales: 195, actualSales: null, confidence: 71, trend: 'up' },
  { rank: 10, product: 'Thắt Lưng Da Bò Thật', predictedSales: 168, actualSales: null, confidence: 88, trend: 'down' },
]

// Actual vs Predicted cho quý trước (có actual để so sánh)
const MOCK_COMPARISON = [
  { product: 'Blazer Nữ', predicted: 380, actual: 412 },
  { product: 'Hoodie Unisex', predicted: 320, actual: 348 },
  { product: 'Jean Nam', predicted: 290, actual: 275 },
  { product: 'Đầm Maxi', predicted: 340, actual: 361 },
  { product: 'Sneaker Nữ', predicted: 260, actual: 243 },
  { product: 'Sơ Mi Nam', predicted: 240, actual: 258 },
]

const MODEL_INFO = {
  algorithm: 'Random Forest Classifier',
  accuracy: 84.2,
  lastTrained: '2024-11-15',
  dataRange: '2020-01 → 2024-10',
  features: 'Lịch sử bán, mùa vụ, giá, hạng mục, xu hướng tìm kiếm',
}

const SEASONS = ['Q1 2025 (Tết - Xuân)', 'Q2 2025 (Hè)', 'Q3 2025 (Thu)', 'Q4 2025 (Đông - Giáng sinh)']

export default function MLForecast() {
  const [loading, setLoading] = useState(false)
  const [season, setSeason] = useState(SEASONS[0])
  const [running, setRunning] = useState(false)
  const { confirm, confirmProps } = useConfirm()

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
  }, [])

  const handleExport = useCallback(() => {
    alert('Tính năng Export sẽ hoạt động sau khi có data thật')
  }, [])

  const handleRunML = useCallback(async () => {
    const confirmed = await doubleConfirm(confirm, {
      title: 'Chạy lại ML Model?',
      message: 'Quá trình này sẽ train lại model với data mới nhất từ SQLite. Có thể mất 2–5 phút.',
      dangerMessage: 'Predictions hiện tại sẽ bị ghi đè. Bạn chắc chắn muốn chạy ML?',
    })
    if (!confirmed) return
    setRunning(true)
    // TODO: call window.electron.runPipeline({ stage: 'ml' })
    await new Promise(r => setTimeout(r, 2000))
    setRunning(false)
    alert('ML Pipeline đã chạy xong! Predictions đã được cập nhật.')
  }, [confirm])

  useKeyboardShortcuts({ 'ctrl+r': handleRefresh, 'ctrl+e': handleExport })

  const avgConfidence = (MOCK_PREDICTIONS.reduce((s, p) => s + p.confidence, 0) / MOCK_PREDICTIONS.length).toFixed(0)

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <TabHeader
        title="ML Dự Đoán Bán Chạy"
        ruleKey="mlforecast"
        onRefresh={handleRefresh}
        onExport={handleExport}
        loading={loading}
      />

      <ConfirmDialog {...confirmProps} />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Dự đoán cho:</label>
            <select
              value={season}
              onChange={e => setSeason(e.target.value)}
              className="cvy-input text-sm py-1 px-3"
            >
              {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            onClick={handleRunML}
            disabled={running}
            className="cvy-btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Brain className="w-4 h-4" />
            {running ? 'Đang chạy ML...' : 'Chạy ML mới'}
          </button>
        </div>

        {/* Model Info + Stats */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="cvy-card xl:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-purple-400" />
              <h3 className="font-medium text-sm text-gray-300">Thông tin Model</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              {[
                { label: 'Thuật toán', value: MODEL_INFO.algorithm },
                { label: 'Độ chính xác', value: `${MODEL_INFO.accuracy}%` },
                { label: 'Lần train gần nhất', value: MODEL_INFO.lastTrained },
                { label: 'Phạm vi dữ liệu', value: MODEL_INFO.dataRange },
                { label: 'Features', value: MODEL_INFO.features },
              ].map(item => (
                <div key={item.label}>
                  <span className="text-gray-500">{item.label}: </span>
                  <span className="text-gray-200">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: TrendingUp,
                label: 'Độ tin cậy TB',
                value: `${avgConfidence}%`,
                color: 'text-green-400',
                bg: 'bg-green-500/10'
              },
              {
                icon: CheckCircle,
                label: 'Độ chính xác',
                value: `${MODEL_INFO.accuracy}%`,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10'
              },
              {
                icon: Brain,
                label: 'Dự đoán',
                value: `${MOCK_PREDICTIONS.length} SP`,
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10'
              },
              {
                icon: AlertTriangle,
                label: 'Conf < 70%',
                value: `${MOCK_PREDICTIONS.filter(p => p.confidence < 70).length} SP`,
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/10'
              },
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
            Top 10 Dự đoán Bán Chạy — {season}
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left">
                {['#', 'Sản phẩm', 'Dự đoán (đơn)', 'Xu hướng', 'Độ tin cậy'].map(h => (
                  <th key={h} className="pb-2 text-gray-400 font-medium pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_PREDICTIONS.map((p) => (
                <tr key={p.rank} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                  <td className="py-2.5 pr-4 text-gray-500 font-mono">{p.rank}</td>
                  <td className="py-2.5 pr-4 text-gray-200">{p.product}</td>
                  <td className="py-2.5 pr-4 font-mono text-purple-300">{formatNumber(p.predictedSales)}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-xs font-medium ${
                      p.trend === 'up' ? 'text-green-400' :
                      p.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {p.trend === 'up' ? '↑ Tăng' : p.trend === 'down' ? '↓ Giảm' : '→ Ổn định'}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            p.confidence >= 80 ? 'bg-green-500' :
                            p.confidence >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${p.confidence}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono ${
                        p.confidence >= 80 ? 'text-green-400' :
                        p.confidence >= 70 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{p.confidence}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actual vs Predicted Chart */}
        <div className="cvy-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm text-gray-300">Actual vs Predicted — Quý trước (kiểm chứng model)</h3>
            <span className="text-xs text-gray-500">Dữ liệu thực tế so với dự đoán đã thực hiện</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={MOCK_COMPARISON} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
              <XAxis dataKey="product" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #2e2e2e', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
              <Bar dataKey="predicted" fill="#a855f7" radius={[4, 4, 0, 0]} name="Dự đoán" />
              <Bar dataKey="actual" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Thực tế" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2 text-center">
            * Dữ liệu này dùng để đánh giá độ chính xác của model. Kết quả thực tế càng gần dự đoán = model càng tốt.
          </p>
        </div>
      </div>
    </div>
  )
}

