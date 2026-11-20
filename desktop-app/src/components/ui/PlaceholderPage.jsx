// Placeholder component cho các tab chưa implement
import React from 'react'
import { Construction } from 'lucide-react'
import { TabHeader } from '@/components/layout/TabHeader'

export function PlaceholderPage({ title, ruleKey, description }) {
  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <TabHeader title={title} ruleKey={ruleKey} />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-10">
        <Construction size={48} className="text-gray-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-2">{title}</h2>
          <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
            {description || 'Tab này đang được phát triển và sẽ hiển thị sau khi Data Pipeline chạy xong.'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-800/50 px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          Phase 2 — Đang triển khai
        </div>
      </div>
    </div>
  )
}
