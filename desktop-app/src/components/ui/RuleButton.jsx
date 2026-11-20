// RuleButton — Nút (?) hiển thị Quy tắc của từng Tab
// Xuất hiện ở góc phải header của mỗi Tab lớn

import React, { useState } from 'react'
import { HelpCircle, X, Keyboard } from 'lucide-react'
import { TAB_RULES } from '@/lib/tabRules'
import { cn } from '@/lib/utils'

export function RuleButton({ ruleKey, className }) {
  const [open, setOpen] = useState(false)
  const rule = TAB_RULES[ruleKey]

  if (!rule) return null

  return (
    <>
      {/* Nút (?) nhỏ */}
      <button
        onClick={() => setOpen(true)}
        title="Xem quy tắc và cách sử dụng tab này"
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-md text-xs',
          'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50',
          'transition-colors no-drag',
          className
        )}
      >
        <HelpCircle size={14} />
        <span>Quy tắc</span>
      </button>

      {/* Modal đầy đủ */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Modal content */}
          <div className="relative bg-surface-dark-2 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-brand-500" />
                <h2 className="font-semibold text-white">{rule.title}</h2>
                <span className="cvy-badge bg-brand-500/20 text-brand-500">Quy tắc sử dụng</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body (scrollable) */}
            <div className="overflow-y-auto scrollbar-thin px-6 py-4 space-y-5 selectable">
              {/* Mục đích */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mục đích</h3>
                <p className="text-gray-200 text-sm leading-relaxed">{rule.purpose}</p>
              </section>

              {/* Nguồn dữ liệu */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nguồn dữ liệu</h3>
                <code className="text-xs bg-gray-800 px-3 py-1.5 rounded text-green-400 block">{rule.dataSource}</code>
              </section>

              {/* Cách sử dụng */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cách sử dụng</h3>
                <ol className="space-y-1.5">
                  {rule.steps.map((step, i) => (
                    <li key={i} className="text-sm text-gray-200 leading-relaxed">{step}</li>
                  ))}
                </ol>
              </section>

              {/* Phím tắt */}
              {rule.shortcuts?.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Keyboard size={12} /> Phím tắt
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {rule.shortcuts.map((s, i) => {
                      const [keys, ...desc] = s.split(':')
                      return (
                        <span key={i} className="flex items-center gap-1.5 text-xs">
                          <kbd className="bg-gray-700 text-gray-200 px-2 py-0.5 rounded font-mono border border-gray-600">{keys.trim()}</kbd>
                          <span className="text-gray-400">{desc.join(':').trim()}</span>
                        </span>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Lưu ý */}
              {rule.notes?.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Lưu ý</h3>
                  <ul className="space-y-1.5">
                    {rule.notes.map((note, i) => (
                      <li key={i} className="text-sm text-yellow-300/80 flex gap-2">
                        <span>⚠</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm text-gray-200 transition-colors"
              >
                Đóng (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
