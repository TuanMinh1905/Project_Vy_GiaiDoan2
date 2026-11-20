// Titlebar — Custom titlebar cho Electron frameless window
import React from 'react'
import { Minus, Square, X, BarChart3 } from 'lucide-react'

export function TitleBar({ isDark, onToggleDark }) {
  const handleMinimize = () => window.electron?.minimize()
  const handleMaximize = () => window.electron?.maximize()
  const handleClose = () => window.electron?.close()

  return (
    <div className="drag-region flex items-center justify-between h-9 px-3 bg-surface-dark border-b border-gray-800 shrink-0">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-2 no-drag">
        <BarChart3 size={16} className="text-brand-500" />
        <span className="text-xs font-semibold text-gray-300">Analytics Platform — Thời Trang E-Commerce</span>
      </div>

      {/* Right: Window controls */}
      <div className="flex items-center no-drag">
        <button
          onClick={handleMinimize}
          className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          title="Thu nhỏ"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          title="Phóng to"
        >
          <Square size={12} />
        </button>
        <button
          onClick={handleClose}
          className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-600 transition-colors"
          title="Đóng"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

