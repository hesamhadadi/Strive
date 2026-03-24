'use client'

import { useMemo, useState } from 'react'
import { HABIT_LOG_REASONS, HABIT_LOG_REASON_LABELS, type HabitLogReason } from '@/lib/habitLogReasons'

const REASONS = HABIT_LOG_REASONS.map(value => ({ value, label: HABIT_LOG_REASON_LABELS[value] }))

interface HabitInfo {
  _id: string
  name: string
  icon: string
}

interface Props {
  open: boolean
  habits: HabitInfo[]
  onClose: () => void
  onSubmit: (habitId: string, reason: HabitLogReason, note?: string) => Promise<void>
}

export default function MissedHabitSheet({ open, habits, onClose, onSubmit }: Props) {
  const [selectedHabitId, setSelectedHabitId] = useState<string>('')
  const [reason, setReason] = useState<HabitLogReason>('tired')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedHabit = useMemo(
    () => habits.find(h => h._id === selectedHabitId) || habits[0],
    [habits, selectedHabitId]
  )

  if (!open || habits.length === 0) return null

  async function submit() {
    if (!selectedHabit?._id) return
    setSubmitting(true)
    try {
      await onSubmit(selectedHabit._id, reason, note.slice(0, 120))
      setNote('')
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="w-full max-w-lg rounded-t-3xl p-5 pb-7 animate-slide_up" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-white">You missed {habits.length} habits today — log why?</h3>
          <button onClick={onClose} className="text-xs text-white/45">Close</button>
        </div>

        <div className="space-y-3">
          <select
            value={selectedHabit?._id || ''}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {habits.map(h => (
              <option key={h._id} value={h._id}>{h.icon} {h.name}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            {REASONS.map(r => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: reason === r.value ? 'rgba(0,255,136,0.16)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${reason === r.value ? 'rgba(0,255,136,0.45)' : 'rgba(255,255,255,0.1)'}`,
                  color: reason === r.value ? '#00FF88' : 'rgba(255,255,255,0.75)',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 120))}
            rows={3}
            maxLength={120}
            placeholder="Optional note (max 120 chars)"
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <p className="text-[10px] text-white/35 text-right">{note.length}/120</p>

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-semibold text-ink disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)' }}
          >
            {submitting ? 'Saving…' : 'Save reason'}
          </button>
        </div>
      </div>
    </div>
  )
}
