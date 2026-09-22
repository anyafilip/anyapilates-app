import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import InstructorNavbar from '@/components/InstructorNavbar'

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const role = (session?.user as any)?.role

  // Allow both INSTRUCTOR and ADMIN to access this portal
  if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
    redirect('/en/')
  }

  return (
    <div className="flex-1 w-full flex flex-col h-[100dvh] overflow-hidden">
      <InstructorNavbar />

      {/* Main Content */}
      <main className="flex-1 bg-[var(--surface)] p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
