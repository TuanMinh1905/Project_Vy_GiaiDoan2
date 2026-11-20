// Pipeline Control Tab — Trung tâm vận hành hệ thống (Giao diện DevOps / Control Center riêng biệt — Amber/Orange theme)
import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  Play, CheckCircle2, XCircle, Clock, Loader2, Trash2,
  Database, HardDrive, Layers, Sparkles, BrainCircuit,
  ArrowRight, Terminal, ShieldAlert, RotateCcw
} from 'lucide-react'
import { TabHeader } from '@/components/layout/TabHeader'
import { ConfirmDialog, doubleConfirm } from '@/components/ui/ConfirmDialog'
import { useConfirm } from '@/hooks/useConfirm'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { cn } from '@/lib/utils'

const STAGES = [
  {
    key: 'bronze',
    step: 'STAGE 01',
    label: 'Bronze Ingest',
    script: '01_ingest_bronze.py',
    desc: 'Đọc 7 file CSV gốc từ raw_data/ nạp vào tầng Bronze + tạo Snapshot',
    icon: HardDrive,
  },
  {
    key: 'silver',
    step: 'STAGE 02',
    label: 'Silver Clean',
    script: '02_bronze_to_silver.py',
    desc: 'Chuẩn hóa kiểu dữ liệu, lọc trùng khóa chính, kiểm tra khóa ngoại -> Parquet',
    icon: Layers,
  },
  {
    key: 'gold',
    step: 'STAGE 03',
    label: 'Gold Enrich',
    script: '03_silver_to_gold.py',
    desc: 'Tổng hợp bảng phân tích: doanh thu, biên lợi nhuận, phân khúc RFM khách hàng',
    icon: Sparkles,
  },
  {
    key: 'sqlite',
    step: 'STAGE 04',
    label: 'SQLite Serving',
    script: '04_gold_to_sqlite.py',
    desc: 'Ghi nguyên tử toàn bộ bảng Gold + đánh Index vào analytics.db cho Dashboard',
    icon: Database,
  },
  {
    key: 'ml',
    step: 'STAGE 05',
    label: 'ML Training',
    script: 'predict_bestsellers.py',
    desc: 'Huấn luyện Random Forest 300 cây, chạy Backtest và xuất dự báo 14 ngày tới',
    icon: BrainCircuit,
  },
]

const STATUS_BADGE = {
  idle:    { text: 'READY',   cls: 'bg-gray-800 text-gray-400 border-gray-700', icon: Clock },
  running: { text: 'RUNNING', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Loader2, spin: true },
  done:    { text: 'SUCCESS', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle2 },
  error:   { text: 'FAILED',  cls: 'bg-red-500/20 text-red-300 border-red-500/40', icon: XCircle },
}

