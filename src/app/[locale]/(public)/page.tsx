import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import LanguageToggle from '@/components/LanguageToggle'
import BookButton from '@/components/BookButton'
import { logout } from '@/app/actions/auth'
import { IconInstagramColored, IconFacebookColored, IconLineColored, IconWhatsAppColored } from '@/components/SocialIcons'
import PublicNavbar from '@/components/PublicNavbar'
import InteractiveSchedule from '@/components/InteractiveSchedule'

const TZ_OFFSET = 7 // Bangkok UTC+7

// Format a UTC date into Bangkok local display strings
function bangkokDate(utcDate: Date) {
  const local = new Date(utcDate.getTime() + TZ_OFFSET * 60 * 60 * 1000)
  const day = local.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'
  })
  return day
}

export default async function HomePage() {
  const session = await auth()
  const user = session?.user as any
  const isLoggedIn = !!user

  // Fetch user credits if logged in
  let credits = 0
  if (isLoggedIn) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    })
    credits = dbUser?.credits ?? 0
  }

  // Fetch instructors for the new section
  const instructors = await prisma.user.findMany({
    where: { role: 'INSTRUCTOR', showOnFrontpage: true },
    select: { id: true, name: true, bio: true, imageUrl: true },
  })

  // Fetch upcoming scheduled classes
  const now = new Date()
  const classes = await prisma.class.findMany({
    where: {
      status: 'SCHEDULED',
      date: { gte: now },
    },
    include: {
      classType: true,
      instructor: { select: { name: true } },
    },
    orderBy: { date: 'asc' },
    take: 20,
  })

  // If logged in, fetch user's current booked class IDs
  const bookedClassIds = new Set<string>()
  if (isLoggedIn) {
    const bookings = await prisma.booking.findMany({
      where: { clientId: user.id, status: 'BOOKED' },
      select: { classId: true },
    })
    bookings.forEach(b => bookedClassIds.add(b.classId))
  }

  const CUTOFF_MS = 12 * 60 * 60 * 1000

  // Fetch active class types for the showcase
  const classTypes = await prisma.classType.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' }
  })

  // Fetch active packages
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  })

  return (
    <div className="flex-1 w-full flex flex-col">
      <PublicNavbar isLoggedIn={isLoggedIn} user={user} credits={credits} />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden pt-32 bg-[#DED6CC]">
        <div className="absolute inset-0 z-0 bg-[#DED6CC]">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--foreground)]/25 to-[var(--foreground)]/5"></div>
        </div>
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 md:px-8 py-12 text-center">
          <div className="max-w-4xl mx-auto">
            {isLoggedIn && user?.name && (
              <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-white/90 mb-6 font-light drop-shadow-sm">
                Welcome, {user.name}
              </p>
            )}
            <h1 className="font-serif font-normal text-5xl md:text-7xl lg:text-8xl text-white leading-tight mb-8">
              Move with intention<br />Find your balance
            </h1>
            <p className="font-light text-lg md:text-xl text-white/90 mb-12">
              Discover your rhythm at Anya Pilates, Bangkok
            </p>
            <a href="#schedule" className="font-light tracking-widest text-xs sm:text-sm text-white border border-white/60 rounded-full px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all uppercase">
              View Schedule
            </a>
          </div>
        </div>
      </section>

      {/* ── Live Schedule ─────────────────────────────── */}
      <section id="schedule" className="py-24 md:py-28 bg-[var(--background)]">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-4">Upcoming Classes</h2>
            <div className="w-16 h-px bg-[var(--accent-light)] mx-auto"></div>
          </div>

          {/* Using Interactive Schedule */}
          <InteractiveSchedule 
            classes={classes} 
            bookedClassIds={Array.from(bookedClassIds)} 
            isLoggedIn={isLoggedIn} 
            userRole={user?.role}
          />
        </div>
      </section>

      {/* ── Classes Section ──────────────────────────── */}
      <section id="classes" className="py-24 md:py-32 bg-[var(--surface)]">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-4">Our Classes</h2>
            <div className="w-16 h-px bg-[var(--accent-light)] mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-10">
            {classTypes.map(ct => (
              <Link key={ct.id} href={`/en/classes/${ct.id}`} className="group block cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                <div className="relative h-96 overflow-hidden mb-6 bg-[var(--background)]">
                  {ct.imageUrl ? (
                    <img 
                      src={ct.imageUrl} 
                      alt={ct.name} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--foreground-muted)] opacity-40 font-serif italic text-xl">
                      {ct.name}
                    </div>
                  )}
                </div>
                <div className="w-full h-px bg-[var(--border)] mb-6 transition-colors group-hover:bg-[var(--accent)]"></div>
                <div className="text-center">
                  <h3 className="text-sm font-medium text-[var(--foreground)] mb-3 uppercase tracking-widest transition-colors group-hover:text-[var(--accent)]">
                    {ct.name}
                  </h3>
                  <p className="text-base font-serif text-[var(--foreground-muted)] px-4">
                    {ct.description || 'Join us for a transformative session.'}
                  </p>
                </div>
              </Link>
            ))}
            {classTypes.length === 0 && (
              <div className="col-span-full text-center text-[var(--foreground-muted)] font-serif italic">
                Classes are being scheduled. Check back soon!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Packages ─────────────────────────────────── */}
      <section id="packages" className="py-24 md:py-32 bg-[var(--background)]">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-4">Packages</h2>
            <div className="w-16 h-px bg-[var(--accent-light)] mx-auto"></div>
          </div>
          
          <div className={packages.length > 3 
            ? "flex overflow-x-auto snap-x snap-mandatory gap-6 md:gap-8 pb-12 mb-12 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide" 
            : "flex flex-col md:flex-row justify-center items-center md:items-stretch gap-6 md:gap-8 mb-16"
          }>
            {packages.map(pkg => (
              <div 
                key={pkg.id} 
                className={`relative group bg-white/40 hover:bg-white/60 backdrop-blur-md border border-white/60 hover:border-white rounded-[2.5rem] p-10 md:p-12 text-center flex flex-col items-center shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)] transition-all duration-500 overflow-hidden ${
                  packages.length > 3 ? 'w-[85vw] md:w-[360px] shrink-0 snap-center' : 'w-full md:w-[360px]'
                }`}
              >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                
                <h3 className="text-2xl font-serif font-normal text-[var(--foreground)] mb-1 z-10">{pkg.name}</h3>
                <p className="text-[9px] tracking-[0.3em] uppercase text-[var(--foreground-muted)] mb-10 z-10">
                  {pkg.credits} Credit{pkg.credits > 1 ? 's' : ''}
                </p>
                
                <div className="flex-1 flex flex-col justify-center items-center mb-10 z-10 w-full">
                  <span className="text-[9px] tracking-widest uppercase text-[var(--foreground-muted)] mb-3">Price</span>
                  <div className="text-5xl font-light text-[var(--foreground)] tracking-tight">
                    <span className="text-xl font-normal align-top mr-1">฿</span>
                    {(pkg.price / 100).toLocaleString('en-US')}
                  </div>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mb-8 z-10"></div>
                
                <Link 
                  href={isLoggedIn ? `/en/buy-credits?packageId=${pkg.id}` : "/en/register"} 
                  className="relative z-10 w-full bg-transparent border border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] py-4 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium transition-colors duration-300 shadow-sm text-center"
                >
                  Select Package
                </Link>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] text-center max-w-md leading-relaxed">
              All packages are non-refundable. Credits expire 6 months from the date of purchase.
            </p>
          </div>
        </div>
      </section>


      {/* ── Our Instructors ────────────────────────────── */}
      {instructors.length > 0 && (
        <section id="instructors" className="py-24 md:py-32 bg-[var(--surface)]">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-4">Our Instructors</h2>
              <div className="w-16 h-px bg-[var(--accent-light)] mx-auto"></div>
            </div>
            <div className="flex flex-wrap justify-center gap-12 lg:gap-16">
              {instructors.map(instructor => (
                <div key={instructor.id} className="flex flex-col items-center text-center group w-full md:w-[300px]">
                  <div className="w-48 h-48 rounded-full overflow-hidden mb-6 bg-[var(--background)] border-2 border-[var(--background)] shadow-sm group-hover:shadow-md transition-shadow flex items-center justify-center">
                    {instructor.imageUrl ? (
                      <img 
                        src={instructor.imageUrl} 
                        alt={instructor.name} 
                        className="w-full h-full object-cover md:grayscale md:opacity-80 md:group-hover:grayscale-0 md:group-hover:opacity-100 transition-all duration-500" 
                      />
                    ) : (
                      <span className="font-serif text-4xl text-[var(--foreground-muted)] opacity-50">
                        {instructor.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-serif text-[var(--foreground)] mb-2">{instructor.name}</h3>
                  <p className="text-sm font-light text-[var(--foreground-muted)] leading-relaxed max-w-xs whitespace-pre-wrap">
                    {instructor.bio || 'Pilates Instructor'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── About Studio ─────────────────────────────── */}
      <section id="studio" className="relative py-24 md:py-32 overflow-hidden bg-[var(--foreground)] text-[var(--background)]">
        <div className="relative container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif font-normal mb-8 leading-tight">About Anya</h2>
              <div className="space-y-6 text-white/80 leading-relaxed text-lg font-light">
                <p>Anya is a space dedicated to conscious and controlled movement. A place where the rhythm slows down, the breath settles, and the body works with care and precision.</p>
                <p>We work exclusively on Reformers, in small groups, to ensure we keep the focus on technique, alignment, and control.</p>
                <p>At Anya, movement is not about rushing, but about presence — an intimate, bright environment that invites relaxation and reconnection with your own body.</p>
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="col-span-2 h-72 bg-white/10 rounded-2xl flex items-center justify-center font-serif italic text-white/40">
                Studio Interior
              </div>
              <div className="h-48 bg-white/10 rounded-2xl"></div>
              <div className="h-48 bg-white/10 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer id="contact" className="bg-[var(--foreground)] text-[var(--background)] border-t border-white/10">
        <div className="container mx-auto px-6 py-16 md:py-24 max-w-7xl">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-3xl tracking-[0.3em] uppercase font-light mb-4">ANYA</h2>
            <p className="text-white/60 text-sm max-w-xl leading-relaxed">
              An exclusive Reformer Pilates studio focused on conscious movement, breath, and control.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left mb-16">
            <div>
              <h3 className="text-lg font-light uppercase tracking-widest mb-6">Contact</h3>
              <ul className="space-y-4 text-white/70 font-light">
                <li>Bangkok, Thailand</li>
                <li>hello@anyapilates.com</li>
                <li>+66 80 123 4567</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-light uppercase tracking-widest mb-6">Hours</h3>
              <ul className="space-y-4 text-white/70 font-light">
                <li>Monday – Friday: 07:00 – 21:00</li>
                <li>Saturday: 09:00 – 15:00</li>
                <li>Sunday: Closed</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-light uppercase tracking-widest mb-6">Social</h3>
              <div className="flex justify-center md:justify-start gap-4 grayscale">
                <a href="#" aria-label="Instagram" className="p-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors">
                  <IconInstagramColored size={24} />
                </a>
                <a href="#" aria-label="Facebook" className="p-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors">
                  <IconFacebookColored size={24} />
                </a>
                <a href="#" aria-label="Line" className="p-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors">
                  <IconLineColored size={24} />
                </a>
                <a href="#" aria-label="WhatsApp" className="p-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors">
                  <IconWhatsAppColored size={24} />
                </a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50">
            <p>© 2026 Anya Pilates. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
