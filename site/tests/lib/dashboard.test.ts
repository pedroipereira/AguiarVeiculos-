import { describe, it, expect } from 'vitest'
import { calculateGoalProgress } from '@/lib/dashboard'

describe('calculateGoalProgress', () => {
  it('returns null when no goal is set', () => {
    expect(calculateGoalProgress(5, null, new Date(2026, 8, 1))).toBeNull()
  })

  it('returns null when the goal is zero or negative', () => {
    expect(calculateGoalProgress(5, 0, new Date(2026, 8, 1))).toBeNull()
    expect(calculateGoalProgress(5, -3, new Date(2026, 8, 1))).toBeNull()
  })

  it('computes percent and remaining, counting all weekdays in the month from the 1st', () => {
    // 2026-09-01 is a Tuesday; September 2026 has 22 weekdays total.
    const result = calculateGoalProgress(12, 20, new Date(2026, 8, 1))
    expect(result).toEqual({ percent: 60, remaining: 8, businessDaysLeft: 22 })
  })

  it('counts remaining business days from a weekday "now" through end of month, excluding weekends', () => {
    // 2026-09-25 is a Friday; weekdays left in September from the 25th: 25(Fri),28(Mon),29(Tue),30(Wed) = 4.
    const result = calculateGoalProgress(10, 20, new Date(2026, 8, 25))
    expect(result?.businessDaysLeft).toBe(4)
  })

  it('counts remaining business days from a weekend "now", excluding today itself', () => {
    // 2026-09-27 is a Sunday; weekdays left: 28(Mon),29(Tue),30(Wed) = 3.
    const result = calculateGoalProgress(10, 20, new Date(2026, 8, 27))
    expect(result?.businessDaysLeft).toBe(3)
  })

  it('floors remaining at zero and allows percent over 100 once the goal is exceeded', () => {
    const result = calculateGoalProgress(25, 20, new Date(2026, 8, 1))
    expect(result?.remaining).toBe(0)
    expect(result?.percent).toBe(125)
  })
})
