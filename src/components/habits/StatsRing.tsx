'use client'

import { format } from 'date-fns'

interface Props {
  completed: number
  total: number
  loading: boolean
}

export default function StatsRing({ completed, total, loading }: Props) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  const greeting = getGreeting()
  const motivational = getMotivational(pct)

  if (loading) {
    return <div className="skeleton h-48 rounded-3xl" />
  }

  return (
    <div className="relative rounded-3xl p-6 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(26,26,36,0.9), rgba(17,17,24,0.9))',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] pointer-events-none"
        style={{ background: pct === 100 ? 'rgba(0,255,136,0.15)' : 'rgba(0,212,255,0.08)' }} />

      <div className="flex items-center gap-6 relative z-10">
        {/* Ring */}
        <div className="flex-shrink-0 relative">
          <svg width="140" height="140" className="progress-ring">
            {/* Background track */}
            <circle cx="70" cy="70" r={radius}
              fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            {/* Progress */}
            <circle cx="70" cy="70" r={radius}
              fill="none"
              stroke="url(#progressGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
            />
            <defs>
              <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00FF88" />
                <stop offset="100%" stopColor="#00D4FF" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-bold text-white">{pct}%</span>
            <span className="text-[10px] text-white/40">{completed}/{total}</span>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1">
          <p className="text-xs text-white/40 font-mono mb-1">{format(new Date(), 'EEEE')}</p>
          <h1 className="font-display text-2xl font-black text-white leading-tight mb-2">
            {greeting}
          </h1>
          <p className="text-sm text-white/60 font-body leading-relaxed">
            {motivational}
          </p>

          {pct === 100 && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }}>
              <span>🎉</span> All done today!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning!'
  if (h < 17) return 'Good afternoon!'
  return 'Good evening!'
}

function getMotivational(pct: number): string {
  if (pct === 0) return "Every great day starts with the first step. Let's go!"
  if (pct < 30) return "You've started — that's the hardest part. Keep moving!"
  if (pct < 60) return "Great progress! You're building momentum."
  if (pct < 100) return "Almost there! Finish strong today."
  return "You crushed it today! Your future self thanks you."
}
