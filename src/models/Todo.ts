import mongoose, { Schema, Document } from 'mongoose'

export interface ITodo extends Document {
  userId: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  completedAt?: Date
  createdAt: Date
  tags: string[]
}

const TodoSchema = new Schema<ITodo>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: { type: String },
  completedAt: { type: Date },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Todo || mongoose.model<ITodo>('Todo', TodoSchema)
