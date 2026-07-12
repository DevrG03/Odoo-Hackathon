import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const nav = [
  { group: 'Overview', items: [
    { to: '/dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
  ]},
  { group: 'Environmental', items: [
    { to: '/environmental/transactions', icon: 'ti-bolt', label: 'Carbon Transactions' },
    { to: '/environmental/factors', icon: 'ti-calculator', label: 'Emission Factors' },
    { to: '/environmental/goals', icon: 'ti-target', label: 'Goals' },
  ]},
  { group: 'Social', items: [
    { to: '/social/activities', icon: 'ti-heart-handshake', label: 'CSR Activities' },
    { to: '/social/participations', icon: 'ti-users', label: 'Participations' },
  ]},
  { group: 'Gamification', items: [
    { to: '/gamification/challenges', icon: 'ti-sword', label: 'Challenges' },
    { to: '/gamification/badges', icon: 'ti-medal', label: 'Badges' },
    { to: '/gamification/rewards', icon: 'ti-gift', label: 'Rewards' },
    { to: '/gamification/leaderboard', icon: 'ti-trophy', label: 'Leaderboard' },
  ]},
  { group: 'Governance', items: [
    { to: '/governance/policies', icon: 'ti-file-certificate', label: 'Policies' },
    { to: '/governance/audits', icon: 'ti-clipboard-check', label: 'Audits' },
    { to: '/governance/compliance', icon: 'ti-alert-triangle', label: 'Compliance Issues' },
  ]},
  { group: 'Reports', items: [
    { to: '/reports', icon: 'ti-chart-bar', label: 'ESG Summary' },
  ]},
  { group: 'Settings', items: [
    { to: '/settings', icon: 'ti-settings', label: 'Settings' },
  ]},
]

export function Sidebar() {
  const { logout } = useAuth()
  return (
    <aside className="w-[210px] flex-shrink-0 bg-forest flex flex-col h-screen sticky top-0 z-10">
      <div className="px-4 py-[18px] border-b border-white/10">
        <div className="flex items-center gap-2 text-white font-semibold text-[15px] tracking-[-0.2px]">
          <div className="w-[22px] h-[22px] bg-white/15 rounded-md flex items-center justify-center flex-shrink-0">
            <i className="ti ti-leaf" style={{ fontSize: 13, color: '#E6F2DD' }} aria-hidden="true" />
          </div>
          EcoSphere
        </div>
        <div className="text-[10px] text-white/40 uppercase tracking-[0.5px] mt-0.5">ESG Platform</div>
      </div>

      <nav className="flex-1 overflow-y-auto pb-3">
        {nav.map((section) => (
          <div key={section.group}>
            <div className="px-3 pt-3.5 pb-1 text-[9px] font-semibold uppercase tracking-[0.8px] text-white/40">
              {section.group}
            </div>
            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 mx-1.5 px-2.5 py-[7px] rounded-md text-[12.5px] transition-colors
                  ${isActive ? 'bg-white/18 text-white font-medium' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
                }>
                <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <button onClick={logout}
        className="flex items-center gap-2 mx-3 mb-3 px-2.5 py-[7px] rounded-md text-white/60 hover:text-white hover:bg-white/10 text-[12.5px] transition-colors">
        <i className="ti ti-logout" style={{ fontSize: 15 }} aria-hidden="true" />
        Logout
      </button>
    </aside>
  )
}
