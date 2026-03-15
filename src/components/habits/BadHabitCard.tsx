'use client'

interface Habit {
  _id: string
  name: string
  icon: string
  color: string
  cleanDays: string[]
  costPerDay?: number
  currency?: string
}

interface Props {
  habit: Habit
  today: string
  onToggle: () => void
}

const HEALTH_MILESTONES: { days: number; text: string }[] = [
  { days: 1, text: 'Heart rate normalizing' },
  { days: 3, text: 'Nicotine cleared from body' },
  { days: 7, text: 'Taste & smell improving' },
  { days: 14, text: 'Circulation improved' },
  { days: 30, text: 'Lung function up 30%' },
  { days: 90, text: 'Coughing & fatigue reduced' },
  { days: 365, text: 'Heart disease risk halved' },
]

export default function BadHabitCard({ habit, today, onToggle }: Props) {
  const cleanToday = habit.cleanDays.includes(today)
  const totalCleanDays = habit.cleanDays.length
  const moneySaved = totalCleanDays * (habit.costPerDay || 0)

  const nextMilestone = HEALTH_MILESTONES.find(m => m.days > totalCleanDays)
  const latestMilestone = [...HEALTH_MILESTONES].reverse().find(m => m.days <= totalCleanDays)

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(26,26,36,0.9)',
        border: `1px solid ${cleanToday ? 'rgba(0,255,136,0.3)' : 'rgba(255,107,53,0.2)'}`,
      }}>
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)' }}>
            {habit.icon}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-white font-body">{habit.name}</p>
            <p className="text-xs text-white/40">
              {totalCleanDays === 0 ? 'Start your journey today' : `${totalCleanDays} clean day${totalCleanDays !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Toggle button */}
          <button onClick={onToggle}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95"
            style={cleanToday
              ? { background: 'rgba(0,255,136,0.15)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)' }
              : { background: 'rgba(255,107,53,0.1)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.2)' }
            }>
            {cleanToday ? '✓ Clean!' : 'Mark clean'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {totalCleanDays > 0 && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2 mt-1">
            {/* Money saved */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)' }}>
              <p className="text-xs text-white/40 mb-1">💰 Money saved</p>
              <p className="text-lg font-bold font-mono" style={{ color: '#00FF88' }}>
                {habit.currency}{moneySaved.toFixed(0)}
              </p>
              <p className="text-[10px] text-white/30">{habit.currency}{habit.costPerDay}/day × {totalCleanDays} days</p>
            </div>

            {/* Health */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
              <p className="text-xs text-white/40 mb-1">🫁 Health</p>
              {latestMilestone ? (
                <p className="text-xs font-medium text-aurora-teal leading-tight">{latestMilestone.text}</p>
              ) : (
                <p className="text-xs text-white/30">Keep going...</p>
              )}
              {nextMilestone && (
                <p className="text-[10px] text-white/25 mt-1">
                  Next: day {nextMilestone.days}
                </p>
              )}
            </div>
          </div>

          {/* Streak progress bar */}
          {nextMilestone && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-white/30 mb-1">
                <span>Day {totalCleanDays}</span>
                <span>Goal: day {nextMilestone.days} — {nextMilestone.text}</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min((totalCleanDays / nextMilestone.days) * 100, 100)}%`,
                    background: 'linear-gradient(90deg, #00FF88, #00D4FF)',
                  }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
