import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/en')

  return (
    <div className="flex-1 w-full flex flex-col h-[100dvh] overflow-hidden bg-[var(--foreground)]">
      <AdminSidebar />

      {/* Main */}
      <main className="flex-1 bg-[var(--surface)] p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
