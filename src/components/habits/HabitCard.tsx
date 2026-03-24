'use client'

interface Habit {
  _id: string
  name: string
  icon: string
  color: string
  category: string
  completions: string[]
  weeklyTarget?: number
}

interface Props {
  habit: Habit
  today: string
  onToggle: () => void
  highlight?: boolean
  onMissedLog?: () => void
}

export default function HabitCard({ habit, today, onToggle, highlight, onMissedLog }: Props) {
  const done = habit.completions.includes(today)
  const streak = calculateStreak(habit.completions, today)
  const bestStreak = calculateBestStreak(habit.completions)
  const weeklyCompleted = countThisWeek(habit.completions, today)
  const weeklyTarget = habit.weeklyTarget || 7

  return (
    <div
      onClick={onToggle}
      className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left group transition-all duration-200"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onToggle()
      }}
      style={{
        background: done
          ? `linear-gradient(135deg, ${habit.color}14, ${habit.color}06)`
          : 'rgba(22,22,32,0.9)',
        border: `1px solid ${done ? habit.color + '35' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: highlight
          ? `0 0 0 2px ${habit.color}60, 0 0 30px ${habit.color}20`
          : done
          ? `0 0 20px ${habit.color}10`
          : 'none',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Icon bubble */}
      <div
        className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl"
        style={{
          background: done ? `${habit.color}18` : 'rgba(255,255,255,0.05)',
          border: `1px solid ${done ? habit.color + '25' : 'rgba(255,255,255,0.07)'}`,
          transition: 'all 0.2s',
        }}
      >
        {habit.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 text-left">
        <p
          className="font-medium text-sm font-body truncate"
          style={{
            color: done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.9)',
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {habit.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>{habit.category}</span>
          {streak > 1 && (
            <span
              className="flex items-center gap-0.5 font-semibold"
              style={{ fontSize: 11, color: '#FF6B35' }}
            >
              🔥 {streak}d
            </span>
          )}
          {bestStreak > streak && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>Best {bestStreak}d</span>
          )}
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>
            {weeklyCompleted}/{weeklyTarget} wk
          </span>
        </div>
      </div>

      {/* Checkbox */}
      <div className="flex-shrink-0 flex items-center gap-1.5">
        {!done && onMissedLog && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onMissedLog()
            }}
            className="px-2 py-1 rounded-lg text-[10px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Why missed?
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95"
          style={{
            background: done ? habit.color : 'transparent',
            border: `2px solid ${done ? habit.color : 'rgba(255,255,255,0.18)'}`,
            boxShadow: done ? `0 0 14px ${habit.color}55` : 'none',
            transform: highlight && done ? 'scale(1.2)' : 'scale(1)',
          }}
        >
          {done && (
            <svg
              className="animate-check_bounce"
              width="13" height="13" viewBox="0 0 13 13" fill="none"
            >
              <path d="M2.5 6.5L5 9L10.5 4" stroke="#0A0A0F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

function countThisWeek(completions: string[], today: string): number {
  const current = new Date(today)
  const day = current.getDay()
  const diffToMonday = (day + 6) % 7
  const monday = new Date(current)
  monday.setDate(current.getDate() - diffToMonday)
  monday.setHours(0, 0, 0, 0)

  return completions.filter(date => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d >= monday && d <= current
  }).length
}

function calculateStreak(completions: string[], today: string): number {
  let streak = 0
  const d = new Date(today)
  while (true) {
    const dateStr = d.toISOString().split('T')[0]
    if (!completions.includes(dateStr)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function calculateBestStreak(completions: string[]): number {
  if (completions.length === 0) return 0
  const dates = [...new Set(completions)].sort()
  let best = 1
  let current = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const next = new Date(dates[i])
    prev.setDate(prev.getDate() + 1)
    if (prev.toISOString().split('T')[0] === next.toISOString().split('T')[0]) {
      current++
      if (current > best) best = current
    } else {
      current = 1
    }
  }
  return best
}
