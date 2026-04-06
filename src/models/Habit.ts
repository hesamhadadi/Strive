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
  frequency: 'daily' | 'weekly' | 'monthly'
  scheduledDays: number[]
  monthlyDays: number[]
  targetCount: number
  durationTargetMinutes?: number
  reminderTime?: string
  locationLabel?: string
  notes?: string
  twoDayRule: boolean
  costPerDay?: number
  currency?: string
  startQuitDate?: string
  completions: string[]
  cleanDays: string[]
  moodLogs: { date: string; mood: number; note?: string }[]
  durationLogs: { date: string; minutes: number }[]
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
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
  scheduledDays: [{ type: Number }],
  monthlyDays: [{ type: Number }],
  targetCount: { type: Number, default: 1 },
  durationTargetMinutes: { type: Number },
  reminderTime: { type: String },
  locationLabel: { type: String },
  notes: { type: String, default: '' },
  twoDayRule: { type: Boolean, default: true },
  costPerDay: { type: Number },
  currency: { type: String, default: '€' },
  startQuitDate: { type: String },
  completions: [{ type: String }],
  cleanDays: [{ type: String }],
  moodLogs: [{
    date: { type: String, required: true },
    mood: { type: Number, required: true },
    note: { type: String },
  }],
  durationLogs: [{
    date: { type: String, required: true },
    minutes: { type: Number, required: true },
  }],
  createdAt: { type: Date, default: Date.now },
  isDefault: { type: Boolean, default: false },
})

export default mongoose.models.Habit || mongoose.model<IHabit>('Habit', HabitSchema)
