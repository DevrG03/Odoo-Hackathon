import { type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const styles: Record<Variant, string> = {
  primary:   'bg-forest text-white border-forest hover:bg-sage hover:border-sage',
  secondary: 'bg-dew text-forest border-mist hover:bg-mist',
  ghost:     'bg-transparent text-charcoal border-mist hover:bg-dew',
  danger:    'bg-red-50 text-red-800 border-red-200 hover:bg-red-100',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: string  // Tabler icon name e.g. "ti-plus"
}

export function Button({ variant = 'secondary', icon, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-md border text-[12.5px] font-medium
        transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        ${styles[variant]} ${className}`}
    >
      {icon && <i className={`ti ${icon}`} style={{ fontSize: 15 }} aria-hidden="true" />}
      {children}
    </button>
  )
}
