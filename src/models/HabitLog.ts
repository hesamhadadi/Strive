import mongoose, { Schema, Document } from 'mongoose'

export interface IHabitLog extends Document {
  habitId: string
  userId: string
  date: string
  completed: boolean
  reason?: 'tired' | 'no_time' | 'sick' | 'forgot' | 'other'
  note?: string
  completedAt?: Date
}

const HabitLogSchema = new Schema<IHabitLog>(
  {
    habitId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    completed: { type: Boolean, required: true },
    reason: { type: String, enum: ['tired', 'no_time', 'sick', 'forgot', 'other'] },
    note: { type: String, maxlength: 120 },
    completedAt: { type: Date },
  },
  { timestamps: true }
)

HabitLogSchema.index({ userId: 1, date: 1, habitId: 1 }, { unique: true })

export default mongoose.models.HabitLog || mongoose.model<IHabitLog>('HabitLog', HabitLogSchema)
