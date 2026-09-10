import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import ProfileForm from './ProfileForm'

export default async function InstructorProfile() {
  const session = await auth()
  const userId = (session?.user as any)?.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, bio: true, imageUrl: true, availabilityNotes: true }
  })

  if (!user) return null

  require('fs').writeFileSync('user_debug.log', JSON.stringify(user))

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-12 border-b border-[var(--border)] pb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-light text-[var(--foreground)]">My Profile</h1>
      </div>

      <div className="bg-white/60 rounded-2xl shadow-sm border border-white backdrop-blur-md p-8 md:p-12">
        <ProfileForm user={user} />
      </div>
    </div>
  )
}
