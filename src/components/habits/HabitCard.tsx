'use client'

interface Habit {
  _id: string
  name: string
  icon: string
  color: string
  category: string
  completions: string[]
}

interface Props {
  habit: Habit
  today: string
  onToggle: () => void
  highlight?: boolean
}

export default function HabitCard({ habit, today, onToggle, highlight }: Props) {
  const done = habit.completions.includes(today)
  const streak = calculateStreak(habit.completions, today)

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left group active:scale-[0.97] transition-all duration-200"
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
        </div>
      </div>

      {/* Checkbox */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
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
      </div>
    </button>
  )
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
