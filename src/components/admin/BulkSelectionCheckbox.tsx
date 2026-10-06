'use client'

import { useBulkSelection } from './BulkSelectionContext'

export function BulkSelectionCheckbox({ id }: { id: string }) {
  const { isSelected, toggleSelection } = useBulkSelection()
  return (
    <input 
      type="checkbox" 
      checked={isSelected(id)} 
      onChange={() => toggleSelection(id)}
      className="w-4 h-4 rounded border-gray-300 text-stone-800 focus:ring-stone-800 cursor-pointer"
    />
  )
}

export function BulkSelectAllCheckbox({ ids }: { ids: string[] }) {
  const { selectedIds, selectAll, clearSelection } = useBulkSelection()
  const allSelected = ids.length > 0 && selectedIds.length === ids.length

  return (
    <input 
      type="checkbox" 
      checked={allSelected} 
      onChange={() => allSelected ? clearSelection() : selectAll(ids)}
      className="w-4 h-4 rounded border-gray-300 text-stone-800 focus:ring-stone-800 cursor-pointer"
    />
  )
}
