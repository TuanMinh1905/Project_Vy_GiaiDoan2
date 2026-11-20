// Pipeline Control Tab
// Điều khiển chạy ETL pipeline và theo dõi log realtime

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Square, CheckCircle2, XCircle, Clock, Loader2, Trash2 } from 'lucide-react'
import { TabHeader } from '@/components/layout/TabHeader'
import { ConfirmDialog, doubleConfirm } from '@/components/ui/ConfirmDialog'
import { useConfirm } from '@/hooks/useConfirm'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { cn } from '@/lib/utils'

const STAGES = [
  { key: 'bronze', label: 'Bronze (Ingest)', desc: 'CSV → MinIO Bronze', color: 'amber' },
  { key: 'silver', label: 'Silver (Clean)',  desc: 'Bronze → MinIO Silver', color: 'gray' },
  { key: 'gold',   label: 'Gold (Enrich)',   desc: 'Silver → MinIO Gold', color: 'yellow' },
  { key: 'sqlite', label: 'SQLite (Load)',   desc: 'Gold → SQLite DB', color: 'blue' },
  { key: 'ml',     label: 'ML Predictions', desc: 'SQLite → ML → Predictions', color: 'purple' },
]

const STATUS_ICON = {
  idle:    <Clock size={15} className="text-gray-500" />,
  running: <Loader2 size={15} className="text-blue-400 animate-spin" />,
  done:    <CheckCircle2 size={15} className="text-green-400" />,
  error:   <XCircle size={15} className="text-red-400" />,
}

export default function PipelineControl() {
  const [stageStatus, setStageStatus] = useState(
    Object.fromEntries(STAGES.map(s => [s.key, 'idle']))
  )
  const [logs, setLogs] = useState([])
  const [running, setRunning] = useState(false)
  const logRef = useRef(null)
  const { confirm, confirmProps } = useConfirm()

  // Auto scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  const addLog = (text, type = 'info') => {
    const ts = new Date().toLocaleTimeString('vi-VN')
    setLogs(prev => [...prev, { ts, text, type }])
  }

  const handleRunAll = async () => {
    const confirmed = await doubleConfirm(confirm, {
      title: 'Chạy toàn bộ Pipeline',
      message: 'Chạy lại pipeline sẽ ghi đè data hiện tại trong SQLite. Bạn có muốn tiếp tục?',
      dangerMessage: 'Data cũ trong SQLite sẽ bị ghi đè. Hành động này KHÔNG THỂ hoàn tác.',
    })
    if (!confirmed) return

    setRunning(true)
    addLog('=== Bat dau chay toan bo pipeline ===', 'info')

    for (const stage of STAGES) {
      setStageStatus(prev => ({ ...prev, [stage.key]: 'running' }))
      addLog(`[${stage.label}] Dang chay...`, 'info')
      try {
        // const result = await window.electron?.runPipeline({ stage: stage.key })
        await new Promise(r => setTimeout(r, 1200)) // simulate
        setStageStatus(prev => ({ ...prev, [stage.key]: 'done' }))
        addLog(`[${stage.label}] Hoan thanh`, 'success')
      } catch (err) {
        setStageStatus(prev => ({ ...prev, [stage.key]: 'error' }))
        addLog(`[${stage.label}] LOI: ${err.message}`, 'error')
        setRunning(false)
        return
      }
    }

    addLog('=== Pipeline hoan thanh ===', 'success')
    setRunning(false)
  }

  const handleRunStage = async (stage) => {
    if (running) return
    const confirmed = await doubleConfirm(confirm, {
      title: `Chạy stage: ${stage.label}`,
      message: `Chạy lại "${stage.label}" sẽ ghi đè data của stage này. Tiếp tục?`,
      dangerMessage: `Data của stage "${stage.label}" sẽ bị ghi đè.`,
    })
    if (!confirmed) return

    setRunning(true)
    setStageStatus(prev => ({ ...prev, [stage.key]: 'running' }))
    addLog(`[${stage.label}] Dang chay...`, 'info')
    await new Promise(r => setTimeout(r, 1200))
    setStageStatus(prev => ({ ...prev, [stage.key]: 'done' }))
    addLog(`[${stage.label}] Hoan thanh`, 'success')
    setRunning(false)
  }

  const handleClearLog = useCallback(() => setLogs([]), [])

  const handleRefresh = useCallback(() => {
    setStageStatus(Object.fromEntries(STAGES.map(s => [s.key, 'idle'])))
    addLog('Reset trang thai.', 'info')
  }, [])

  useKeyboardShortcuts({
    'ctrl+r': handleRefresh,
    'ctrl+l': handleClearLog,
  })

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <ConfirmDialog {...confirmProps} />

      <TabHeader
        title="Pipeline Control"
        ruleKey="pipeline"
        onRefresh={handleRefresh}
        loading={running}
      >
        <button
          onClick={handleRunAll}
          disabled={running}
          className={cn(
            'flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
            running
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-brand-600 hover:bg-brand-500 text-white'
          )}
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {running ? 'Đang chạy...' : 'Chạy Toàn Bộ'}
        </button>
      </TabHeader>

      <div className="flex-1 overflow-hidden p-5 flex flex-col gap-4">
        {/* Stage Cards */}
        <div className="grid grid-cols-5 gap-3">
          {STAGES.map((stage) => (
            <button
              key={stage.key}
              onClick={() => handleRunStage(stage)}
              disabled={running}
              className={cn(
                'cvy-card text-left transition-all hover:border-brand-500/50',
                running && 'opacity-60 cursor-not-allowed'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-300">{stage.label}</span>
                {STATUS_ICON[stageStatus[stage.key]]}
              </div>
              <p className="text-[11px] text-gray-500">{stage.desc}</p>
            </button>
          ))}
        </div>

        {/* Log Panel */}
        <div className="flex-1 cvy-card overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Log realtime</span>
            <button
              onClick={handleClearLog}
              title="Xóa log (Ctrl+L)"
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <Trash2 size={12} /> Xóa log
            </button>
          </div>
          <div
            ref={logRef}
            className="flex-1 overflow-y-auto scrollbar-thin bg-black/30 rounded-lg p-3 font-mono text-xs space-y-1 selectable"
          >
            {logs.length === 0 && (
              <p className="text-gray-600 italic">Chưa có log. Nhấn "Chạy Toàn Bộ" để bắt đầu pipeline.</p>
            )}
            {logs.map((log, i) => (
              <p key={i} className={cn(
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' : 'text-gray-300'
              )}>
                <span className="text-gray-600">[{log.ts}]</span> {log.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

