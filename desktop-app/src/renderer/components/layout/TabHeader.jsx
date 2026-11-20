// TabHeader — Header chuẩn cho mỗi Tab
// Chứa: Tiêu đề + Filter controls + Nút Quy tắc

import React from 'react'
import { RefreshCw, Download } from 'lucide-react'
import { RuleButton } from '@/components/ui/RuleButton'
import { cn } from '@/lib/utils'

export function TabHeader({
  title,
  ruleKey,
  onRefresh,
  onExport,
  loading,
  children, // Slot cho các filter controls
}) {
  return (
    <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-surface-dark-2/50">
      {/* Left: Title */}
      <h1 className="font-semibold text-white text-base">{title}</h1>

      {/* Center/Right: Controls */}
      <div className="flex items-center gap-2">
        {/* Slot cho filter, date picker... */}
        {children}

        {/* Divider */}
        {children && <div className="h-5 w-px bg-gray-700 mx-1" />}

        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Làm mới dữ liệu (Ctrl+R)"
            disabled={loading}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs',
              'text-gray-400 hover:text-white hover:bg-gray-700 transition-colors',
              loading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        )}

        {/* Export */}
        {onExport && (
          <button
            onClick={onExport}
            title="Xuất CSV (Ctrl+E)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        )}

        {/* Rule button — LUÔN CÓ */}
        <RuleButton ruleKey={ruleKey} />
      </div>
    </div>
  )
}

