// KPI Card — Hiển thị một chỉ số quan trọng với % thay đổi
import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'

export function KPICard({ title, value, change, unit, icon: Icon, loading }) {
  const isUp = change > 0
  const isDown = change < 0
  const hasChange = change != null

  return (
    <div className="cvy-card flex flex-col gap-3 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider truncate">{title}</span>
        {Icon && <Icon size={16} className="text-gray-500 shrink-0" />}
      </div>

      {/* Value */}
      {loading ? (
        <div className="h-8 w-24 bg-gray-700 animate-pulse rounded" />
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-white tabular-nums">{value ?? '—'}</span>
          {unit && <span className="text-sm text-gray-400">{unit}</span>}
        </div>
      )}

      {/* Change indicator */}
      {hasChange && !loading && (
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium',
          isUp && 'text-green-400',
          isDown && 'text-red-400',
          !isUp && !isDown && 'text-gray-400'
        )}>
          {isUp && <TrendingUp size={12} />}
          {isDown && <TrendingDown size={12} />}
          {!isUp && !isDown && <Minus size={12} />}
          <span>
            {isUp && '+'}
            {change.toFixed(1)}% so với kỳ trước
          </span>
        </div>
      )}
    </div>
  )
}

