'use client'

import { useBulkSelection } from './BulkSelectionContext'
import BulkActionBar from './BulkActionBar'

export function BulkActionBarController({ actions }: { actions: any[] }) {
  const { selectedIds, clearSelection } = useBulkSelection()
  return <BulkActionBar selectedIds={selectedIds} onClearSelection={clearSelection} actions={actions} />
}
