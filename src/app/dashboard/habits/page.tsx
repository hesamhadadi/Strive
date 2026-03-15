'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'

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

const ICONS = ['💧', '💊', '🏃', '📚', '🧘', '🍎', '😴', '🚶', '🏋️', '✍️', '🎯', '🌿', '☕', '🚴', '🧘‍♂️', '🎨', '🎵', '🙏', '🚭', '🍺', '📵', '🍔']
const COLORS = ['#00FF88', '#00D4FF', '#8B5CF6', '#FF6B35', '#FFD60A', '#FF006E', '#00BFA5', '#FF8C00']
const CATEGORIES = ['Health', 'Fitness', 'Mind', 'Nutrition', 'Social', 'Productivity', 'Finance', 'Other']

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '', type: 'good' as 'good' | 'bad',
    icon: '⭐', color: '#00FF88', category: 'Health',
    costPerDay: 5, currency: '€',
  })

  useEffect(() => {
    fetch('/api/habits').then(r => r.json()).then(d => { setHabits(d); setLoading(false) })
  }, [])

  async function addHabit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const habit = await res.json()
    setHabits(prev => [...prev, habit])
    setShowForm(false)
    setForm({ name: '', type: 'good', icon: '⭐', color: '#00FF88', category: 'Health', costPerDay: 5, currency: '€' })
  }

  async function deleteHabit(id: string) {
    if (!confirm('Delete this habit?')) return
    setHabits(prev => prev.filter(h => h._id !== id))
    await fetch(`/api/habits/${id}`, { method: 'DELETE' })
  }

  const goodHabits = habits.filter(h => h.type === 'good')
  const badHabits = habits.filter(h => h.type === 'bad')

  return (
    <div className="max-w-lg mx-auto px-4 space-y-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-white">My Habits</h1>
          <p className="text-sm text-white/40">{habits.length} habits tracked</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-ink transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)' }}>
          <Plus size={16} strokeWidth={2.5} />
          Add Habit
        </button>
      </div>

      {/* Good habits */}
      <section>
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
          ✅ Good Habits ({goodHabits.length})
        </h2>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-2">
            {goodHabits.map(h => (
              <HabitRow key={h._id} habit={h} onDelete={() => deleteHabit(h._id)} />
            ))}
          </div>
        )}
      </section>

      {/* Bad habits */}
      <section>
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
          🚫 Bad Habits to Break ({badHabits.length})
        </h2>
        <div className="space-y-2">
          {badHabits.map(h => (
            <HabitRow key={h._id} habit={h} onDelete={() => deleteHabit(h._id)} />
          ))}
        </div>
      </section>

      {/* Add Habit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="w-full max-w-lg rounded-t-3xl p-6 pb-8 animate-slide_up"
            style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-bold">New Habit</h3>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={addHabit} className="space-y-4">
              {/* Type toggle */}
              <div className="flex rounded-xl overflow-hidden p-1"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {(['good', 'bad'] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={form.type === t
                      ? { background: t === 'good' ? 'rgba(0,255,136,0.2)' : 'rgba(255,107,53,0.2)', color: t === 'good' ? '#00FF88' : '#FF6B35' }
                      : { color: 'rgba(255,255,255,0.4)' }
                    }>
                    {t === 'good' ? '✅ Good habit' : '🚫 Bad habit'}
                  </button>
                ))}
              </div>

              {/* Name */}
              <input
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required placeholder="Habit name..."
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />

              {/* Icon picker */}
              <div>
                <label className="text-xs text-white/40 mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all"
                      style={{
                        background: form.icon === icon ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.04)',
                        border: form.icon === icon ? '1px solid rgba(0,255,136,0.4)' : '1px solid rgba(255,255,255,0.06)',
                      }}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="text-xs text-white/40 mb-2 block">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setForm(f => ({ ...f, color }))}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{
                        background: color,
                        boxShadow: form.color === color ? `0 0 12px ${color}80` : 'none',
                        transform: form.color === color ? 'scale(1.2)' : 'scale(1)',
                      }} />
                  ))}
                </div>
              </div>

              {/* Category */}
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Bad habit extras */}
              {form.type === 'bad' && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-white/40 mb-1 block">Daily cost</label>
                    <input type="number" step="0.5" value={form.costPerDay}
                      onChange={e => setForm(f => ({ ...f, costPerDay: +e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-xs text-white/40 mb-1 block">Currency</label>
                    <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                      className="w-full px-2 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {['€', '$', '£', '₺', 'CHF'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <button type="submit"
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-ink transition-all"
                style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)' }}>
                Add Habit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function HabitRow({ habit, onDelete }: { habit: Habit; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl group transition-all"
      style={{ background: 'rgba(26,26,36,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: habit.color + '15', border: `1px solid ${habit.color}30` }}>
        {habit.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{habit.name}</p>
        <p className="text-xs text-white/35">{habit.category} • {habit.type === 'bad' ? `${habit.currency}${habit.costPerDay}/day` : `${habit.completions.length} completions`}</p>
      </div>
      <button onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-all w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-500/10">
        <Trash2 size={14} className="text-red-400" />
      </button>
    </div>
  )
}
