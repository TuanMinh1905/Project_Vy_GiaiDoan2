// App.jsx — Root component
// Quản lý: layout chính, routing giữa các tab, keyboard shortcuts toàn cục

import React, { useState, useCallback } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { TitleBar } from '@/components/layout/TitleBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

// Pages
import Overview from '@/pages/Overview'
import PipelineControl from '@/pages/PipelineControl'
import { PlaceholderPage } from '@/components/ui/PlaceholderPage'

const TABS = {
  overview:  <Overview />,
  products:  <PlaceholderPage title="Hiệu Suất Sản Phẩm" ruleKey="products" />,
  customers: <PlaceholderPage title="Phân Tích Khách Hàng" ruleKey="customers" />,
  geography: <PlaceholderPage title="Phân Tích Địa Lý" ruleKey="geography" />,
  channels:  <PlaceholderPage title="Hiệu Suất Kênh Bán" ruleKey="channels" />,
  mlforecast:<PlaceholderPage title="ML Dự Đoán Bán Chạy" ruleKey="mlforecast" description="Tab này sẽ hiển thị sau khi chạy pipeline và ML model." />,
  pipeline:  <PipelineControl />,
}

const TAB_KEYS = Object.keys(TABS)

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { isDark, toggle: toggleDark } = useDarkMode()

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+d': toggleDark,
    'ctrl+1': () => setActiveTab('overview'),
    'ctrl+2': () => setActiveTab('products'),
    'ctrl+3': () => setActiveTab('customers'),
    'ctrl+4': () => setActiveTab('geography'),
    'ctrl+5': () => setActiveTab('channels'),
    'ctrl+6': () => setActiveTab('mlforecast'),
    'ctrl+7': () => setActiveTab('pipeline'),
    'escape': () => {}, // handled by modals
  })

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface-dark">
      {/* Custom Titlebar */}
      <TitleBar isDark={isDark} onToggleDark={toggleDark} />

      {/* Main layout: Sidebar + Content (resizable) */}
      <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* Sidebar Panel */}
        <Panel
          defaultSize={sidebarCollapsed ? 4 : 14}
          minSize={4}
          maxSize={25}
          className="overflow-hidden"
        >
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(p => !p)}
            isDark={isDark}
            onToggleDark={toggleDark}
          />
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-brand-500/50 transition-colors cursor-col-resize" />

        {/* Content Panel */}
        <Panel defaultSize={86} className="overflow-hidden bg-surface-dark">
          {TABS[activeTab] || TABS.overview}
        </Panel>
      </PanelGroup>
    </div>
  )
}

