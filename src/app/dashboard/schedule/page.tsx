'use client'

import { useEffect, useState } from 'react'
import { addDays, format } from 'date-fns'
import { getUpcomingDates, type HabitInsightShape } from '@/lib/habitInsights'

interface Habit extends HabitInsightShape {
  _id: string
  icon: string
  color: string
  category: string
}

export default function SchedulePage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    fetch('/api/habits')
      .then(r => r.json())
      .then(data => {
        setHabits(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const days = Array.from({ length: 7 }, (_, index) => format(addDays(new Date(), index), 'yyyy-MM-dd'))

  return (
    <div className="max-w-lg mx-auto px-4 pt-2 space-y-4">
      <div>
        <h1 className="font-display text-2xl font-black text-white">Schedule</h1>
        <p className="text-sm text-white/35">Calendar-style view for reminders, check-ins and monthly habits</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-36 rounded-3xl" />)}</div>
      ) : (
        days.map(date => {
          const items = habits.filter(habit => getUpcomingDates(habit, date, 1).includes(date))
          return (
            <section key={date} className="rounded-3xl p-5 bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-white">
                    {new Date(`${date}T00:00:00`).toLocaleDateString('en', { weekday: 'long' })}
                  </h2>
                  <p className="text-xs text-white/35">{date}</p>
                </div>
                {date === today && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                    Today
                  </span>
                )}
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-white/30">No habit scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {items.map(habit => (
                    <div key={`${date}-${habit._id}`} className="rounded-2xl p-4 bg-black/20 border border-white/5">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                          style={{ background: habit.color + '18', border: `1px solid ${habit.color}30` }}
                        >
                          {habit.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-white">{habit.name}</p>
                            <span className="text-[10px] text-white/35">{habit.reminderTime || 'No time set'}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Tag text={habit.category} color="#00D4FF" />
                            {habit.locationLabel ? <Tag text={habit.locationLabel} color="#FFD60A" /> : null}
                            {habit.durationTargetMinutes ? <Tag text={`${habit.durationTargetMinutes} min`} color="#00FF88" /> : null}
                            {habit.type === 'bad' ? <Tag text="Break habit" color="#FF6B35" /> : <Tag text="Build habit" color="#8B5CF6" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })
      )}
    </div>
  )
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: color + '15', border: `1px solid ${color}25`, color }}>
      {text}
    </span>
  )
}
