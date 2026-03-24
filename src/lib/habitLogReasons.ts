export const HABIT_LOG_REASONS = ['tired', 'no_time', 'sick', 'forgot', 'other'] as const
export type HabitLogReason = (typeof HABIT_LOG_REASONS)[number]

export const HABIT_LOG_REASON_LABELS: Record<HabitLogReason, string> = {
  tired: '😴 Tired',
  no_time: '🏃 No time',
  sick: '🤒 Sick',
  forgot: '😞 Forgot',
  other: '✍️ Other',
}
