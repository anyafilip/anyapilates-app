'use client'

import React, { createContext, useContext, useState } from 'react'

interface BulkSelectionContextType {
  selectedIds: string[]
  toggleSelection: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  isSelected: (id: string) => boolean
}

const BulkSelectionContext = createContext<BulkSelectionContextType | null>(null)

export function BulkSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const selectAll = (ids: string[]) => {
    setSelectedIds(ids)
  }

  const clearSelection = () => {
    setSelectedIds([])
  }

  const isSelected = (id: string) => selectedIds.includes(id)

  return (
    <BulkSelectionContext.Provider value={{ selectedIds, toggleSelection, selectAll, clearSelection, isSelected }}>
      {children}
    </BulkSelectionContext.Provider>
  )
}

export function useBulkSelection() {
  const context = useContext(BulkSelectionContext)
  if (!context) throw new Error("useBulkSelection must be used within BulkSelectionProvider")
  return context
}
