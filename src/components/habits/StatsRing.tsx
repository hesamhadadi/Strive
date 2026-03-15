'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface Props {
  completed: number
  total: number
  loading: boolean
  streak: number
}

export default function StatsRing({ completed, total, loading, streak }: Props) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Still up? 🌙' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night'
  const dayName = format(new Date(), 'EEEE, MMMM d')

  if (loading) {
    return (
      <div className="skeleton rounded-3xl" style={{ height: '220px' }} />
    )
  }

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #13131e 0%, #0d0d18 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        minHeight: '200px',
      }}
    >
      {/* Animated gradient orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-40px', right: '-40px',
          width: '200px', height: '200px',
          borderRadius: '50%',
          background: pct === 100
            ? 'radial-gradient(circle, rgba(0,255,136,0.18), transparent 70%)'
            : 'radial-gradient(circle, rgba(0,212,255,0.12), transparent 70%)',
          transition: 'background 1s ease',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-30px', left: '20px',
          width: '150px', height: '150px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)',
        }}
      />

      {/* Top strip: date */}
      <div
        className="px-5 pt-4 pb-0 flex items-center justify-between"
        style={{ position: 'relative', zIndex: 10 }}
      >
        <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {dayName}
        </span>
        {streak > 0 && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{
              background: 'rgba(255,107,53,0.15)',
              border: '1px solid rgba(255,107,53,0.3)',
              color: '#FF6B35',
            }}
          >
            <span style={{ animation: 'streak_fire 1s ease-in-out infinite', display: 'inline-block' }}>🔥</span>
            {streak} day streak
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="px-5 pb-5 pt-3 flex items-center gap-5" style={{ position: 'relative', zIndex: 10 }}>
        {/* SVG Ring */}
        <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
            {/* Glow filter */}
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00FF88" />
                <stop offset="50%" stopColor="#00D4FF" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="9"
            />
            {/* Animated progress */}
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={mounted ? offset : circumference}
              filter="url(#glow)"
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)' }}
            />
          </svg>
          {/* Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {pct === 100 ? (
              <span style={{ fontSize: 32 }}>🎉</span>
            ) : (
              <>
                <span className="font-mono font-black text-white" style={{ fontSize: 22, lineHeight: 1 }}>
                  {pct}%
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                  {completed}/{total}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side text */}
        <div className="flex-1 min-w-0">
          <p className="font-body font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            {greeting} 👋
          </p>
          <h1
            className="font-display font-black text-white leading-tight"
            style={{ fontSize: 22 }}
          >
            {getTitle(pct, total)}
          </h1>
          <p className="font-body mt-2 leading-snug" style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            {getSubtitle(pct, completed, total)}
          </p>

          {/* Progress pills */}
          {total > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-500"
                  style={{
                    width: 8,
                    height: 8,
                    background: i < completed
                      ? 'linear-gradient(135deg, #00FF88, #00D4FF)'
                      : 'rgba(255,255,255,0.1)',
                    boxShadow: i < completed ? '0 0 6px rgba(0,255,136,0.5)' : 'none',
                    transitionDelay: `${i * 80}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar — only when 100% */}
      {pct === 100 && (
        <div
          className="mx-4 mb-4 px-4 py-2.5 rounded-2xl flex items-center gap-2"
          style={{
            background: 'rgba(0,255,136,0.1)',
            border: '1px solid rgba(0,255,136,0.2)',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: 14 }}>✨</span>
          <p className="text-xs font-semibold" style={{ color: '#00FF88' }}>
            Perfect day! All habits completed.
          </p>
        </div>
      )}
    </div>
  )
}

function getTitle(pct: number, total: number): string {
  if (total === 0) return "Let's set up!"
  if (pct === 0) return "Start your day"
  if (pct < 40) return "Getting started"
  if (pct < 75) return "On a roll! 💪"
  if (pct < 100) return "Almost there!"
  return "Day complete!"
}

function getSubtitle(pct: number, completed: number, total: number): string {
  if (total === 0) return "Add your first habit in the Habits tab"
  if (pct === 0) return "Every journey starts with one step. Tap a habit to begin!"
  if (pct < 40) return `${completed} down, ${total - completed} to go. You've got this!`
  if (pct < 75) return `More than halfway! Keep the momentum going.`
  if (pct < 100) return `Just ${total - completed} habit${total - completed > 1 ? 's' : ''} left. Finish strong!`
  return "You crushed every habit today. Your future self thanks you! 🚀"
}
