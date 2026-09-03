import { describe, it, expect } from 'vitest'
import { reorderById } from '@/lib/reorder'

describe('reorderById', () => {
  it('moves the active item to sit where the over item currently is', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(reorderById(items, 'a', 'c')).toEqual([{ id: 'b' }, { id: 'c' }, { id: 'a' }])
  })

  it('moves an item backward in the list', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(reorderById(items, 'c', 'a')).toEqual([{ id: 'c' }, { id: 'a' }, { id: 'b' }])
  })

  it('returns the same list unchanged when active and over are the same id', () => {
    const items = [{ id: 'a' }, { id: 'b' }]
    expect(reorderById(items, 'a', 'a')).toBe(items)
  })

  it('returns the list unchanged when either id is not found', () => {
    const items = [{ id: 'a' }, { id: 'b' }]
    expect(reorderById(items, 'a', 'missing')).toBe(items)
    expect(reorderById(items, 'missing', 'b')).toBe(items)
  })

  it('preserves extra fields on each item', () => {
    const items = [{ id: 'a', url: 'x.jpg' }, { id: 'b', url: 'y.jpg' }]
    expect(reorderById(items, 'a', 'b')).toEqual([{ id: 'b', url: 'y.jpg' }, { id: 'a', url: 'x.jpg' }])
  })
})
