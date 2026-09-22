import { prisma } from '@/lib/prisma'
import { deleteClassType } from '@/app/actions/admin'
import ClassTypeForm from './ClassTypeForm'
import { Link } from '@/i18n/routing'
import Modal from '@/components/Modal'
import DataTableTools from '@/components/admin/DataTableTools'
import Pagination from '@/components/admin/Pagination'

export default async function AdminClassTypesPage({ searchParams }: { searchParams: Promise<{ editId?: string, deleteId?: string, q?: string, page?: string, filter?: string }> }) {
  const resolvedSearchParams = await searchParams
  const editId = resolvedSearchParams.editId
  const deleteId = resolvedSearchParams.deleteId
  const q = resolvedSearchParams.q || ''
  const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1
  
  const skip = (page - 1) * 20
  const take = 20

  const where = q ? { name: { contains: q, mode: 'insensitive' as const } } : {}

  const [classTypes, totalCount] = await Promise.all([
    prisma.classType.findMany({ 
      where,
      orderBy: { name: 'asc' },
      skip,
      take
    }),
    prisma.classType.count({ where })
  ])

  let editingClassType = editId ? classTypes.find(c => c.id === editId) : null
  if (editId && !editingClassType) {
    editingClassType = await prisma.classType.findUnique({ where: { id: editId } })
  }
  
  let deletingClassType = deleteId ? classTypes.find(c => c.id === deleteId) : null
  if (deleteId && !deletingClassType) {
    deletingClassType = await prisma.classType.findUnique({ where: { id: deleteId } })
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {editingClassType && (
        <Modal title="Edit Class Type" onCloseUrl="/en/admin/classes">
          <ClassTypeForm initialData={editingClassType} />
        </Modal>
      )}

      {deletingClassType && (
        <Modal title="Confirm Deletion" onCloseUrl="/en/admin/classes">
          <div className="text-center pt-4 pb-2">
            <p className="text-[var(--foreground)] font-light text-lg mb-10">
              Are you sure you want to delete <span className="font-medium">"{deletingClassType.name}"</span>?
            </p>
            <form action={deleteClassType.bind(null, deletingClassType.id)} className="flex items-center justify-center gap-4">
              <Link href="/admin/classes" className="btn-ghost">Cancel</Link>
              <button type="submit" className="btn-primary !bg-red-800 hover:!bg-red-900 border !border-red-800">Confirm Delete</button>
            </form>
          </div>
        </Modal>
      )}

      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-2">Class Types</h1>
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Define Studio Offerings</p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 mb-12 shadow-sm">
        <h2 className="text-xl font-serif text-[var(--foreground)] mb-8">Add New Class Type</h2>
        <ClassTypeForm />
      </div>

      <DataTableTools searchPlaceholder="Search classes..." />
      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                <th className="font-medium py-6 pl-8">Class Type</th>
                <th className="font-medium py-6">Status</th>
                <th className="font-medium py-6 pr-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light text-[var(--foreground)]">
              {classTypes.map(ct => (
                <tr key={ct.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
                  <td className="py-4 pl-8">
                    <div className="flex items-center gap-4">
                      {ct.imageUrl ? (
                        <img src={ct.imageUrl} alt={ct.name} className="w-10 h-14 object-cover border border-[var(--border)] shadow-sm" />
                      ) : (
                        <div className="w-10 h-14 bg-white/50 border border-[var(--border)] flex items-center justify-center text-[7px] tracking-widest text-[var(--foreground-muted)] uppercase">Img</div>
                      )}
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{ct.name}</p>
                        <p className="text-[11px] text-[var(--foreground-muted)] mt-1 max-w-[200px] truncate">{ct.description ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={ct.isActive ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}>
                      {ct.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 pr-8 text-right">
                    <div className="flex items-center justify-end gap-6 leading-none">
                      <Link href={`/en/admin/classes?editId=${ct.id}`} scroll={true} className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                        Edit
                      </Link>
                      <Link href={`/en/admin/classes?deleteId=${ct.id}`} scroll={false} className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-red-700 transition-colors">
                        Delete
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {classTypes.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-2">No class types yet.</p>
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
