'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { Pause, Play, Plus, Save, TimerReset, Trash2, X } from 'lucide-react'
import { getDurationForDate, getPeriodStreak, getTwoDayRuleStatus, type HabitMoodLog } from '@/lib/habitInsights'

interface Habit {
  _id: string
  name: string
  type: 'good' | 'bad'
  icon: string
  color: string
  category: string
  completions: string[]
  cleanDays: string[]
  frequency?: 'daily' | 'weekly' | 'monthly'
  scheduledDays?: number[]
  monthlyDays?: number[]
  targetCount?: number
  durationTargetMinutes?: number
  durationLogs?: { date: string; minutes: number }[]
  reminderTime?: string
  locationLabel?: string
  notes?: string
  moodLogs?: HabitMoodLog[]
  twoDayRule?: boolean
  costPerDay?: number
  currency?: string
  weeklyTarget?: number
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime'
}

const ICONS = ['💧', '💊', '🏃', '📚', '🧘', '🍎', '😴', '🚶', '🏋️', '✍️', '🎯', '🌿', '☕', '🚴', '🧘‍♂️', '🎨', '🎵', '🙏', '🚭', '🍺', '📵', '🍔']
const COLORS = ['#00FF88', '#00D4FF', '#8B5CF6', '#FF6B35', '#FFD60A', '#FF006E', '#00BFA5', '#FF8C00']
const CATEGORIES = ['Health', 'Fitness', 'Mind', 'Nutrition', 'Social', 'Productivity', 'Finance', 'Other']
const WEEK_DAYS = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
]
const TIME_OF_DAY_OPTIONS = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'anytime', label: 'Anytime' },
] as const
const MOODS = [
  { value: 1, emoji: '😞', label: 'Low' },
  { value: 2, emoji: '😐', label: 'Off' },
  { value: 3, emoji: '🙂', label: 'Steady' },
  { value: 4, emoji: '😄', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Great' },
]

const initialForm = {
  name: '',
  type: 'good' as 'good' | 'bad',
  icon: '⭐',
  color: '#00FF88',
  category: 'Health',
  frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
  scheduledDays: [1, 2, 3, 4, 5],
  monthlyDays: '1,15',
  targetCount: 1,
  durationTargetMinutes: 0,
  reminderTime: '08:00',
  locationLabel: '',
  notes: '',
  twoDayRule: true,
  costPerDay: 5,
  currency: '€',
  weeklyTarget: 7,
  timeOfDay: 'anytime' as 'morning' | 'afternoon' | 'evening' | 'anytime',
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)
  const [journalNote, setJournalNote] = useState('')
  const [strategyNote, setStrategyNote] = useState('')
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [form, setForm] = useState(initialForm)
  const [activeTimerHabitId, setActiveTimerHabitId] = useState<string | null>(null)
  const timerStartedAt = useRef<number | null>(null)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    fetch('/api/habits').then(r => r.json()).then(d => {
      setHabits(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedHabit) return
    const todayMood = selectedHabit.moodLogs?.find(log => log.date === today)
    setJournalNote(todayMood?.note || '')
    setSelectedMood(todayMood?.mood || null)
    setStrategyNote(selectedHabit.notes || '')
  }, [selectedHabit, today])

  async function addHabit(e: React.FormEvent) {
    e.preventDefault()

    const payload = {
      ...form,
      monthlyDays: form.frequency === 'monthly' ? form.monthlyDays.split(',').map(item => Number(item.trim())).filter(Boolean) : [],
      scheduledDays: form.frequency === 'weekly' ? form.scheduledDays : [],
      durationTargetMinutes: form.durationTargetMinutes > 0 ? form.durationTargetMinutes : undefined,
      targetCount: form.frequency === 'daily' ? 1 : form.targetCount,
      weeklyTarget: form.type === 'good' ? form.weeklyTarget : undefined,
      timeOfDay: form.type === 'good' ? form.timeOfDay : 'anytime',
    }

    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const habit = await res.json()
    setHabits(prev => [...prev, habit])
    setShowForm(false)
    setForm(initialForm)
  }

  async function deleteHabit(id: string) {
    if (!confirm('Delete this habit?')) return
    setHabits(prev => prev.filter(h => h._id !== id))
    await fetch(`/api/habits/${id}`, { method: 'DELETE' })
  }

  async function saveJournal() {
    if (!selectedHabit || !selectedMood) return
    const res = await fetch(`/api/habits/${selectedHabit._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'log_mood', date: today, mood: selectedMood, note: journalNote }),
    })
    const updated = await res.json()
    replaceHabit(updated)
    setSelectedHabit(updated)
  }

  async function saveNotes() {
    if (!selectedHabit) return
    const res = await fetch(`/api/habits/${selectedHabit._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_meta', updates: { notes: strategyNote } }),
    })
    const updated = await res.json()
    replaceHabit(updated)
    setSelectedHabit(updated)
  }

  async function addDuration(minutes: number) {
    if (!selectedHabit) return
    const res = await fetch(`/api/habits/${selectedHabit._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'log_duration', date: today, minutes }),
    })
    const updated = await res.json()
    replaceHabit(updated)
    setSelectedHabit(updated)
  }

  async function toggleTimer() {
    if (!selectedHabit?.durationTargetMinutes) return
    if (activeTimerHabitId === selectedHabit._id && timerStartedAt.current) {
      const elapsedMs = Date.now() - timerStartedAt.current
      const minutes = Math.max(1, Math.round(elapsedMs / 60000))
      timerStartedAt.current = null
      setActiveTimerHabitId(null)
      await addDuration(minutes)
      return
    }
    timerStartedAt.current = Date.now()
    setActiveTimerHabitId(selectedHabit._id)
  }

  function replaceHabit(updatedHabit: Habit) {
    setHabits(prev => prev.map(h => h._id === updatedHabit._id ? updatedHabit : h))
  }

  const goodHabits = habits.filter(h => h.type === 'good')
  const badHabits = habits.filter(h => h.type === 'bad')

  return (
    <div className="max-w-lg mx-auto px-4 space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-white">Habit System</h1>
          <p className="text-sm text-white/40">{habits.length} habits with journaling, reminders and streak logic</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-ink transition-all active:scale-95" style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)' }}>
          <Plus size={16} strokeWidth={2.5} />
          Add Habit
        </button>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Good Habits ({goodHabits.length})</h2>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-2">
            {goodHabits.map(habit => <HabitRow key={habit._id} habit={habit} today={today} onOpen={() => setSelectedHabit(habit)} onDelete={() => deleteHabit(habit._id)} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Bad Habits to Break ({badHabits.length})</h2>
        <div className="space-y-2">
          {badHabits.map(habit => <HabitRow key={habit._id} habit={habit} today={today} onOpen={() => setSelectedHabit(habit)} onDelete={() => deleteHabit(habit._id)} />)}
        </div>
      </section>

      {showForm && (
        <Modal title="New Habit" onClose={() => setShowForm(false)}>
          <form onSubmit={addHabit} className="flex h-full flex-col">
            <div className="space-y-4 overflow-y-auto pr-1 pb-28">
              <TypeToggle value={form.type} onChange={type => setForm(prev => ({ ...prev, type }))} />
              <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} required placeholder="Habit name..." className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none bg-white/5 border border-white/10" />

              <PickerGrid label="Icon" values={ICONS} selected={form.icon} onPick={icon => setForm(prev => ({ ...prev, icon }))} />
              <ColorPicker value={form.color} onPick={color => setForm(prev => ({ ...prev, color }))} />

              <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))} className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none bg-white/5 border border-white/10">
                {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
              </select>

              {form.type === 'good' && (
                <div className="grid grid-cols-2 gap-2">
                  <select value={form.timeOfDay} onChange={e => setForm(prev => ({ ...prev, timeOfDay: e.target.value as typeof prev.timeOfDay }))} className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none bg-white/5 border border-white/10">
                    {TIME_OF_DAY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <input type="number" min="1" max="7" value={form.weeklyTarget} onChange={e => setForm(prev => ({ ...prev, weeklyTarget: Math.max(1, Math.min(7, Number(e.target.value) || 1)) }))} placeholder="Weekly target" className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none bg-white/5 border border-white/10" />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map(frequency => (
                  <button key={frequency} type="button" onClick={() => setForm(prev => ({ ...prev, frequency }))} className="py-2 rounded-xl text-sm font-semibold capitalize" style={form.frequency === frequency ? { background: 'rgba(0,255,136,0.16)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {frequency}
                  </button>
                ))}
              </div>

              {form.frequency === 'weekly' && <DayPicker values={form.scheduledDays} onChange={scheduledDays => setForm(prev => ({ ...prev, scheduledDays }))} />}
              {form.frequency === 'monthly' && <input value={form.monthlyDays} onChange={e => setForm(prev => ({ ...prev, monthlyDays: e.target.value }))} placeholder="Days of month, e.g. 1,15,28" className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none bg-white/5 border border-white/10" />}

              {form.frequency !== 'daily' && (
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Target completions per {form.frequency === 'weekly' ? 'week' : 'month'}</label>
                  <input type="number" min="1" value={form.targetCount} onChange={e => setForm(prev => ({ ...prev, targetCount: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none bg-white/5 border border-white/10" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <input type="number" min="0" value={form.durationTargetMinutes} onChange={e => setForm(prev => ({ ...prev, durationTargetMinutes: Number(e.target.value) }))} placeholder="Timer target (min)" className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none bg-white/5 border border-white/10" />
                <input type="time" value={form.reminderTime} onChange={e => setForm(prev => ({ ...prev, reminderTime: e.target.value }))} className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none bg-white/5 border border-white/10" />
              </div>

              <input value={form.locationLabel} onChange={e => setForm(prev => ({ ...prev, locationLabel: e.target.value }))} placeholder="Location reminder label (e.g. Gym, Office)" className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none bg-white/5 border border-white/10" />
              <textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} placeholder="Notes, cues, reward rules..." className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none bg-white/5 border border-white/10" />

              <label className="flex items-center justify-between rounded-xl px-4 py-3 bg-white/5 border border-white/10">
                <span className="text-sm text-white/70">Keep 2-Day Rule active</span>
                <input type="checkbox" checked={form.twoDayRule} onChange={e => setForm(prev => ({ ...prev, twoDayRule: e.target.checked }))} className="w-5 h-5 rounded-md border border-white/20 bg-transparent" />
              </label>

              {form.type === 'bad' && (
                <div className="flex gap-2">
                  <input type="number" step="0.5" value={form.costPerDay} onChange={e => setForm(prev => ({ ...prev, costPerDay: Number(e.target.value) }))} className="flex-1 px-4 py-3 rounded-xl text-white text-sm outline-none bg-white/5 border border-white/10" />
                  <select value={form.currency} onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))} className="w-24 px-3 py-3 rounded-xl text-white text-sm outline-none bg-white/5 border border-white/10">
                    {['€', '$', '£', '₺', 'CHF'].map(currency => <option key={currency}>{currency}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="modal-safe sticky bottom-0 mt-auto border-t border-white/10 bg-[#111118]/95 pt-4 backdrop-blur">
              <button type="submit" className="w-full py-3.5 rounded-xl font-semibold text-sm text-ink transition-all" style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)' }}>
                Add Habit
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selectedHabit && (
        <Modal title={selectedHabit.name} onClose={() => setSelectedHabit(null)}>
          <div className="space-y-4">
            <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">Today&apos;s check-in</p>
                <span className="text-xs text-white/35">{today}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {MOODS.map(mood => (
                  <button key={mood.value} type="button" onClick={() => setSelectedMood(mood.value)} className="rounded-xl py-3 text-center" style={selectedMood === mood.value ? { background: `${selectedHabit.color}18`, border: `1px solid ${selectedHabit.color}35` } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="text-lg">{mood.emoji}</div>
                    <div className="text-[10px] text-white/45 mt-1">{mood.label}</div>
                  </button>
                ))}
              </div>
              <textarea value={journalNote} onChange={e => setJournalNote(e.target.value)} rows={3} placeholder="Quick note about today..." className="mt-3 w-full px-4 py-3 rounded-xl text-white text-sm outline-none bg-black/20 border border-white/10" />
              <button type="button" onClick={saveJournal} className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(0,212,255,0.16)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.3)' }}>
                <Save size={14} />
                Save mood + note
              </button>
            </div>

            <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Timer progress</p>
                <span className="text-xs text-white/35">{getDurationForDate(selectedHabit, today)} / {selectedHabit.durationTargetMinutes || 0} min</span>
              </div>
              {selectedHabit.durationTargetMinutes ? (
                <>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[5, 15, 25].map(minutes => (
                      <button key={minutes} type="button" onClick={() => addDuration(minutes)} className="rounded-xl py-3 text-sm font-semibold bg-white/5 border border-white/10 text-white/75">
                        +{minutes} min
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button type="button" onClick={toggleTimer} className="rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2" style={activeTimerHabitId === selectedHabit._id ? { background: 'rgba(255,107,53,0.14)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.3)' } : { background: 'rgba(0,255,136,0.14)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)' }}>
                      {activeTimerHabitId === selectedHabit._id ? <Pause size={14} /> : <Play size={14} />}
                      {activeTimerHabitId === selectedHabit._id ? 'Stop timer' : 'Start timer'}
                    </button>
                    <button type="button" onClick={() => { timerStartedAt.current = null; setActiveTimerHabitId(null) }} className="rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/60">
                      <TimerReset size={14} />
                      Reset local timer
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/35 mt-2">No duration target set for this habit yet.</p>
              )}
            </div>

            <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
              <p className="text-sm font-semibold text-white mb-2">Strategy note</p>
              <textarea value={strategyNote} onChange={e => setStrategyNote(e.target.value)} rows={4} placeholder="Cue, reward, friction reduction..." className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none bg-black/20 border border-white/10" />
              <button type="button" onClick={saveNotes} className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(139,92,246,0.18)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.3)' }}>
                <Save size={14} />
                Save habit note
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function HabitRow({ habit, today, onOpen, onDelete }: { habit: Habit; today: string; onOpen: () => void; onDelete: () => void }) {
  const weeklyStreak = getPeriodStreak(habit, today, 'week')
  const monthlyStreak = getPeriodStreak(habit, today, 'month')
  const ruleStatus = getTwoDayRuleStatus(habit, today)
  const todayDuration = getDurationForDate(habit, today)

  return (
    <div className="p-4 rounded-2xl group transition-all" style={{ background: 'rgba(26,26,36,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-start gap-3">
        <button type="button" onClick={onOpen} className="flex flex-1 items-start gap-3 text-left">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: habit.color + '15', border: `1px solid ${habit.color}30` }}>
            {habit.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{habit.name}</p>
            <p className="text-xs text-white/35 mt-0.5">{getScheduleLabel(habit)}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {habit.durationTargetMinutes ? <Chip label={`${todayDuration}/${habit.durationTargetMinutes} min`} color="#00D4FF" /> : null}
              {habit.reminderTime ? <Chip label={`Reminder ${habit.reminderTime}`} color="#FFD60A" /> : null}
              {weeklyStreak > 0 ? <Chip label={`${weeklyStreak}w streak`} color="#00FF88" /> : null}
              {monthlyStreak > 0 ? <Chip label={`${monthlyStreak}m streak`} color="#8B5CF6" /> : null}
              {habit.timeOfDay && habit.type === 'good' ? <Chip label={habit.timeOfDay} color="#C4B5FD" /> : null}
              {ruleStatus.atRisk ? <Chip label="2-Day Rule risk" color="#FF6B35" /> : null}
            </div>
          </div>
        </button>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-all w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-500/10">
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-t-3xl p-6 animate-slide_up max-h-[90dvh] overflow-y-auto" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function PickerGrid({ label, values, selected, onPick }: { label: string; values: string[]; selected: string; onPick: (value: string) => void }) {
  return (
    <div>
      <label className="text-xs text-white/40 mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {values.map(value => (
          <button key={value} type="button" onClick={() => onPick(value)} className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all" style={{ background: selected === value ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.04)', border: selected === value ? '1px solid rgba(0,255,136,0.4)' : '1px solid rgba(255,255,255,0.06)' }}>
            {value}
          </button>
        ))}
      </div>
    </div>
  )
}

function ColorPicker({ value, onPick }: { value: string; onPick: (color: string) => void }) {
  return (
    <div>
      <label className="text-xs text-white/40 mb-2 block">Color</label>
      <div className="flex gap-2">
        {COLORS.map(color => (
          <button key={color} type="button" onClick={() => onPick(color)} className="w-8 h-8 rounded-full transition-all" style={{ background: color, boxShadow: value === color ? `0 0 12px ${color}80` : 'none', transform: value === color ? 'scale(1.2)' : 'scale(1)' }} />
        ))}
      </div>
    </div>
  )
}

function DayPicker({ values, onChange }: { values: number[]; onChange: (days: number[]) => void }) {
  return (
    <div>
      <label className="text-xs text-white/40 mb-2 block">Scheduled days</label>
      <div className="grid grid-cols-7 gap-2">
        {WEEK_DAYS.map(day => {
          const active = values.includes(day.value)
          return (
            <button key={`${day.label}-${day.value}`} type="button" onClick={() => onChange(active ? values.filter(value => value !== day.value) : [...values, day.value].sort())} className="rounded-xl py-2 text-sm font-semibold" style={active ? { background: 'rgba(0,255,136,0.16)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {day.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TypeToggle({ value, onChange }: { value: 'good' | 'bad'; onChange: (type: 'good' | 'bad') => void }) {
  return (
    <div className="flex rounded-xl overflow-hidden p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {(['good', 'bad'] as const).map(type => (
        <button key={type} type="button" onClick={() => onChange(type)} className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all" style={value === type ? { background: type === 'good' ? 'rgba(0,255,136,0.2)' : 'rgba(255,107,53,0.2)', color: type === 'good' ? '#00FF88' : '#FF6B35' } : { color: 'rgba(255,255,255,0.4)' }}>
          {type === 'good' ? 'Good habit' : 'Bad habit'}
        </button>
      ))}
    </div>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: `${color}14`, color, border: `1px solid ${color}25` }}>{label}</span>
}

function getScheduleLabel(habit: Habit): string {
  if (habit.frequency === 'weekly') return `Weekly • ${habit.targetCount || habit.scheduledDays?.length || 1}x goal`
  if (habit.frequency === 'monthly') return `Monthly • ${habit.targetCount || habit.monthlyDays?.length || 1}x goal`
  if (habit.type === 'good' && habit.timeOfDay) return `${habit.timeOfDay} • ${habit.weeklyTarget || 7}/week`
  return habit.locationLabel ? `Daily • ${habit.locationLabel}` : 'Daily'
}
