import { describe, it, expect } from 'vitest'
import { calculateGoalProgress, resolveDateRange } from '@/lib/dashboard'

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

describe('resolveDateRange', () => {
  const NOW = new Date(2026, 8, 25) // Friday, September 25th 2026

  it('resolves "today" and "yesterday" as single-day ranges', () => {
    expect(resolveDateRange('today', NOW)).toEqual({ start: '2026-09-25', end: '2026-09-25' })
    expect(resolveDateRange('yesterday', NOW)).toEqual({ start: '2026-09-24', end: '2026-09-24' })
  })

  it('resolves "week" as the Monday-Sunday containing "now"', () => {
    expect(resolveDateRange('week', NOW)).toEqual({ start: '2026-09-21', end: '2026-09-27' })
  })

  it('resolves "week" the same way when "now" itself falls on a Sunday', () => {
    expect(resolveDateRange('week', new Date(2026, 8, 27))).toEqual({ start: '2026-09-21', end: '2026-09-27' })
  })

  it('resolves "month" as the full current calendar month', () => {
    expect(resolveDateRange('month', NOW)).toEqual({ start: '2026-09-01', end: '2026-09-30' })
  })

  it('resolves "year" as the full current calendar year', () => {
    expect(resolveDateRange('year', NOW)).toEqual({ start: '2026-01-01', end: '2026-12-31' })
  })

  it('passes "custom" through unchanged, including an inverted range', () => {
    expect(resolveDateRange('custom', NOW, { start: '2026-01-10', end: '2026-01-05' })).toEqual({
      start: '2026-01-10',
      end: '2026-01-05',
    })
  })
})
