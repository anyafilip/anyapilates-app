import { prisma } from '@/lib/prisma'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  const settings = await prisma.studioSettings.findUnique({ where: { id: 'default' } })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light text-[var(--foreground)] mb-2">Studio Settings</h1>
        <p className="text-sm text-[var(--foreground-muted)]">Manage your studio's payment QR code and preferences.</p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 shadow-sm">
        <h2 className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground)] mb-6">Payment Settings</h2>
        
        <SettingsForm initialQrUrl={settings?.qrCodeUrl} />
      </div>
    </div>
  )
}
