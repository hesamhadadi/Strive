'use client'

import { useEffect, useState } from 'react'

interface StatsData {
  totalGoodHabits: number
  completedToday: number
  streak: number
  personalBestStreak: number
  badHabitStats: { id: string; name: string; cleanDays: number; moneySaved: number; currency: string }[]
  weeklyData: { date: string; completed: number; total: number }[]
  todosCompleted: number
  todosPending: number
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 space-y-4 pt-2">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-32 rounded-3xl" />)}
      </div>
    )
  }

  if (!stats) return null

  const todayPct = stats.totalGoodHabits === 0 ? 0 : Math.round((stats.completedToday / stats.totalGoodHabits) * 100)
  const maxWeekly = Math.max(...stats.weeklyData.map(d => d.total), 1)

  return (
    <div className="max-w-lg mx-auto px-4 pt-2 space-y-4">
      <h1 className="font-display text-2xl font-black text-white">Statistics</h1>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Today's Progress"
          value={`${todayPct}%`}
          sub={`${stats.completedToday}/${stats.totalGoodHabits} habits`}
          color="#00FF88"
          icon="🎯"
        />
        <StatCard
          label="Current Streak"
          value={`${stats.streak}`}
          sub={`Best ${stats.personalBestStreak}d`}
          color="#FF6B35"
          icon="🔥"
        />
        <StatCard
          label="Tasks Done"
          value={`${stats.todosCompleted}`}
          sub={`${stats.todosPending} pending`}
          color="#8B5CF6"
          icon="✅"
        />
        <StatCard
          label="Total Savings"
          value={stats.badHabitStats.length > 0
            ? `${stats.badHabitStats[0].currency}${stats.badHabitStats.reduce((s, h) => s + h.moneySaved, 0).toFixed(0)}`
            : '—'}
          sub="from bad habits"
          color="#00D4FF"
          icon="💰"
        />
      </div>

      {/* Weekly bar chart */}
      <div className="p-5 rounded-3xl"
        style={{ background: 'rgba(26,26,36,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="font-semibold text-sm text-white mb-4">Weekly Overview</h2>
        <div className="flex items-end justify-between gap-2 h-28">
          {stats.weeklyData.map((day, i) => {
            const pct = day.total === 0 ? 0 : (day.completed / day.total) * 100
            const dayName = new Date(day.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })
            const isToday = i === stats.weeklyData.length - 1
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-lg overflow-hidden flex-1 flex flex-col justify-end"
                  style={{ background: 'rgba(255,255,255,0.04)', height: '80px' }}>
                  <div className="w-full rounded-lg transition-all duration-700"
                    style={{
                      height: `${pct}%`,
                      minHeight: pct > 0 ? '4px' : '0',
                      background: isToday
                        ? 'linear-gradient(180deg, #00FF88, #00D4FF)'
                        : pct === 100 ? '#00FF8840' : 'rgba(255,255,255,0.1)',
                    }} />
                </div>
                <span className="text-[10px] font-mono"
                  style={{ color: isToday ? '#00FF88' : 'rgba(255,255,255,0.3)' }}>
                  {dayName}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bad habits savings */}
      {stats.badHabitStats.length > 0 && (
        <div className="p-5 rounded-3xl"
          style={{ background: 'rgba(26,26,36,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-semibold text-sm text-white mb-4">Bad Habits Progress</h2>
          <div className="space-y-4">
            {stats.badHabitStats.map(h => (
              <div key={h.id}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white/80">{h.name}</span>
                  <div className="flex gap-3 text-xs font-mono">
                    <span style={{ color: '#00FF88' }}>{h.currency}{h.moneySaved.toFixed(0)} saved</span>
                    <span style={{ color: '#00D4FF' }}>{h.cleanDays}d clean</span>
                  </div>
                </div>
                {/* Simple progress bar showing clean days */}
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full"
                    style={{
                      width: `${Math.min((h.cleanDays / 30) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #00FF88, #00D4FF)',
                    }} />
                </div>
                <p className="text-[10px] text-white/25 mt-1">{h.cleanDays}/30 days milestone</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Motivational footer */}
      <div className="py-4 text-center">
        <p className="text-white/20 text-xs font-mono">
          "You don't rise to the level of your goals, you fall to the level of your systems."
        </p>
        <p className="text-white/15 text-[10px] mt-1">— James Clear</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub: string; color: string; icon: string
}) {
  return (
    <div className="p-4 rounded-2xl relative overflow-hidden"
      style={{
        background: 'rgba(26,26,36,0.9)',
        border: `1px solid ${color}20`,
      }}>
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl pointer-events-none"
        style={{ background: color + '20' }} />
      <p className="text-2xl mb-2">{icon}</p>
      <p className="font-mono text-2xl font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/40 mt-0.5">{sub}</p>
      <p className="text-[10px] text-white/25 mt-1">{label}</p>
    </div>
  )
}
