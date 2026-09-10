import { prisma } from '@/lib/prisma'
import { deletePackage } from '@/app/actions/admin'
import PackageForm from './PackageForm'
import Link from 'next/link'
import Modal from '@/components/Modal'

export default async function AdminPackagesPage({ searchParams }: { searchParams: Promise<{ editId?: string, deleteId?: string }> }) {
  const resolvedSearchParams = await searchParams
  const editId = resolvedSearchParams.editId
  const deleteId = resolvedSearchParams.deleteId

  const packages = await prisma.package.findMany({ orderBy: { price: 'asc' } })
  const editingPackage = editId ? packages.find(p => p.id === editId) : null
  const deletingPackage = deleteId ? packages.find(p => p.id === deleteId) : null

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {editingPackage && (
        <Modal title="Edit Package" onCloseUrl="/en/admin/packages">
          <PackageForm initialData={editingPackage} />
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
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Manage Pricing & Credits</p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 mb-12 shadow-sm">
        <h2 className="text-xl font-serif text-[var(--foreground)] mb-8">Add New Package</h2>
        <PackageForm />
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                <th className="font-medium py-6 pl-8">Package Name</th>
                <th className="font-medium py-6">Credits</th>
                <th className="font-medium py-6">Price</th>
                <th className="font-medium py-6">Status</th>
                <th className="font-medium py-6 pr-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light text-[var(--foreground)]">
              {packages.map(pkg => (
                <tr key={pkg.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
                  <td className="py-4 pl-8 font-medium text-[var(--foreground)]">
                    {pkg.name}
                  </td>
                  <td className="py-4">
                    {pkg.credits} <span className="text-[10px] text-[var(--foreground-muted)] ml-1 uppercase">Cr</span>
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
                  <td colSpan={5} className="py-16 text-center">
                    <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-2">No packages yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
