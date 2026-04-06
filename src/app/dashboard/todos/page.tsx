'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { getLocalDefaultReminderTime, getResolvedTimeZone, requestNotificationPermission, sendBrowserNotification, supportsNotifications } from '@/lib/notifications'

interface Todo {
  _id: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  reminderEnabled?: boolean
  reminderTime?: string
  lastReminderDate?: string
  tags: string[]
  createdAt: string
}

const P_COLOR = { low: '#00D4FF', medium: '#FFD60A', high: '#FF006E' }
const P_LABEL = { low: 'Low', medium: 'Medium', high: 'High' }

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('active')
  const [loading, setLoading] = useState(true)
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('19:00')
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [timeZone, setTimeZone] = useState('local time')

  useEffect(() => {
    fetch('/api/todos').then(r => r.json()).then(d => { setTodos(d); setLoading(false) })
    setReminderTime(getLocalDefaultReminderTime())
    setTimeZone(getResolvedTimeZone())
    setPermission(supportsNotifications() ? Notification.permission : 'unsupported')
  }, [])

  async function enableNotifications() {
    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') {
      await sendBrowserNotification({
        title: 'Notifications enabled',
        body: 'Task reminders will use your local time zone.',
        tag: `notification-enabled-${Date.now()}`,
      })
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: input.trim(), priority, reminderEnabled, reminderTime }),
    })
    const t = await res.json()
    setTodos(prev => [t, ...prev])
    setInput('')
    setReminderEnabled(false)
    setReminderTime(getLocalDefaultReminderTime())
  }

  async function toggle(id: string, completed: boolean) {
    setTodos(prev => prev.map(t => t._id === id ? { ...t, completed: !t.completed } : t))
    const response = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !completed }),
    })
    const updated = await response.json()
    if (!completed && supportsNotifications()) {
      if (Notification.permission !== 'granted') {
        await requestNotificationPermission()
      }
      await sendBrowserNotification({
        title: 'Task completed',
        body: `Nice. "${updated.title}" is done.`,
        tag: `todo-complete-${updated._id}-${Date.now()}`,
      })
    }
  }

  async function remove(id: string) {
    setTodos(prev => prev.filter(t => t._id !== id))
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
  }

  const filtered = todos.filter(t =>
    filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed
  )

  const pending = todos.filter(t => !t.completed).length
  const done = todos.filter(t => t.completed).length

  return (
    <div className="max-w-lg mx-auto px-4 pt-2 space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-black text-white">Tasks</h1>
        <p className="text-sm text-white/40">{pending} pending · {done} completed</p>
      </div>

      {/* Add form */}
      <form onSubmit={add}
        className="space-y-3 p-3 rounded-2xl"
        style={{ background: 'rgba(26,26,36,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex gap-2">
          <input
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 bg-transparent text-white text-sm outline-none font-body placeholder:text-white/25"
          />
          <button type="submit"
            className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)' }}>
            <Plus size={18} className="text-ink" strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['low', 'medium', 'high'] as const).map(p => (
            <button key={p} type="button" onClick={() => setPriority(p)}
              className="px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
              style={priority === p
                ? { background: P_COLOR[p] + '25', color: P_COLOR[p], border: `1px solid ${P_COLOR[p]}40` }
                : { color: 'rgba(255,255,255,0.3)', border: '1px solid transparent' }
              }>
              {P_LABEL[p]}
            </button>
          ))}
          {permission !== 'granted' && (
            <button
              type="button"
              onClick={enableNotifications}
              className="px-3 py-1.5 rounded-lg text-[10px] font-semibold"
              style={{ background: 'rgba(255,214,10,0.14)', color: '#FFD60A', border: '1px solid rgba(255,214,10,0.25)' }}
            >
              Enable notifications
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              if (!reminderEnabled && permission !== 'granted' && supportsNotifications()) {
                const result = await requestNotificationPermission()
                setPermission(result)
                if (result !== 'granted') return
              }
              setReminderEnabled(prev => !prev)
            }}
            className="px-3 py-1.5 rounded-lg text-[10px] font-semibold"
            style={reminderEnabled
              ? { background: 'rgba(0,212,255,0.15)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.25)' }
              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {reminderEnabled ? 'Reminder on' : 'Reminder off'}
          </button>
          {reminderEnabled && (
            <input
              type="time"
              value={reminderTime}
              onChange={e => setReminderTime(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-[10px] text-white outline-none bg-white/5 border border-white/10"
            />
          )}
        </div>
        {reminderEnabled && (
          <p className="text-[11px] text-white/35">Reminder time uses your browser timezone: {timeZone}</p>
        )}
      </form>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {(['active', 'all', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
            style={filter === f
              ? { background: 'rgba(0,255,136,0.15)', color: '#00FF88' }
              : { color: 'rgba(255,255,255,0.4)' }
            }>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-white/30 text-sm">
            {filter === 'done' ? 'No completed tasks yet' : 'All clear! Add something to do.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((todo, idx) => (
            <div key={todo._id}
              className="flex items-center gap-3 p-4 rounded-2xl group transition-all duration-200 animate-slide_up"
              style={{
                background: todo.completed ? 'rgba(17,17,24,0.5)' : 'rgba(26,26,36,0.9)',
                border: `1px solid ${todo.completed ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)'}`,
                animationDelay: `${idx * 0.05}s`,
              }}>
              <button onClick={() => toggle(todo._id, todo.completed)}
                className="flex-shrink-0 transition-all active:scale-95">
                {todo.completed
                  ? <CheckCircle2 size={20} style={{ color: '#00FF88' }} />
                  : <Circle size={20} style={{ color: P_COLOR[todo.priority] }} />
                }
              </button>

              <span className="flex-1 text-sm font-body transition-all"
                style={{
                  color: todo.completed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)',
                  textDecoration: todo.completed ? 'line-through' : 'none',
                }}>
                {todo.title}
              </span>

              <div className="flex items-center gap-2">
                {todo.reminderEnabled && todo.reminderTime ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-sky-400/10 text-sky-300">
                    {todo.reminderTime}
                  </span>
                ) : null}
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: P_COLOR[todo.priority] + '15', color: P_COLOR[todo.priority] }}>
                  {P_LABEL[todo.priority]}
                </span>
                <button onClick={() => remove(todo._id)}
                  className="opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={14} className="text-white/25 hover:text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
