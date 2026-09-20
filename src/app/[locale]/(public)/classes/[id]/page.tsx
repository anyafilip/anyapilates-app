import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PublicNavbar from '@/components/PublicNavbar'
import Link from 'next/link'
import { auth } from '@/auth'

export default async function ClassTypePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  const classType = await prisma.classType.findUnique({
    where: { id: resolvedParams.id },
  })

  if (!classType) return notFound()

  // Fetch auth for Navbar
  const session = await auth()
  const user = session?.user as any
  const isLoggedIn = !!user

  if (isLoggedIn) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    })
  }

  // Find upcoming sessions of this type
  const upcomingSessions = await prisma.class.findMany({
    where: {
      classTypeId: classType.id,
      date: { gte: new Date() },
      status: 'SCHEDULED'
    },
    include: { instructor: true },
    orderBy: { date: 'asc' },
    take: 5
  })

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col selection:bg-[var(--foreground)] selection:text-[var(--background)]">
      <PublicNavbar isLoggedIn={isLoggedIn} user={user} />
      
      <main className="flex-1 pt-32 pb-24 px-6 max-w-7xl mx-auto w-full">
        <div className="mb-12">
          <Link href="/en" className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Schedule
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
          
          {/* Left Column: Sticky Image */}
          <div className="w-full lg:w-5/12 lg:sticky lg:top-32">
            <div className="relative aspect-[3/4] w-full rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white/60 bg-[var(--surface)]">
              {classType.imageUrl ? (
                <img src={classType.imageUrl} alt={classType.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] hover:scale-105" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[var(--foreground-muted)] opacity-40 font-serif italic text-xl">
                  {classType.name}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Editorial Content */}
          <div className="w-full lg:w-7/12 pt-4 lg:pt-12">
            <h1 className="text-5xl md:text-7xl font-serif text-[var(--foreground)] mb-8 leading-[1.1] tracking-tight">
              {classType.name}
            </h1>
            
            <div className="flex items-center gap-6 mb-12 pb-12 border-b border-[var(--border)]">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-2xl font-serif text-[var(--foreground)] leading-none mb-1">1</p>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Class</p>
                </div>
              </div>
            </div>

            <div className="text-lg md:text-xl font-light text-[var(--foreground)]/80 leading-relaxed mb-20 space-y-6">
              <p>{classType.description || "Experience a mindful connection of breath, alignment, and movement in this dedicated session."}</p>
            </div>

            {/* Upcoming Sessions Section */}
            <div>
              <div className="flex items-end justify-between mb-8">
                <h2 className="text-3xl font-serif text-[var(--foreground)]">Upcoming Sessions</h2>
              </div>

              {upcomingSessions.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {upcomingSessions.map(session => {
                    const d = new Date(session.date)
                    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                    return (
                      <div key={session.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 md:p-8 bg-white/40 backdrop-blur-lg rounded-[2rem] border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:bg-white/70 transition-all duration-300">
                        <div className="mb-4 sm:mb-0">
                          <p className="text-xl font-medium text-[var(--foreground)] mb-1 group-hover:text-[var(--accent)] transition-colors">{dateStr}</p>
                          <p className="text-sm font-light text-[var(--foreground-muted)]">{session.startTime} · with {session.instructor?.name}</p>
                        </div>
                        <Link href={`/en#schedule`} className="inline-flex items-center justify-center bg-[var(--foreground)] text-[var(--background)] px-8 py-4 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-transform duration-300 hover:scale-105 shrink-0 shadow-sm">
                          Reserve Space
                        </Link>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white/30 backdrop-blur-sm rounded-[2rem] border border-white/50 p-12 text-center shadow-sm">
                  <p className="text-[var(--foreground-muted)] font-serif italic text-xl mb-2">No sessions scheduled.</p>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]/70">Check back later</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
