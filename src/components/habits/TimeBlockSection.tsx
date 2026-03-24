'use client'

import { useState } from 'react'
import HabitCard from './HabitCard'

interface Habit {
  _id: string
  name: string
  type: 'good' | 'bad'
  icon: string
  color: string
  category: string
  completions: string[]
  weeklyTarget?: number
  cleanDays: string[]
}

interface Props {
  title: string
  emoji: string
  habits: Habit[]
  today: string
  defaultExpanded: boolean
  alwaysOpen?: boolean
  onToggleHabit: (id: string) => void
  highlightHabitId?: string | null
  onOpenMissedJournal: (habitId: string) => void
}

export default function TimeBlockSection({
  title,
  emoji,
  habits,
  today,
  defaultExpanded,
  alwaysOpen,
  onToggleHabit,
  highlightHabitId,
  onOpenMissedJournal,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded || !!alwaysOpen)
  const done = habits.filter(h => h.completions.includes(today)).length
  const total = habits.length
  const progress = total === 0 ? 0 : Math.round((done / total) * 100)

  if (habits.length === 0) return null

  return (
    <section className="rounded-2xl p-3" style={{ background: 'rgba(26,26,36,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        className="w-full flex items-center justify-between gap-2"
        onClick={() => !alwaysOpen && setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <span>{emoji}</span>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <span className="text-[11px] text-white/45 font-mono">{done}/{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <MiniRing pct={progress} />
          {!alwaysOpen && (
            <span className="text-xs text-white/40">{expanded ? '−' : '+'}</span>
          )}
        </div>
      </button>

      {(expanded || alwaysOpen) && (
        <div className="mt-3 space-y-2.5">
          {habits.map(habit => (
            <div key={habit._id}>
              <HabitCard
                habit={habit}
                today={today}
                onToggle={() => onToggleHabit(habit._id)}
                highlight={highlightHabitId === habit._id}
                onMissedLog={() => onOpenMissedJournal(habit._id)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function MiniRing({ pct }: { pct: number }) {
  const radius = 11
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (pct / 100) * circumference
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
      <circle cx="14" cy="14" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
      <circle
        cx="14"
        cy="14"
        r={radius}
        fill="none"
        stroke="#00FF88"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 14 14)"
      />
    </svg>
  )
}
