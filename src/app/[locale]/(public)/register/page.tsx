import { prisma } from '@/lib/prisma'
import RegisterForm from './RegisterForm'

export default async function RegisterPageServer() {
  const settings = await prisma.studioSettings.findUnique({ where: { id: 'default' } })
  return <RegisterForm loginImage={settings?.loginImage} />
}
