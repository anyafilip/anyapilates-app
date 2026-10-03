import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AccountLayout({ 
  children,
  params
}: { 
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  const role = (session?.user as any)?.role

  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  // RBAC: Redirect admins and instructors to their own dashboards
  if (role === 'ADMIN') {
    redirect(`/${locale}/admin`)
  }
  if (role === 'INSTRUCTOR') {
    redirect(`/${locale}/instructor`)
  }

  return <>{children}</>
}
