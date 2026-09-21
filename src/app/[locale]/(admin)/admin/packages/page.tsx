import { prisma } from '@/lib/prisma'
import { deletePackage } from '@/app/actions/admin'
import PackageForm from './PackageForm'
import Link from 'next/link'
import Modal from '@/components/Modal'
import DataTableTools from '@/components/admin/DataTableTools'
import Pagination from '@/components/admin/Pagination'

export default async function AdminPackagesPage({ searchParams }: { searchParams: Promise<{ editId?: string, deleteId?: string, q?: string, page?: string, filter?: string, sort?: string }> }) {
  const resolvedSearchParams = await searchParams
  const editId = resolvedSearchParams.editId
  const deleteId = resolvedSearchParams.deleteId
  const q = resolvedSearchParams.q || ''
  const filter = resolvedSearchParams.filter || ''
  const sort = resolvedSearchParams.sort || 'price_asc'
  const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1
  
  const skip = (page - 1) * 20
  const take = 20

  const where: any = {
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {})
  }
  
  if (filter) {
    where.classTypeId = filter
  }

  let orderBy: any = { price: 'asc' }
  if (sort === 'price_desc') orderBy = { price: 'desc' }
  else if (sort === 'name_asc') orderBy = { name: 'asc' }
  else if (sort === 'name_desc') orderBy = { name: 'desc' }

  const classTypes = await prisma.classType.findMany({
    orderBy: { name: 'asc' }
  })

  const [packages, totalCount] = await Promise.all([
    prisma.package.findMany({ 
      where,
      include: { classType: true },
      orderBy,
      skip,
      take
    }),
    prisma.package.count({ where })
  ])

  let editingPackage = editId ? packages.find(p => p.id === editId) : null
  if (editId && !editingPackage) {
    editingPackage = await prisma.package.findUnique({ where: { id: editId }, include: { classType: true } })
  }
  
  let deletingPackage = deleteId ? packages.find(p => p.id === deleteId) : null
  if (deleteId && !deletingPackage) {
    deletingPackage = await prisma.package.findUnique({ where: { id: deleteId }, include: { classType: true } })
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {editingPackage && (
        <Modal title="Edit Package" onCloseUrl="/en/admin/packages">
          <PackageForm initialData={editingPackage} classTypes={classTypes} />
        </Modal>
      )}

      {deletingPackage && (
        <Modal title="Confirm Deletion" onCloseUrl="/en/admin/packages">
          <div className="text-center pt-4 pb-2">
            <p className="text-[var(--foreground)] font-light text-lg mb-10">
              Are you sure you want to delete <span className="font-medium">"{deletingPackage.name}"</span>?
            </p>
            <form action={deletePackage.bind(null, deletingPackage.id)} className="flex items-center justify-center gap-4">
              <Link href="/en/admin/packages" className="btn-ghost">Cancel</Link>
              <button type="submit" className="btn-primary !bg-red-800 hover:!bg-red-900 border !border-red-800">Confirm Delete</button>
            </form>
          </div>
        </Modal>
      )}

      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-2">Packages</h1>
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Manage Pricing & Packages</p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 mb-12 shadow-sm">
        <h2 className="text-xl font-serif text-[var(--foreground)] mb-8">Add New Package</h2>
        <PackageForm classTypes={classTypes} />
      </div>

      <DataTableTools 
        searchPlaceholder="Search packages..." 
        filterPlaceholder="All Class Types"
        filterOptions={classTypes.map(ct => ({ label: ct.name, value: ct.id }))} 
        sortPlaceholder="Sort by Price"
        sortOptions={[
          { label: 'Price: Low to High', value: 'price_asc' },
          { label: 'Price: High to Low', value: 'price_desc' },
          { label: 'Name: A-Z', value: 'name_asc' },
          { label: 'Name: Z-A', value: 'name_desc' },
        ]}
      />
      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                <th className="font-medium py-6 pl-8">Package Name</th>
                <th className="font-medium py-6">Classes</th>
                <th className="font-medium py-6">Valid For</th>
                <th className="font-medium py-6">Price</th>
                <th className="font-medium py-6">Status</th>
                <th className="font-medium py-6 pr-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light text-[var(--foreground)]">
              {packages.map((pkg: any) => (
                <tr key={pkg.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
                  <td className="py-4 pl-8 font-medium text-[var(--foreground)]">
                    {pkg.name}
                  </td>
                  <td className="py-4">
                    {pkg.classCount} <span className="text-[10px] text-[var(--foreground-muted)] ml-1 uppercase">{pkg.classType.name}</span>
                  </td>
                  <td className="py-4 text-[12px] text-[var(--foreground-muted)]">
                    {pkg.expiresInDays} Days
                  </td>
                  <td className="py-4">
                    ฿{(pkg.price / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4">
                    <span className={pkg.isActive ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 pr-8 text-right">
                    <div className="flex items-center justify-end gap-6 leading-none">
                      <Link href={`/en/admin/packages?editId=${pkg.id}`} scroll={true} className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                        Edit
                      </Link>
                      <Link href={`/en/admin/packages?deleteId=${pkg.id}`} scroll={false} className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-red-700 transition-colors">
                        Delete
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-2">No packages yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination totalCount={totalCount} pageSize={20} />
    </div>
  )
}
