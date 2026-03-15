import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Habit from '@/models/Habit'
import Todo from '@/models/Todo'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/dashboard')

  await connectDB()

  const [users, habits, todos] = await Promise.all([
    User.find({}).select('-password').lean(),
    Habit.countDocuments(),
    Todo.countDocuments(),
  ])

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-white">Admin Panel</h1>
        <p className="text-sm text-white/40">Platform overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Users', value: users.length, color: '#8B5CF6' },
          { label: 'Habits', value: habits, color: '#00FF88' },
          { label: 'Todos', value: todos, color: '#00D4FF' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl text-center"
            style={{ background: 'rgba(26,26,36,0.9)', border: `1px solid ${s.color}20` }}>
            <p className="font-mono text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Users list */}
      <div>
        <h2 className="font-semibold text-sm text-white/50 uppercase tracking-wider mb-3">All Users</h2>
        <div className="space-y-2">
          {users.map((u: any) => (
            <div key={u._id.toString()}
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(26,26,36,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: u.role === 'admin' ? 'rgba(255,214,10,0.15)' : 'rgba(0,255,136,0.1)', color: u.role === 'admin' ? '#FFD60A' : '#00FF88' }}>
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{u.name}</p>
                <p className="text-xs text-white/40">{u.email}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-lg font-semibold"
                style={u.role === 'admin'
                  ? { background: 'rgba(255,214,10,0.1)', color: '#FFD60A' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
                }>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
