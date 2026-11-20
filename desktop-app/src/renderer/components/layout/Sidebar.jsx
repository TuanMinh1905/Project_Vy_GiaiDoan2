// Sidebar — Navigation menu bên trái
// Phân loại rõ ràng 3 khu vực: BI Dashboards | Machine Learning | System Control

import React from 'react'
import {
  LayoutDashboard, Package, Users, Globe, Radio,
  BrainCircuit, Settings2, ChevronLeft, ChevronRight, Moon, Sun,
  BarChart3, Cpu, Terminal
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_GROUPS = [
  {
    id: 'dashboards',
    title: 'BI DASHBOARDS',
    subtitle: 'Phân tích dữ liệu',
    badge: '5',
    groupIcon: BarChart3,
    accentText: 'text-purple-400',
    activeClass: 'bg-purple-600/20 text-purple-300 border-r-2 border-purple-500 font-medium',
    dotColor: 'bg-purple-400',
    items: [
      { key: 'overview',  label: 'Tổng Quan',  icon: LayoutDashboard, shortcut: '1' },
      { key: 'products',  label: 'Sản Phẩm',   icon: Package,         shortcut: '2' },
      { key: 'customers', label: 'Khách Hàng', icon: Users,           shortcut: '3' },
      { key: 'geography', label: 'Địa Lý',     icon: Globe,           shortcut: '4' },
      { key: 'channels',  label: 'Kênh Bán',   icon: Radio,           shortcut: '5' },
    ],
  },
  {
    id: 'ml',
    title: 'MACHINE LEARNING',
    subtitle: 'AI Dự báo',
    badge: 'AI',
    groupIcon: Cpu,
    accentText: 'text-emerald-400',
    activeClass: 'bg-emerald-500/20 text-emerald-300 border-r-2 border-emerald-400 font-medium',
    dotColor: 'bg-emerald-400',
    items: [
      { key: 'mlforecast', label: 'ML Dự Đoán', icon: BrainCircuit, shortcut: '6', tag: 'RF' },
    ],
  },
  {
    id: 'control',
    title: 'CONTROL CENTER',
    subtitle: 'Vận hành hệ thống',
    badge: 'OPS',
    groupIcon: Terminal,
    accentText: 'text-amber-400',
    activeClass: 'bg-amber-500/20 text-amber-300 border-r-2 border-amber-400 font-medium',
    dotColor: 'bg-amber-400',
    items: [
      { key: 'pipeline', label: 'Pipeline Control', icon: Settings2, shortcut: '7', tag: 'ETL' },
    ],
  },
]

export function Sidebar({ activeTab, onTabChange, collapsed, onToggleCollapse, isDark, onToggleDark }) {
  return (
    <aside className={cn(
      'flex flex-col bg-surface-dark-2 border-r border-gray-800 transition-all duration-200 shrink-0',
      collapsed ? 'w-14' : 'w-56'
    )}>
      {/* Nav groups */}
      <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin space-y-3">
        {NAV_GROUPS.map((group, gIdx) => {
          const GroupIcon = group.groupIcon
          return (
            <div key={group.id} className={cn(gIdx > 0 && 'pt-2 border-t border-gray-800/80')}>
              {/* Group Header */}
              {!collapsed ? (
                <div className="px-3 pb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <GroupIcon size={12} className={group.accentText} />
                    <span className={cn('text-[10px] font-bold tracking-wider uppercase', group.accentText)}>
                      {group.title}
                    </span>
                  </div>
                  <span className={cn(
                    'text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold',
                    group.id === 'dashboards' && 'bg-purple-500/15 text-purple-300',
                    group.id === 'ml' && 'bg-emerald-500/15 text-emerald-300',
                    group.id === 'control' && 'bg-amber-500/15 text-amber-300',
                  )}>
                    {group.badge}
                  </span>
                </div>
              ) : (
                <div className="flex justify-center pb-1" title={group.title}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', group.dotColor)} />
                </div>
              )}

              {/* Items in Group */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => onTabChange(item.key)}
                      title={collapsed ? `[${group.title}] ${item.label} (Ctrl+${item.shortcut})` : `Ctrl+${item.shortcut}`}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                        isActive
                          ? group.activeClass
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                      )}
                    >
                      <Icon size={17} className={cn('shrink-0', isActive && group.accentText)} />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {!collapsed && item.tag && (
                        <span className={cn(
                          'text-[9px] font-mono px-1 py-0.2 rounded border',
                          group.id === 'ml'
                            ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                            : 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                        )}>
                          {item.tag}
                        </span>
                      )}
                      {!collapsed && (
                        <span className="ml-auto text-[10px] text-gray-600 font-mono shrink-0">
                          ^{item.shortcut}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Bottom controls */}
      <div className="border-t border-gray-800 py-2 space-y-1">
        <button
          onClick={onToggleDark}
          title={isDark ? 'Chuyển Light mode (Ctrl+D)' : 'Chuyển Dark mode (Ctrl+D)'}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-colors"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span className="text-xs">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          className="w-full flex items-center justify-center py-1.5 text-gray-500 hover:text-gray-300 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}
