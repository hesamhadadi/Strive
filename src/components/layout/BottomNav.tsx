'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Sparkles, CheckSquare, BarChart2 } from 'lucide-react'

const tabs = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Today' },
  { href: '/dashboard/habits', icon: Sparkles, label: 'Habits' },
  { href: '/dashboard/todos', icon: CheckSquare, label: 'Tasks' },
  { href: '/dashboard/stats', icon: BarChart2, label: 'Stats' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bottom-nav tab-bar-safe">
      <div className="max-w-lg mx-auto px-4 pt-2 pb-2">
        <div className="flex items-center justify-around rounded-2xl p-1"
          style={{ background: 'rgba(26,26,36,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {tabs.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-1 px-5 py-2.5 rounded-xl transition-all duration-200 relative"
                style={active ? { background: 'rgba(0,255,136,0.1)' } : {}}>
                {active && (
                  <div className="absolute inset-0 rounded-xl"
                    style={{ boxShadow: '0 0 20px rgba(0,255,136,0.15)' }} />
                )}
                <Icon
                  size={20}
                  className="transition-all duration-200"
                  style={{ color: active ? '#00FF88' : 'rgba(255,255,255,0.35)' }}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <span className="text-[10px] font-medium transition-all duration-200 font-body"
                  style={{ color: active ? '#00FF88' : 'rgba(255,255,255,0.35)' }}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
