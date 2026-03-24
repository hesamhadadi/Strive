import mongoose, { Schema, Document } from 'mongoose'

export interface IHabit extends Document {
  userId: string
  name: string
  type: 'good' | 'bad'
  icon: string
  color: string
  category: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime'
  weeklyTarget?: number
  // For bad habits
  costPerDay?: number
  currency?: string
  startQuitDate?: string
  // Completions: array of date strings "YYYY-MM-DD"
  completions: string[]
  // For bad habits: days marked as "didn't do it"
  cleanDays: string[]
  createdAt: Date
  isDefault: boolean
}

const HabitSchema = new Schema<IHabit>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['good', 'bad'], required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  category: { type: String, required: true },
  timeOfDay: { type: String, enum: ['morning', 'afternoon', 'evening', 'anytime'], default: 'anytime' },
  weeklyTarget: { type: Number, min: 1, max: 7 },
  costPerDay: { type: Number },
  currency: { type: String, default: '€' },
  startQuitDate: { type: String },
  completions: [{ type: String }],
  cleanDays: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  isDefault: { type: Boolean, default: false },
})

export default mongoose.models.Habit || mongoose.model<IHabit>('Habit', HabitSchema)
