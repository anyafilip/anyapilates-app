import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const ct = await prisma.classType.findUnique({
    where: { id },
    select: { imageUrl: true },
  })

  if (!ct?.imageUrl) {
    return new NextResponse(null, { status: 404 })
  }

  // imageUrl is stored as a data URI: data:<mime>;base64,<data>
  const match = ct.imageUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    return new NextResponse(null, { status: 404 })
  }

  const [, mimeType, base64Data] = match
  const buffer = Buffer.from(base64Data, 'base64')

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeType,
      // Cache aggressively — class type images rarely change
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  })
}
