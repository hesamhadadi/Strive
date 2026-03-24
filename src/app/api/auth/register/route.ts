import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Habit from '@/models/Habit'

const DEFAULT_HABITS = [
  { name: 'Drink 8 glasses of water', type: 'good', icon: '💧', color: '#00D4FF', category: 'Health', isDefault: true, timeOfDay: 'morning' },
  { name: 'Take vitamins & supplements', type: 'good', icon: '💊', color: '#00FF88', category: 'Health', isDefault: true, timeOfDay: 'morning' },
  { name: 'Exercise 30 minutes', type: 'good', icon: '🏃', color: '#FF6B35', category: 'Fitness', isDefault: true, timeOfDay: 'afternoon' },
  { name: 'Read 20 pages', type: 'good', icon: '📚', color: '#8B5CF6', category: 'Mind', isDefault: true, timeOfDay: 'evening' },
  { name: 'Meditate', type: 'good', icon: '🧘', color: '#FFD60A', category: 'Mind', isDefault: true, timeOfDay: 'anytime' },
]

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    await connectDB()

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const isAdmin = email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: isAdmin ? 'admin' : 'user',
    })

    // Create default habits
    const habits = DEFAULT_HABITS.map(h => ({ ...h, userId: user._id.toString() }))
    await Habit.insertMany(habits)

    return NextResponse.json({ success: true, userId: user._id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
