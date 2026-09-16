const fs = require('fs');
const file = 'src/app/[locale]/(public)/page.tsx';
const content = fs.readFileSync(file, 'utf8');

const instructorsSection = `
      {/* ── Our Instructors ────────────────────────────── */}
      <section id="instructors" className="py-24 md:py-32 bg-[var(--surface)]">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-4">Our Instructors</h2>
            <div className="w-16 h-px bg-[var(--accent-light)] mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-10">
            {/* Instructor 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-48 h-48 rounded-full overflow-hidden mb-6 bg-[var(--background)] border-2 border-[var(--background)] shadow-sm group-hover:shadow-md transition-shadow">
                <img src="/placeholder-instructor.jpg" alt="Instructor" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center'); e.currentTarget.parentElement!.innerHTML = '<span class="font-serif text-2xl text-[var(--foreground-muted)] opacity-50">M</span>' }} />
              </div>
              <h3 className="text-xl font-serif text-[var(--foreground)] mb-2">Master Tin</h3>
              <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] mb-4">Lead Instructor</p>
              <p className="text-sm font-light text-[var(--foreground-muted)] leading-relaxed max-w-xs">
                With a deep focus on alignment and mindful movement, Tin guides you to find your balance and center in every session.
              </p>
            </div>
            {/* Instructor 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-48 h-48 rounded-full overflow-hidden mb-6 bg-[var(--background)] border-2 border-[var(--background)] shadow-sm group-hover:shadow-md transition-shadow">
                <img src="/placeholder-instructor.jpg" alt="Instructor" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center'); e.currentTarget.parentElement!.innerHTML = '<span class="font-serif text-2xl text-[var(--foreground-muted)] opacity-50">A</span>' }} />
              </div>
              <h3 className="text-xl font-serif text-[var(--foreground)] mb-2">Anya</h3>
              <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] mb-4">Senior Instructor</p>
              <p className="text-sm font-light text-[var(--foreground-muted)] leading-relaxed max-w-xs">
                Anya brings a calm, grounding energy to the studio, ensuring every movement is executed with care and precision.
              </p>
            </div>
            {/* Instructor 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-48 h-48 rounded-full overflow-hidden mb-6 bg-[var(--background)] border-2 border-[var(--background)] shadow-sm group-hover:shadow-md transition-shadow">
                <img src="/placeholder-instructor.jpg" alt="Instructor" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center'); e.currentTarget.parentElement!.innerHTML = '<span class="font-serif text-2xl text-[var(--foreground-muted)] opacity-50">S</span>' }} />
              </div>
              <h3 className="text-xl font-serif text-[var(--foreground)] mb-2">Sophia</h3>
              <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] mb-4">Instructor</p>
              <p className="text-sm font-light text-[var(--foreground-muted)] leading-relaxed max-w-xs">
                Passionate about controlled flow, Sophia focuses on building core strength and enhancing full-body flexibility.
              </p>
            </div>
          </div>
        </div>
      </section>
`;

const replaced = content.replace('      {/* ── About Studio ─────────────────────────────── */}', instructorsSection + '\n      {/* ── About Studio ─────────────────────────────── */}');
fs.writeFileSync(file, replaced);
