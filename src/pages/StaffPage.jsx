import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { adminApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import Button from '../components/Button'
import {
  TableActionButton,
  TableActionsCell,
  TableActionsHeader,
  TableIconButton,
} from '../components/TableActions'
import { crmRoleLabel } from '../utils/constants'
import { formatDate } from '../utils/format'
import PasswordInput from '../components/PasswordInput'
import DomainEmailInput, { toCrmEmail, crmEmailLocalPart } from '../components/DomainEmailInput'

const emptyForm = { name: '', emailLocal: '', password: '', role: 'admin' }

export default function StaffPage() {
  const { isSuperAdmin } = useAuth()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getStaff()
      .then(setStaff)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setFormError('')
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  const startEdit = (member) => {
    if (!isSuperAdmin || member.role === 'super_admin') return
    setEditingId(member.id)
    setForm({
      name: member.name || '',
      emailLocal: crmEmailLocalPart(member.email),
      password: '',
      role: member.role === 'viewer' ? 'viewer' : 'admin',
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isSuperAdmin) return
    setSaving(true)
    setFormError('')
    try {
      const email = toCrmEmail(form.emailLocal)
      if (!email || !email.includes('@')) {
        setFormError('Enter a valid email username')
        setSaving(false)
        return
      }
      if (editingId) {
        const payload = {
          name: form.name,
          email,
          role: form.role,
        }
        if (form.password.trim()) payload.password = form.password
        await adminApi.updateStaff(editingId, payload)
      } else {
        await adminApi.createStaff({
          name: form.name,
          email,
          password: form.password,
          role: form.role,
        })
      }
      setModalOpen(false)
      setEditingId(null)
      setForm(emptyForm)
      load()
    } catch (err) {
      setFormError(err.message || (editingId ? 'Could not update user' : 'Could not create user'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!isSuperAdmin) return
    if (!window.confirm(`Remove CRM user "${name}"?`)) return
    try {
      await adminApi.deleteStaff(id)
      if (editingId === id) closeModal()
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  return (
    <div>
      <PageHeader
        title="CRM Team"
        description="Create and edit Admin and Viewer accounts (super admin only)"
      >
        {isSuperAdmin && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Create system user
          </button>
        )}
      </PageHeader>

      {!isSuperAdmin && (
        <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Only the super admin can create or edit Admin and Viewer accounts.
        </p>
      )}

      <div className="card table-scroll">
        <table className="data-table min-w-[48rem]">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">Name</th>
              <th className="px-4 py-3 font-medium text-gray-700">Email</th>
              <th className="px-4 py-3 font-medium text-gray-700">Role</th>
              <th className="px-4 py-3 font-medium text-gray-700">Joined</th>
              {isSuperAdmin && <TableActionsHeader />}
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 5 : 4} className="px-4 py-8 text-center text-gray-500">
                  No CRM users found
                </td>
              </tr>
            ) : (
              staff.map((member) => (
                <tr key={member.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium">{member.name}</td>
                  <td className="px-4 py-3 text-gray-500">{member.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        member.role === 'super_admin'
                          ? 'bg-fuchsia-100 text-fuchsia-800'
                          : member.role === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {crmRoleLabel(member.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(member.created_at)}</td>
                  {isSuperAdmin && (
                    <TableActionsCell>
                      {member.role === 'super_admin' ? (
                        <span className="text-xs text-gray-400">Protected</span>
                      ) : (
                        <>
                          <TableActionButton
                            variant="secondary"
                            icon={Pencil}
                            title="Edit staff member"
                            onClick={() => startEdit(member)}
                          >
                            Edit
                          </TableActionButton>
                          <TableIconButton
                            variant="danger"
                            title="Remove staff member"
                            onClick={() => handleDelete(member.id, member.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </TableIconButton>
                        </>
                      )}
                    </TableActionsCell>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && isSuperAdmin && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:px-4 sm:py-10">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={closeModal} aria-hidden="true" />
          <div className="relative z-10 max-h-[96vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">
                  {editingId ? 'Edit system user' : 'Create system user'}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {editingId ? 'Update Admin or Viewer account details' : 'Add a new Admin or Viewer account'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              key={editingId ? `edit-${editingId}` : 'create'}
              onSubmit={handleSubmit}
              className="space-y-4"
              autoComplete="off"
            >
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
                <input
                  required
                  name="crm-staff-name"
                  autoComplete="off"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field"
                />
              </div>

              <DomainEmailInput
                id="staffEmail"
                label="Email"
                required
                value={form.emailLocal}
                onChange={(emailLocal) => setForm((f) => ({ ...f, emailLocal }))}
                placeholder=""
              />

              <PasswordInput
                id="staffPassword"
                name="crm-staff-password"
                autoComplete="new-password"
                label={editingId ? 'New password (optional)' : 'Password'}
                required={!editingId}
                minLength={6}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder=""
                labelClassName="mb-1.5 block text-sm font-medium text-gray-700"
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="input-field"
                >
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving
                    ? editingId
                      ? 'Saving...'
                      : 'Creating...'
                    : editingId
                      ? 'Save changes'
                      : 'Create user'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
