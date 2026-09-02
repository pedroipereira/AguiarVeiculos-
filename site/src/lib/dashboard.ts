export interface GoalProgress {
  percent: number
  remaining: number
  businessDaysLeft: number
}

/**
 * Business days = segunda a sexta, sem calendário de feriados — explicit
 * user decision, no holiday data source exists in this project.
 */
function countRemainingBusinessDays(now: Date): number {
  const year = now.getFullYear()
  const month = now.getMonth()
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  let count = 0
  for (let day = now.getDate(); day <= lastDayOfMonth; day++) {
    const dayOfWeek = new Date(year, month, day).getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++
  }
  return count
}

export function calculateGoalProgress(soldCount: number, goal: number | null, now: Date): GoalProgress | null {
  if (goal == null || goal <= 0) return null
  return {
    percent: Math.round((soldCount / goal) * 100),
    remaining: Math.max(0, goal - soldCount),
    businessDaysLeft: countRemainingBusinessDays(now),
  }
}
