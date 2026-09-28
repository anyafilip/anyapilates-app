/**
 * ClassNameDisplay
 * Renders class name (primary) with class type below (secondary, smaller, muted).
 * Use this everywhere a class is listed so name+type are always shown together.
 */
export default function ClassNameDisplay({
  name,
  classTypeName,
  size = 'md',
}: {
  name: string
  classTypeName?: string | null
  /** 'sm' for compact table rows, 'md' for cards, 'lg' for page headings */
  size?: 'sm' | 'md' | 'lg'
}) {
  const nameClass =
    size === 'lg'
      ? 'font-serif font-light text-3xl md:text-4xl text-[var(--foreground)]'
      : size === 'sm'
      ? 'font-medium text-sm text-[var(--foreground)]'
      : 'font-medium text-base text-[var(--foreground)]'

  const typeClass =
    size === 'lg'
      ? 'text-sm font-light text-[var(--foreground-muted)] mt-1'
      : 'text-[10px] tracking-[0.15em] uppercase text-[var(--foreground-muted)] mt-0.5'

  // Only show type if it differs from the name (avoids "Group Class / Group Class")
  const showType = classTypeName && classTypeName !== name

  return (
    <div>
      <p className={nameClass}>{name}</p>
      {showType && <p className={typeClass}>{classTypeName}</p>}
    </div>
  )
}
