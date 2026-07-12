import { type ReactNode } from 'react'

type Stripe = 'forest' | 'sage' | 'mist' | 'red' | 'amber'
const stripes: Record<Stripe, string> = {
  forest: 'bg-forest', sage: 'bg-sage', mist: 'bg-mist',
  red: 'bg-red-400', amber: 'bg-amber-400',
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: ReactNode
  stripe?: Stripe
  icon?: string
}

export function StatCard({ label, value, sub, stripe = 'forest', icon }: StatCardProps) {
  return (
    <div className="bg-white border border-mist rounded-lg overflow-hidden">
      <div className={`h-[3px] ${stripes[stripe]}`} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[11px] font-medium text-sage">{label}</div>
          {icon && <i className={`ti ${icon} text-mist`} style={{ fontSize: 18 }} aria-hidden="true" />}
        </div>
        <div className="text-[22px] font-semibold text-charcoal leading-none tabular-nums">{value}</div>
        {sub && <div className="text-[11px] text-sage mt-1.5 flex items-center gap-1">{sub}</div>}
      </div>
    </div>
  )
}
