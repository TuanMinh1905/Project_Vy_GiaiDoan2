// Sidebar — Navigation menu bên trái
// Hỗ trợ collapse và shortcut Ctrl+1..7

import React from 'react'
import {
  LayoutDashboard, Package, Users, Globe, Radio,
  BrainCircuit, Settings2, ChevronLeft, ChevronRight, Moon, Sun
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { key: 'overview',         label: 'Tổng Quan',         icon: LayoutDashboard, shortcut: '1' },
  { key: 'products',         label: 'Sản Phẩm',          icon: Package,         shortcut: '2' },
  { key: 'customers',        label: 'Khách Hàng',        icon: Users,           shortcut: '3' },
  { key: 'geography',        label: 'Địa Lý',            icon: Globe,           shortcut: '4' },
  { key: 'channels',         label: 'Kênh Bán',          icon: Radio,           shortcut: '5' },
  { key: 'mlforecast',       label: 'ML Dự Đoán',        icon: BrainCircuit,   shortcut: '6' },
  { key: 'pipeline',         label: 'Pipeline Control',  icon: Settings2,       shortcut: '7' },
]

export function Sidebar({ activeTab, onTabChange, collapsed, onToggleCollapse, isDark, onToggleDark }) {
  return (
    <aside className={cn(
      'flex flex-col bg-surface-dark-2 border-r border-gray-800 transition-all duration-200 shrink-0',
      collapsed ? 'w-14' : 'w-52'
    )}>
      {/* Nav items */}
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.key
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              title={collapsed ? `${item.label} (Ctrl+${item.shortcut})` : `Ctrl+${item.shortcut}`}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-brand-600/20 text-brand-400 border-r-2 border-brand-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              )}
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && (
                <span className="truncate font-medium">{item.label}</span>
              )}
              {!collapsed && (
                <span className="ml-auto text-[10px] text-gray-600 font-mono shrink-0">
                  ^{item.shortcut}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom controls */}
      <div className="border-t border-gray-800 py-2 space-y-1">
        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          title={isDark ? 'Chuyển Light mode (Ctrl+D)' : 'Chuyển Dark mode (Ctrl+D)'}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-colors"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
          {!collapsed && <span className="text-xs">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          className="w-full flex items-center justify-center py-2 text-gray-500 hover:text-gray-300 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}

