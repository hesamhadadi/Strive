'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface Todo {
  _id: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
}

const PRIORITY_COLORS = {
  low: '#00D4FF',
  medium: '#FFD60A',
  high: '#FF006E',
}

export default function QuickTodo() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')

  useEffect(() => {
    fetch('/api/todos').then(r => r.json()).then(d => setTodos(d.slice(0, 5)))
  }, [])

  async function addTodo(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return

    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: input.trim(), priority }),
    })
    const todo = await res.json()
    setTodos(prev => [todo, ...prev])
    setInput('')
  }

  async function toggleTodo(id: string, completed: boolean) {
    setTodos(prev => prev.map(t => t._id === id ? { ...t, completed: !t.completed } : t))
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !completed }),
    })
  }

  async function deleteTodo(id: string) {
    setTodos(prev => prev.filter(t => t._id !== id))
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
  }

  return (
    <div className="space-y-3">
      {/* Input */}
      <form onSubmit={addTodo} className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all font-body"
          style={{
            background: 'rgba(26,26,36,0.9)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,0.3)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
        />
        {/* Priority selector */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          {(['low', 'medium', 'high'] as const).map(p => (
            <button key={p} type="button" onClick={() => setPriority(p)}
              className="w-7 transition-all"
              style={{
                background: priority === p ? PRIORITY_COLORS[p] + '30' : 'rgba(26,26,36,0.9)',
                borderBottom: priority === p ? `2px solid ${PRIORITY_COLORS[p]}` : '2px solid transparent',
              }}>
              <span style={{ color: PRIORITY_COLORS[p], fontSize: '8px' }}>●</span>
            </button>
          ))}
        </div>
        <button type="submit"
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)' }}>
          <Plus size={18} className="text-ink" strokeWidth={2.5} />
        </button>
      </form>

      {/* List */}
      {todos.length === 0 ? (
        <p className="text-center text-white/30 text-sm py-4">No tasks yet</p>
      ) : (
        <div className="space-y-2">
          {todos.map(todo => (
            <div key={todo._id}
              className="flex items-center gap-3 p-3 rounded-xl group transition-all"
              style={{ background: 'rgba(26,26,36,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Checkbox */}
              <button onClick={() => toggleTodo(todo._id, todo.completed)}
                className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                style={{
                  borderColor: todo.completed ? '#00FF88' : PRIORITY_COLORS[todo.priority],
                  background: todo.completed ? '#00FF88' : 'transparent',
                }}>
                {todo.completed && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>

              <span className="flex-1 text-sm font-body transition-all"
                style={{
                  color: todo.completed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)',
                  textDecoration: todo.completed ? 'line-through' : 'none',
                }}>
                {todo.title}
              </span>

              {/* Priority dot */}
              <span className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: PRIORITY_COLORS[todo.priority] }} />

              <button onClick={() => deleteTodo(todo._id)}
                className="opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                <Trash2 size={14} className="text-white/30 hover:text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
