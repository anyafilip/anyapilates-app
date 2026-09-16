'use client'

import { useTransition } from 'react'
import { toggleInstructorVisibility } from '@/app/actions/instructors'
import toast from 'react-hot-toast'

export default function InstructorsTable({ instructors }: { instructors: any[] }) {
  const [isPending, startTransition] = useTransition()

  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      try {
        await toggleInstructorVisibility(id, !currentStatus)
        toast.success(`Instructor is now ${!currentStatus ? 'visible' : 'hidden'}`)
      } catch (e: any) {
        toast.error(e.message || 'Failed to update visibility')
      }
    })
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm relative z-10">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
              <th className="font-medium py-6 pl-8 w-24">Photo</th>
              <th className="font-medium py-6">Instructor</th>
              <th className="font-medium py-6">Bio</th>
              <th className="font-medium py-6 pr-8 text-right">Show on Frontpage</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light text-[var(--foreground)]">
            {instructors.map(instructor => (
              <tr key={instructor.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
                <td className="py-4 pl-8">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-black/5 flex items-center justify-center border border-black/5">
                    {instructor.imageUrl ? (
                      <img src={instructor.imageUrl} alt={instructor.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-serif text-[var(--foreground-muted)]">{instructor.name?.[0]}</span>
                    )}
                  </div>
                </td>
                <td className="py-4">
                  <p className="font-medium text-[var(--foreground)]">{instructor.name}</p>
                  <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{instructor.email}</p>
                  {instructor.phone && <p className="text-[11px] text-[var(--foreground-muted)]">{instructor.phone}</p>}
                </td>
                <td className="py-4">
                  <p className="text-[12px] text-[var(--foreground-muted)] truncate max-w-[200px] md:max-w-[300px]">
                    {instructor.bio || 'No bio provided.'}
                  </p>
                </td>
                <td className="py-4 pr-8 text-right">
                  <label className="inline-flex items-center gap-3 cursor-pointer group justify-end">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${instructor.showOnFrontpage ? 'bg-[var(--foreground)] border-[var(--foreground)]' : 'border-black/20 group-hover:border-black/40'}`}>
                      {instructor.showOnFrontpage && (
                        <svg className="w-3 h-3 text-[var(--background)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={instructor.showOnFrontpage} 
                      onChange={() => handleToggle(instructor.id, instructor.showOnFrontpage)}
                      disabled={isPending}
                    />
                  </label>
                </td>
              </tr>
            ))}
            {instructors.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm italic text-[var(--foreground-muted)]">
                  No instructors found. Change a user's role to Instructor on the Users page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
