'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
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
  const [justChecked, setJustChecked] = useState<string | null>(null)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    fetch('/api/habits')
      .then(r => r.json())
      .then(d => { setHabits(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function toggleHabit(id: string, action: string) {
    setJustChecked(id)
    setTimeout(() => setJustChecked(null), 600)

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

  // Calculate streak
  const streak = calcStreak(goodHabits, today)

  // Total money saved from bad habits
  const totalSaved = badHabits.reduce((sum, h) => sum + h.cleanDays.length * (h.costPerDay || 0), 0)
  const currency = badHabits[0]?.currency || '€'

  return (
    <div className="max-w-lg mx-auto px-4 space-y-5 pb-4">

      {/* ── Hero progress card ── */}
      <div className="pt-1">
        <StatsRing
          completed={completedCount}
          total={totalGood}
          loading={loading}
          streak={streak}
        />
      </div>

      {/* ── Quick summary chips ── */}
      {!loading && (badHabits.length > 0 || streak > 0) && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {streak > 1 && (
            <Chip icon="🔥" label={`${streak}-day streak`} color="#FF6B35" />
          )}
          {badHabits.length > 0 && totalSaved > 0 && (
            <Chip icon="💰" label={`${currency}${totalSaved.toFixed(0)} saved`} color="#00FF88" />
          )}
          {completedCount === totalGood && totalGood > 0 && (
            <Chip icon="🏆" label="All habits done!" color="#FFD60A" />
          )}
          {badHabits.filter(h => h.cleanDays.includes(today)).length > 0 && (
            <Chip icon="✨" label="Clean day!" color="#8B5CF6" />
          )}
        </div>
      )}

      {/* ── Good habits section ── */}
      <section>
        <SectionHeader
          title="Good Habits"
          badge={loading ? undefined : `${completedCount}/${totalGood}`}
          badgeColor={completedCount === totalGood && totalGood > 0 ? '#00FF88' : undefined}
          href="/dashboard/habits"
        />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-[72px] rounded-2xl" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : goodHabits.length === 0 ? (
          <EmptyState
            icon="✨"
            text="No good habits yet"
            action="Add your first habit"
            href="/dashboard/habits"
          />
        ) : (
          <div className="space-y-2.5">
            {goodHabits.map((habit, idx) => (
              <div
                key={habit._id}
                style={{
                  animation: 'slide_up 0.4s ease-out both',
                  animationDelay: `${idx * 0.06}s`,
                }}
              >
                <HabitCard
                  habit={habit}
                  today={today}
                  onToggle={() => toggleHabit(habit._id, 'toggle_completion')}
                  highlight={justChecked === habit._id}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Breaking bad section ── */}
      {!loading && badHabits.length > 0 && (
        <section>
          <SectionHeader
            title="Breaking Bad"
            badge="Track free days"
            badgeColor="#FF6B35"
          />
          <div className="space-y-2.5">
            {badHabits.map((habit, idx) => (
              <div
                key={habit._id}
                style={{
                  animation: 'slide_up 0.4s ease-out both',
                  animationDelay: `${idx * 0.08}s`,
                }}
              >
                <BadHabitCard
                  habit={habit}
                  today={today}
                  onToggle={() => toggleHabit(habit._id, 'toggle_clean')}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Today's tasks ── */}
      <section>
        <SectionHeader
          title="Today's Tasks"
          href="/dashboard/todos"
        />
        <QuickTodo />
      </section>

    </div>
  )
}

/* ─── Sub-components ─── */

function SectionHeader({
  title, badge, badgeColor, href
}: {
  title: string
  badge?: string
  badgeColor?: string
  href?: string
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display font-bold text-white" style={{ fontSize: 18 }}>{title}</h2>
      <div className="flex items-center gap-2">
        {badge && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full font-mono"
            style={{
              background: badgeColor ? badgeColor + '18' : 'rgba(255,255,255,0.07)',
              color: badgeColor || 'rgba(255,255,255,0.45)',
              border: `1px solid ${badgeColor ? badgeColor + '35' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {badge}
          </span>
        )}
        {href && (
          <Link href={href}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <ArrowRight size={13} style={{ color: 'rgba(255,255,255,0.4)' }} />
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}

function Chip({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div
      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{
        background: color + '15',
        border: `1px solid ${color}30`,
        color,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  )
}

function EmptyState({ icon, text, action, href }: { icon: string; text: string; action: string; href: string }) {
  return (
    <Link href={href}>
      <div
        className="flex flex-col items-center justify-center py-8 rounded-2xl transition-all hover:bg-white/5 cursor-pointer"
        style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
      >
        <span style={{ fontSize: 28, marginBottom: 8 }}>{icon}</span>
        <p className="text-sm font-body" style={{ color: 'rgba(255,255,255,0.3)' }}>{text}</p>
        <p className="text-xs mt-1 font-semibold" style={{ color: '#00FF88' }}>{action} →</p>
      </div>
    </Link>
  )
}

/* ─── Helper ─── */
function calcStreak(goodHabits: Habit[], today: string): number {
  if (goodHabits.length === 0) return 0
  let streak = 0
  const d = new Date(today)
  while (true) {
    const dateStr = d.toISOString().split('T')[0]
    const allDone = goodHabits.every(h => h.completions.includes(dateStr))
    if (!allDone) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
