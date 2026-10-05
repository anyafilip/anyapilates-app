import { prisma } from '@/lib/prisma'
import LoginForm from './LoginForm'

export default async function LoginPageServer() {
  const settings = await prisma.studioSettings.findUnique({ where: { id: 'default' } })
  return <LoginForm loginImage={settings?.loginImage} />
}
