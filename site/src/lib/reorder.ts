import { arrayMove } from '@dnd-kit/sortable'

/**
 * Reorders a list by moving the item with `activeId` to sit where the item
 * with `overId` currently is — the shape a `DragEndEvent` handler needs.
 * Returns the same array reference (not a copy) when nothing should move,
 * so callers can skip a state update / server write on a no-op drag.
 */
export function reorderById<T extends { id: string }>(items: T[], activeId: string, overId: string): T[] {
  if (activeId === overId) return items
  const oldIndex = items.findIndex((item) => item.id === activeId)
  const newIndex = items.findIndex((item) => item.id === overId)
  if (oldIndex === -1 || newIndex === -1) return items
  return arrayMove(items, oldIndex, newIndex)
}
