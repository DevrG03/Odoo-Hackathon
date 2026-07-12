import { useNavigate } from 'react-router-dom'

interface NavbarProps { title: string }

export function Navbar({ title }: NavbarProps) {
  const navigate = useNavigate()
  return (
    <header className="bg-white border-b border-mist h-[52px] flex items-center justify-between px-5 flex-shrink-0">
      <h1 className="text-[14px] font-semibold text-charcoal">{title}</h1>
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/notifications')}
          className="w-8 h-8 rounded-lg border border-mist flex items-center justify-center text-sage hover:bg-dew transition-colors"
          aria-label="Notifications">
          <i className="ti ti-bell" style={{ fontSize: 15 }} aria-hidden="true" />
        </button>
        <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center text-white text-[11px] font-semibold">
          ES
        </div>
      </div>
    </header>
  )
}
