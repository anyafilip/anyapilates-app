
import { redirect } from 'next/navigation'
import ProfileForm from './ProfileForm'
import Link from 'next/link'
import { getProfile } from '@/app/actions/profile'

export default async function SettingsPage() {
  const dbUser = await getProfile()
  
  if (!dbUser) redirect('/en/login')

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 md:px-0">
      <div className="mb-8">
        <Link href="/en/account" className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-2 mb-4">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-serif text-[var(--foreground)]">Profile Settings</h1>
      </div>
      
      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 md:p-10 shadow-sm">
        <ProfileForm user={dbUser} />
      </div>
    </div>
  )
}