export default function PipelineControl() {
  const [stageStatus, setStageStatus] = useState(
    Object.fromEntries(STAGES.map(s => [s.key, 'idle']))
  )
  const [logs, setLogs] = useState([])
  const [running, setRunning] = useState(false)
  const [activeStage, setActiveStage] = useState(null)
  const logRef = useRef(null)
  const { confirm, confirmProps } = useConfirm()

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  useEffect(() => {
    const cleanup = window.electron?.onPipelineProgress?.(({ stage, log }) => {
      if (log) {
        log.split(/\r?\n/).filter(Boolean).forEach(line => {
          addLog(`[${stage.toUpperCase()}] ${line}`, 'info')
        })
      }
    })
    return () => cleanup?.()
  }, [])

  const addLog = (text, type = 'info') => {
    const ts = new Date().toLocaleTimeString('vi-VN')
    setLogs(prev => [...prev, { ts, text, type }])
  }

  const runStage = async (stageKey) => {
    setActiveStage(stageKey)
    setStageStatus(prev => ({ ...prev, [stageKey]: 'running' }))
    addLog(`>>> EXEC stage="${stageKey}" ...`, 'cmd')
    try {
      const result = await window.electron?.runPipeline({ stage: stageKey })
      if (result?.success) {
        setStageStatus(prev => ({ ...prev, [stageKey]: 'done' }))
        addLog(`<<< EXIT 0: Stage "${stageKey}" hoàn thành.`, 'success')
        return true
      } else {
        setStageStatus(prev => ({ ...prev, [stageKey]: 'error' }))
        addLog(`<<< EXIT 1: Stage "${stageKey}" lỗi: ${result?.stderr || result?.error || 'Unknown'}`, 'error')
        return false
      }
    } catch (err) {
      setStageStatus(prev => ({ ...prev, [stageKey]: 'error' }))
      addLog(`<<< EXCEPTION (${stageKey}): ${err.message}`, 'error')
      return false
    } finally {
      setActiveStage(null)
    }
  }

  const handleRunAll = async () => {
    const confirmed = await doubleConfirm(confirm, {
      title: 'Thực thi toàn bộ chuỗi Pipeline + ML',
      message: 'Hệ thống sẽ chạy tuần tự 5 Stage từ Raw CSV → Bronze → Silver → Gold → SQLite → ML.',
      dangerMessage: 'Dữ liệu hiện tại trong SQLite (analytics.db) sẽ bị ghi đè. Xác nhận thực thi?',
    })
    if (!confirmed) return

    setRunning(true)
    addLog('====================================================', 'cmd')
    addLog('BẮT ĐẦU CHUỖI PIPELINE TỰ ĐỘNG (5 STAGES)', 'cmd')
    addLog('====================================================', 'cmd')

    for (const stage of STAGES) {
      const ok = await runStage(stage.key)
      if (!ok) {
        addLog('!!! PIPELINE DỪNG KHẨN CẤP DO LỖI !!!', 'error')
        setRunning(false)
        return
      }
    }

    await window.electron?.reloadDatabase()
    addLog('=== HOÀN TẤT: Đã reload kết nối SQLite cho toàn bộ Dashboard ===', 'success')
    setRunning(false)
  }

  const handleRunStage = async (stage) => {
    if (running) return
    const confirmed = await doubleConfirm(confirm, {
      title: `Thực thi ${stage.step}: ${stage.label}`,
      message: `Chạy script "${stage.script}" sẽ cập nhật dữ liệu của tầng này. Tiếp tục?`,
      dangerMessage: `Xác nhận ghi đè dữ liệu của "${stage.label}"?`,
    })
    if (!confirmed) return

    setRunning(true)
    await runStage(stage.key)
    if (stage.key === 'sqlite' || stage.key === 'ml') {
      await window.electron?.reloadDatabase()
      addLog('Đã reload kết nối SQLite Serving DB.', 'success')
    }
    setRunning(false)
  }

  const handleClearLog = useCallback(() => setLogs([]), [])
  const handleRefresh = useCallback(() => {
    setStageStatus(Object.fromEntries(STAGES.map(s => [s.key, 'idle'])))
    addLog('Đã reset trạng thái hiển thị các stage.', 'info')
  }, [])

  useKeyboardShortcuts({ 'ctrl+r': handleRefresh, 'ctrl+l': handleClearLog })

  const doneCount = Object.values(stageStatus).filter(v => v === 'done').length

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <ConfirmDialog {...confirmProps} />

      <TabHeader title="Trung Tâm Điều Khiển Data Pipeline (ETL & ML)" ruleKey="pipeline" onRefresh={handleRefresh} loading={running}>
        <button onClick={handleRunAll} disabled={running}
          className={cn(
            'flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm',
            running
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-400 text-gray-950 shadow-amber-900/30'
          )}>
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {running ? 'Đang thực thi...' : 'Chạy Toàn Bộ (5 Stages)'}
        </button>
      </TabHeader>

      <div className="flex-1 overflow-hidden p-5 flex flex-col gap-4">
        {/* Control Room Status Bar */}
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/35 via-stone-900/60 to-stone-900/40 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-amber-300">Khu vực vận hành hệ thống (Control Plane): </span>
              <span className="text-gray-300">
                Mọi thao tác thực thi tại đây sẽ gọi trực tiếp tiến trình Python ETL dưới máy trạm và cập nhật `analytics.db`.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-black/40 border border-gray-700 text-gray-300">
              Tiến độ phiên: <strong className="text-amber-400">{doneCount}/{STAGES.length}</strong> stages
            </span>
            <button onClick={handleRefresh} disabled={running}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors">
              <RotateCcw size={12} /> Reset trạng thái
            </button>
          </div>
        </div>

        {/* Pipeline Architecture Flow Stepper — Khác biệt rõ với các biểu đồ BI */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
          {STAGES.map((stage, idx) => {
            const st = stageStatus[stage.key]
            const badge = STATUS_BADGE[st]
            const BadgeIcon = badge.icon
            const StageIcon = stage.icon
            const isCurrent = activeStage === stage.key

            return (
              <div
                key={stage.key}
                className={cn(
                  'relative rounded-xl border p-3.5 flex flex-col justify-between transition-all bg-surface-dark-2',
                  isCurrent ? 'border-amber-400 ring-1 ring-amber-400/40 bg-amber-950/20' :
                  st === 'done' ? 'border-emerald-500/40 bg-emerald-950/10' :
                  st === 'error' ? 'border-red-500/40 bg-red-950/10' :
                  'border-gray-800 hover:border-amber-500/40'
                )}
              >
                <div>
                  {/* Top row: Step number + Status badge */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-amber-400/90">
                      {stage.step}
                    </span>
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border',
                      badge.cls
                    )}>
                      <BadgeIcon size={11} className={badge.spin ? 'animate-spin' : ''} />
                      {badge.text}
                    </span>
                  </div>

                  {/* Title + Script name */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <StageIcon size={15} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white leading-tight">{stage.label}</h4>
                      <p className="text-[10px] font-mono text-gray-500">{stage.script}</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed mt-2">{stage.desc}</p>
                </div>

                {/* Action button */}
                <div className="mt-3 pt-2.5 border-t border-gray-800/80 flex items-center justify-between">
                  <button
                    onClick={() => handleRunStage(stage)}
                    disabled={running}
                    className={cn(
                      'w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors border',
                      running
                        ? 'bg-gray-800/50 text-gray-600 border-gray-800 cursor-not-allowed'
                        : 'bg-gray-800 hover:bg-amber-500/20 text-gray-200 hover:text-amber-300 border-gray-700 hover:border-amber-500/40'
                    )}
                  >
                    <Play size={11} />
                    <span>Chạy Stage {idx + 1}</span>
                  </button>
                </div>

                {/* Connector arrow on large screens */}
                {idx < STAGES.length - 1 && (
                  <div className="hidden xl:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-gray-900 border border-gray-700 items-center justify-center text-amber-400">
                    <ArrowRight size={11} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Terminal Console Window */}
        <div className="flex-1 rounded-xl border border-gray-700/80 bg-[#090d16] overflow-hidden flex flex-col min-h-0 shadow-inner">
          {/* Terminal Titlebar */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900/90 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <Terminal size={13} className="text-amber-400" />
              <span className="text-xs font-mono text-gray-300">python-etl-runner — stdout/stderr stream</span>
            </div>
            <button onClick={handleClearLog} title="Xóa log (Ctrl+L)"
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <Trash2 size={12} /> Clear (Ctrl+L)
            </button>
          </div>

          {/* Terminal Body */}
          <div ref={logRef}
            className="flex-1 overflow-y-auto scrollbar-thin p-4 font-mono text-xs space-y-1.5 selectable">
            {logs.length === 0 && (
              <div className="text-gray-600 space-y-1">
                <p>$ Ready. Nhấn "Chạy Toàn Bộ (5 Stages)" hoặc chọn từng Stage ở trên để thực thi.</p>
                <p>$ Luồng chuẩn: 01_ingest_bronze.py → 02_bronze_to_silver.py → 03_silver_to_gold.py → 04_gold_to_sqlite.py → predict_bestsellers.py</p>
              </div>
            )}
            {logs.map((log, i) => (
              <p key={i} className={cn(
                'leading-relaxed',
                log.type === 'error' ? 'text-red-400 font-semibold' :
                log.type === 'success' ? 'text-emerald-400 font-semibold' :
                log.type === 'cmd' ? 'text-amber-300 font-semibold' : 'text-gray-300'
              )}>
                <span className="text-gray-600 select-none">[{log.ts}] </span>
                {log.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
