'use client'

import { signOut } from 'next-auth/react'
import { format } from 'date-fns'
import { LogOut, Shield } from 'lucide-react'
import Link from 'next/link'

interface Props {
  user: { name: string; email: string; role: string }
}

export default function TopBar({ user }: Props) {
  const today = format(new Date(), 'EEEE, MMM d')

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 pb-3">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Left: greeting */}
        <div>
          <p className="text-xs text-white/40 font-mono">{today}</p>
          <h2 className="text-base font-semibold text-white font-body leading-tight">
            Hey, {user.name.split(' ')[0]} 👋
          </h2>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {user.role === 'admin' && (
            <Link href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-aurora-yellow transition-all"
              style={{ background: 'rgba(255,214,10,0.1)', border: '1px solid rgba(255,214,10,0.2)' }}>
              <Shield size={12} />
              Admin
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="flex items-center justify-center w-8 h-8 rounded-xl transition-all hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <LogOut size={14} className="text-white/40" />
          </button>
        </div>
      </div>
    </header>
  )
}
