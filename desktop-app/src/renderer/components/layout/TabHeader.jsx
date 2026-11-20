// TabHeader — Header chuẩn cho mỗi Tab
// Tự động phân biệt giao diện theo 3 nhóm: BI Dashboard (Tím) | Machine Learning (Xanh ngọc) | Control Center (Cam)

import React from 'react'
import { RefreshCw, Download, BarChart3, BrainCircuit, Terminal } from 'lucide-react'
import { RuleButton } from '@/components/ui/RuleButton'
import { cn } from '@/lib/utils'

const SECTION_THEMES = {
  dashboard: {
    badge: 'BI DASHBOARD',
    subtitle: 'Trực quan hóa dữ liệu kinh doanh từ SQLite Gold Layer',
    icon: BarChart3,
    headerBg: 'bg-gradient-to-r from-purple-950/35 via-surface-dark-2/60 to-surface-dark-2/50 border-purple-500/25',
    badgeClass: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    accentBar: 'bg-purple-500',
  },
  ml: {
    badge: 'MACHINE LEARNING',
    subtitle: 'Mô hình AI dự báo nhu cầu & kiểm chứng Backtest (scikit-learn)',
    icon: BrainCircuit,
    headerBg: 'bg-gradient-to-r from-emerald-950/45 via-cyan-950/20 to-surface-dark-2/50 border-emerald-500/30',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    accentBar: 'bg-emerald-400',
  },
  control: {
    badge: 'SYSTEM CONTROL',
    subtitle: 'Trung tâm điều phối luồng dữ liệu ETL & huấn luyện mô hình',
    icon: Terminal,
    headerBg: 'bg-gradient-to-r from-amber-950/45 via-orange-950/20 to-surface-dark-2/50 border-amber-500/30',
    badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    accentBar: 'bg-amber-400',
  },
}

function getSectionType(ruleKey) {
  if (ruleKey === 'mlforecast') return 'ml'
  if (ruleKey === 'pipeline') return 'control'
  return 'dashboard'
}

export function TabHeader({
  title,
  ruleKey,
  onRefresh,
  onExport,
  loading,
  children,
}) {
  const sectionType = getSectionType(ruleKey)
  const theme = SECTION_THEMES[sectionType]
  const BadgeIcon = theme.icon

  return (
    <div className={cn(
      'shrink-0 relative flex items-center justify-between px-5 py-3 border-b',
      theme.headerBg
    )}>
      {/* Left accent bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', theme.accentBar)} />

      {/* Left: Category Badge + Title + Subtitle */}
      <div className="flex flex-col gap-0.5 pl-1">
        <div className="flex items-center gap-2.5">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase',
            theme.badgeClass
          )}>
            <BadgeIcon size={11} />
            {theme.badge}
          </span>
          <h1 className="font-semibold text-white text-base tracking-tight">{title}</h1>
        </div>
        <p className="text-[11px] text-gray-400">{theme.subtitle}</p>
      </div>

      {/* Center/Right: Controls */}
      <div className="flex items-center gap-2">
        {children}

        {children && <div className="h-5 w-px bg-gray-700 mx-1" />}

        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Làm mới dữ liệu (Ctrl+R)"
            disabled={loading}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs',
              'text-gray-300 hover:text-white bg-gray-800/70 hover:bg-gray-700 border border-gray-700/80 transition-colors',
              loading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        )}

        {onExport && (
          <button
            onClick={onExport}
            title="Xuất CSV (Ctrl+E)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-gray-300 hover:text-white bg-gray-800/70 hover:bg-gray-700 border border-gray-700/80 transition-colors"
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
