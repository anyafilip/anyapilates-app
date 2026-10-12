import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
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
  const userId = session?.user?.id

  if (!userId) {
    redirect(`/${locale}/login`)
  }

  // Double check role from DB for strict backend protection
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  const role = dbUser?.role || (session?.user as any)?.role

  // RBAC: Member dashboard is ONLY available to CLIENTs
  if (role === 'ADMIN') {
    redirect(`/${locale}/admin`)
  }
  if (role === 'INSTRUCTOR') {
    redirect(`/${locale}/instructor`)
  }
  if (role !== 'CLIENT') {
    redirect(`/${locale}/`)
  }

  return <>{children}</>
}
