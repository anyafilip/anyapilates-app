import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/en/')

  return (
    <div className="fixed inset-0 z-40 flex flex-col w-full bg-[var(--foreground)]">
      <AdminSidebar />

      {/* Main */}
      <main className="flex-1 bg-[var(--surface)] p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
