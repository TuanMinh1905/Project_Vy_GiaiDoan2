// Hook quản lý confirm dialog 2 lần
import { useState, useCallback } from 'react'

export function useConfirm() {
  const [state, setState] = useState({ open: false, resolve: null, options: {} })

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({ open: true, resolve, options })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    state.resolve?.(true)
    setState({ open: false, resolve: null, options: {} })
  }, [state])

  const handleCancel = useCallback(() => {
    state.resolve?.(false)
    setState({ open: false, resolve: null, options: {} })
  }, [state])

  return {
    confirm,
    confirmProps: {
      open: state.open,
      options: state.options,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    }
  }
}
