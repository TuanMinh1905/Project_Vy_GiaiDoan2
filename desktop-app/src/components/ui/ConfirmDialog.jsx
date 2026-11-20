// ConfirmDialog — Dialog xác nhận 2 lần
// Dùng cho tất cả hành động quan trọng (xóa, chạy pipeline, reset...)

import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ConfirmDialog({ open, options = {}, onConfirm, onCancel }) {
  if (!open) return null

  const {
    title = 'Xác nhận',
    message = 'Bạn có chắc muốn thực hiện hành động này?',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    variant = 'default', // 'default' | 'danger'
    isSecondConfirm = false,
  } = options

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className={cn(
        'relative bg-surface-dark-2 border rounded-xl shadow-2xl w-full max-w-md mx-4 fade-in',
        variant === 'danger' ? 'border-red-500/50' : 'border-gray-700'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2.5">
            {variant === 'danger' ? (
              <AlertTriangle size={18} className="text-red-400" />
            ) : (
              <AlertTriangle size={18} className="text-yellow-400" />
            )}
            <h3 className={cn(
              'font-semibold',
              variant === 'danger' ? 'text-red-300' : 'text-white'
            )}>
              {isSecondConfirm ? '⚠ Xác nhận lần cuối' : title}
            </h3>
          </div>
          <button onClick={onCancel} className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {isSecondConfirm && (
            <div className="mb-3 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-300">
              Hành động này KHÔNG THỂ hoàn tác sau khi xác nhận.
            </div>
          )}
          <p className="text-gray-200 text-sm leading-relaxed selectable">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm text-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-brand-600 hover:bg-brand-500 text-white'
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== HELPER: Tạo confirm 2 bước =====
// Dùng cùng hook useConfirm()
export async function doubleConfirm(confirm, { title, message, dangerMessage }) {
  // Bước 1
  const step1 = await confirm({
    title,
    message,
    confirmText: 'Tiếp tục',
    cancelText: 'Hủy',
    variant: 'default',
  })
  if (!step1) return false

  // Bước 2
  const step2 = await confirm({
    title,
    message: dangerMessage || message,
    confirmText: 'Xác nhận',
    cancelText: 'Quay lại',
    variant: 'danger',
    isSecondConfirm: true,
  })
  return step2
}
