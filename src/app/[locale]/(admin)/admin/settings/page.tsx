import { prisma } from '@/lib/prisma'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  const settings = await prisma.studioSettings.findUnique({ where: { id: 'default' } })

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-[var(--foreground)] mb-2">Studio Settings</h1>
        <p className="text-[var(--foreground-muted)] text-sm">Configure your checkout QR code and public website content.</p>
      </div>

      <div className="bg-[var(--surface)] border border-black/5 rounded-3xl p-8 shadow-sm">
        <SettingsForm initialSettings={settings} />
      </div>
    </div>
  )
}
