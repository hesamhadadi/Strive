import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: 'user' | 'admin'
  avatar?: string
  createdAt: Date
  streak: number
  longestStreak: number
  lastActiveDate?: string
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String },
  streak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: String },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
