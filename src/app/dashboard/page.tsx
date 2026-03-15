'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import HabitCard from '@/components/habits/HabitCard'
import BadHabitCard from '@/components/habits/BadHabitCard'
import StatsRing from '@/components/habits/StatsRing'
import QuickTodo from '@/components/todos/QuickTodo'

interface Habit {
  _id: string
  name: string
  type: 'good' | 'bad'
  icon: string
  color: string
  category: string
  completions: string[]
  cleanDays: string[]
  costPerDay?: number
  currency?: string
}

export default function DashboardPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  async function fetchHabits() {
    const res = await fetch('/api/habits')
    const data = await res.json()
    setHabits(data)
    setLoading(false)
  }

  useEffect(() => { fetchHabits() }, [])

  async function toggleHabit(id: string, action: string) {
    // Optimistic update
    setHabits(prev => prev.map(h => {
      if (h._id !== id) return h
      if (action === 'toggle_completion') {
        const has = h.completions.includes(today)
        return { ...h, completions: has ? h.completions.filter(d => d !== today) : [...h.completions, today] }
      }
      if (action === 'toggle_clean') {
        const has = h.cleanDays.includes(today)
        return { ...h, cleanDays: has ? h.cleanDays.filter(d => d !== today) : [...h.cleanDays, today] }
      }
      return h
    }))

    await fetch(`/api/habits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, action }),
    })
  }

  const goodHabits = habits.filter(h => h.type === 'good')
  const badHabits = habits.filter(h => h.type === 'bad')
  const completedCount = goodHabits.filter(h => h.completions.includes(today)).length
  const totalGood = goodHabits.length

  return (
    <div className="max-w-lg mx-auto px-4 space-y-6">
      {/* Progress ring + summary */}
      <div className="pt-2">
        <StatsRing completed={completedCount} total={totalGood} loading={loading} />
      </div>

      {/* Good habits */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold text-white">Good Habits</h2>
          <span className="text-xs text-white/40 font-mono">{completedCount}/{totalGood} done</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        ) : goodHabits.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-sm">
            No good habits yet — add some in Habits tab!
          </div>
        ) : (
          <div className="space-y-3">
            {goodHabits.map(habit => (
              <HabitCard
                key={habit._id}
                habit={habit}
                today={today}
                onToggle={() => toggleHabit(habit._id, 'toggle_completion')}
              />
            ))}
          </div>
        )}
      </section>

      {/* Bad habits */}
      {badHabits.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-white">Breaking Bad</h2>
            <span className="text-xs text-aurora-green font-mono">Track free days</span>
          </div>
          <div className="space-y-3">
            {badHabits.map(habit => (
              <BadHabitCard
                key={habit._id}
                habit={habit}
                today={today}
                onToggle={() => toggleHabit(habit._id, 'toggle_clean')}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick todos */}
      <section>
        <h2 className="font-display text-lg font-bold text-white mb-3">Today's Tasks</h2>
        <QuickTodo />
      </section>
    </div>
  )
}
