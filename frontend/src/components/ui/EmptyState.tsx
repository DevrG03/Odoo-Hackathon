import { type ReactNode } from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon = 'ti-inbox', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
      <i className={`ti ${icon} text-mist`} style={{ fontSize: 36 }} aria-hidden="true" />
      <div className="text-[14px] font-semibold text-charcoal">{title}</div>
      {description && <div className="text-[12.5px] text-sage max-w-xs">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
