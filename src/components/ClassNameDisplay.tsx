import { useLocale } from 'next-intl'
/**
 * ClassNameDisplay
 * Renders class name (primary) with class type below (secondary, smaller, muted).
 * Use this everywhere a class is listed so name+type are always shown together.
 */
export default function ClassNameDisplay({
  name,
  nameTh,
  classTypeName,
  classTypeNameTh,
  size = 'md',
}: {
  name: string
  nameTh?: string | null
  classTypeName?: string | null
  classTypeNameTh?: string | null
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
  const locale = useLocale()
  const displayTitle = locale === 'th' && nameTh ? nameTh : name
  const displayType = locale === 'th' && classTypeNameTh ? classTypeNameTh : classTypeName

  const showType = displayType && displayType !== displayTitle

  return (
    <div>
      <p className={nameClass}>{displayTitle}</p>
      {showType && <p className={typeClass}>{displayType}</p>}
    </div>
  )
}
