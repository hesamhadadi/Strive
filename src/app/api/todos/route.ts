import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Todo from '@/models/Todo'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const todos = await Todo.find({ userId: (session.user as any).id }).sort({ createdAt: -1 })
  return NextResponse.json(todos)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  await connectDB()

  const todo = await Todo.create({ ...body, userId: (session.user as any).id })
  return NextResponse.json(todo, { status: 201 })
}
