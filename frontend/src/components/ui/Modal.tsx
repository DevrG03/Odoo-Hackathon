import { type ReactNode } from 'react'
import { Button } from './Button'

interface ModalProps {
  title: string
  open: boolean
  onClose: () => void
  onConfirm?: () => void
  confirmLabel?: string
  confirmVariant?: 'primary' | 'danger'
  children: ReactNode
  width?: string
}

export function Modal({ title, open, onClose, onConfirm, confirmLabel = 'Save', confirmVariant = 'primary', children, width = 'max-w-md' }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4">
      <div className={`bg-white border border-mist rounded-lg w-full ${width} shadow-sm`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-mist">
          <h2 className="text-[14px] font-semibold text-charcoal">{title}</h2>
          <button onClick={onClose} className="text-sage hover:text-charcoal text-xl leading-none transition-colors">&times;</button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">{children}</div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-dew">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {onConfirm && <Button variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>}
        </div>
      </div>
    </div>
  )
}
