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
}

export default function HabitCard({ habit, today, onToggle }: Props) {
  const done = habit.completions.includes(today)
  const streak = calculateStreak(habit.completions, today)

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group active:scale-[0.98]"
      style={{
        background: done
          ? `linear-gradient(135deg, ${habit.color}18, ${habit.color}08)`
          : 'rgba(26,26,36,0.8)',
        border: `1px solid ${done ? habit.color + '40' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: done ? `0 0 20px ${habit.color}15` : 'none',
      }}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-active:scale-95"
        style={{
          background: done ? `${habit.color}20` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${done ? habit.color + '30' : 'rgba(255,255,255,0.06)'}`,
        }}>
        {habit.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-white font-body truncate"
          style={{ textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.7 : 1 }}>
          {habit.name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {habit.category}
          {streak > 1 && (
            <span className="ml-2" style={{ color: '#FF6B35' }}>
              🔥 {streak} day streak
            </span>
          )}
        </p>
      </div>

      {/* Checkbox */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          background: done ? habit.color : 'transparent',
          border: `2px solid ${done ? habit.color : 'rgba(255,255,255,0.2)'}`,
          boxShadow: done ? `0 0 12px ${habit.color}60` : 'none',
        }}>
        {done && (
          <svg className="animate-check_bounce" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="#0A0A0F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </button>
  )
}

function calculateStreak(completions: string[], today: string): number {
  let streak = 0
  let d = new Date(today)
  while (true) {
    const dateStr = d.toISOString().split('T')[0]
    if (!completions.includes(dateStr)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
