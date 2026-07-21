import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, FolderTree, Layers, Pencil, Shapes, Trash2 } from 'lucide-react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import StatCard from '../components/StatCard'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mainName, setMainName] = useState('')
  const [subName, setSubName] = useState('')
  const [mainCategoryId, setMainCategoryId] = useState('')
  const [submittingMain, setSubmittingMain] = useState(false)
  const [submittingSub, setSubmittingSub] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [expanded, setExpanded] = useState({})
  const [editingMainId, setEditingMainId] = useState(null)
  const [editingMainName, setEditingMainName] = useState('')
  const [editingSubId, setEditingSubId] = useState(null)
  const [editingSubName, setEditingSubName] = useState('')
  const [savingId, setSavingId] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getBusinessCategories()
      .then((data) => {
        setCategories(data)
        setExpanded((prev) => {
          const next = {}
          data.forEach((main) => {
            next[main.id] = prev[main.id] === true
          })
          return next
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const totals = useMemo(() => {
    const totalSubcategories = categories.reduce((sum, main) => sum + main.subcategories.length, 0)
    const totalBusinesses = categories.reduce((sum, main) => sum + Number(main.count || 0), 0)
    return {
      totalMainCategories: categories.length,
      totalSubcategories,
      totalBusinesses,
    }
  }, [categories])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  const handleCreateMain = async (e) => {
    e.preventDefault()
    setSubmittingMain(true)
    setSubmitError('')
    try {
      await adminApi.createMainCategory(mainName)
      setMainName('')
      load()
    } catch (err) {
      setSubmitError(err.message || 'Failed to create main category')
    } finally {
      setSubmittingMain(false)
    }
  }

  const handleCreateSub = async (e) => {
    e.preventDefault()
    setSubmittingSub(true)
    setSubmitError('')
    try {
      await adminApi.createSubCategory(mainCategoryId, subName)
      setSubName('')
      load()
    } catch (err) {
      setSubmitError(err.message || 'Failed to create subcategory')
    } finally {
      setSubmittingSub(false)
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    setSubmitError('')
    try {
      await adminApi.seedCategories()
      load()
    } catch (err) {
      setSubmitError(err.message || 'Failed to seed categories')
    } finally {
      setSeeding(false)
    }
  }

  const startEditMain = (main) => {
    setEditingMainId(main.id)
    setEditingMainName(main.name)
    setEditingSubId(null)
    setSubmitError('')
  }

  const startEditSub = (sub) => {
    setEditingSubId(sub.id)
    setEditingSubName(sub.name)
    setEditingMainId(null)
    setSubmitError('')
  }

  const cancelEdit = () => {
    setEditingMainId(null)
    setEditingSubId(null)
    setEditingMainName('')
    setEditingSubName('')
  }

  const saveMain = async (id) => {
    setSavingId(id)
    setSubmitError('')
    try {
      await adminApi.updateMainCategory(id, editingMainName)
      cancelEdit()
      load()
    } catch (err) {
      setSubmitError(err.message || 'Failed to update main category')
    } finally {
      setSavingId('')
    }
  }

  const saveSub = async (id) => {
    setSavingId(id)
    setSubmitError('')
    try {
      await adminApi.updateSubCategory(id, { name: editingSubName })
      cancelEdit()
      load()
    } catch (err) {
      setSubmitError(err.message || 'Failed to update subcategory')
    } finally {
      setSavingId('')
    }
  }

  const deleteMain = async (main) => {
    const confirmed = window.confirm(
      `Delete main category "${main.name}" and all its subcategories? This cannot be undone.`,
    )
    if (!confirmed) return

    setSavingId(main.id)
    setSubmitError('')
    try {
      await adminApi.deleteMainCategory(main.id)
      load()
    } catch (err) {
      setSubmitError(err.message || 'Failed to delete main category')
    } finally {
      setSavingId('')
    }
  }

  const deleteSub = async (sub) => {
    const confirmed = window.confirm(`Delete subcategory "${sub.name}"? This cannot be undone.`)
    if (!confirmed) return

    setSavingId(sub.id)
    setSubmitError('')
    try {
      await adminApi.deleteSubCategory(sub.id)
      load()
    } catch (err) {
      setSubmitError(err.message || 'Failed to delete subcategory')
    } finally {
      setSavingId('')
    }
  }

  const toggleExpanded = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description="All categories are editable — rename or delete defaults and custom ones anytime."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Main categories"
          value={totals.totalMainCategories}
          hint="Top-level industry groups"
          icon={FolderTree}
        />
        <StatCard
          label="Subcategories"
          value={totals.totalSubcategories}
          hint="Specific business types"
          icon={Layers}
        />
        <StatCard
          label="Businesses categorized"
          value={totals.totalBusinesses}
          hint="Businesses assigned to subcategories"
          icon={Shapes}
        />
      </div>

      {submitError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Add main category</h2>
          <p className="mt-1 text-sm text-slate-500">Create a top-level category such as Restaurants & Bars.</p>
          <form onSubmit={handleCreateMain} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              className="input-field flex-1"
              value={mainName}
              onChange={(e) => setMainName(e.target.value)}
              placeholder="e.g. Restaurants & Bars"
              required
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
              disabled={submittingMain}
            >
              {submittingMain ? 'Adding...' : 'Add main'}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Add subcategory</h2>
          <p className="mt-1 text-sm text-slate-500">Add a subcategory under an existing main category.</p>
          <form onSubmit={handleCreateSub} className="mt-4 space-y-3">
            <select
              className="input-field w-full"
              value={mainCategoryId}
              onChange={(e) => setMainCategoryId(e.target.value)}
              required
            >
              <option value="">Select main category</option>
              {categories.map((main) => (
                <option key={main.id} value={main.id}>
                  {main.name}
                </option>
              ))}
            </select>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="input-field flex-1"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="e.g. Coffee & Tea"
                required
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
                disabled={submittingSub || categories.length === 0}
              >
                {submittingSub ? 'Adding...' : 'Add sub'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Category tree</h2>
          <p className="text-sm text-slate-500">Edit or delete any main category or subcategory, including defaults.</p>
        </div>
        <button
          type="button"
          onClick={handleSeed}
          disabled={seeding}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          {seeding ? 'Seeding...' : 'Seed missing defaults'}
        </button>
      </div>

      <div className="card overflow-hidden">
        {categories.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500">
            No categories yet. Add a main category or seed the default tree.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((main) => {
              const isOpen = expanded[main.id]
              const isEditingMain = editingMainId === main.id
              return (
                <div key={main.id}>
                  <div className="flex items-center gap-2 px-4 py-4 hover:bg-gray-50">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(main.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                      {isEditingMain ? (
                        <input
                          className="input-field"
                          value={editingMainName}
                          onChange={(e) => setEditingMainName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      ) : (
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{main.name}</p>
                          <p className="text-sm text-slate-500">
                            {main.subcategories.length} subcategories · {main.count} businesses
                          </p>
                        </div>
                      )}
                    </button>

                    <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {isEditingMain ? (
                        <>
                          <button
                            type="button"
                            className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                            disabled={savingId === main.id}
                            onClick={() => saveMain(main.id)}
                          >
                            {savingId === main.id ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                            title="Edit main category"
                            onClick={() => startEditMain(main)}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            title="Delete main category"
                            disabled={savingId === main.id}
                            onClick={() => deleteMain(main)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50/70">
                      {main.subcategories.length === 0 ? (
                        <p className="px-12 py-4 text-sm text-slate-500">No subcategories yet.</p>
                      ) : (
                        <table className="data-table">
                          <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 pl-12 font-medium text-gray-700">Subcategory</th>
                              <th className="px-4 py-3 font-medium text-gray-700">Businesses</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {main.subcategories.map((sub) => {
                              const isEditingSub = editingSubId === sub.id
                              return (
                                <tr key={sub.id} className="border-b border-gray-100 bg-white">
                                  <td className="px-4 py-3 pl-12 font-medium text-slate-800">
                                    {isEditingSub ? (
                                      <input
                                        className="input-field max-w-md"
                                        value={editingSubName}
                                        onChange={(e) => setEditingSubName(e.target.value)}
                                        autoFocus
                                      />
                                    ) : (
                                      sub.name
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-gray-500">{sub.count}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                      {isEditingSub ? (
                                        <>
                                          <button
                                            type="button"
                                            className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                                            disabled={savingId === sub.id}
                                            onClick={() => saveSub(sub.id)}
                                          >
                                            {savingId === sub.id ? 'Saving...' : 'Save'}
                                          </button>
                                          <button
                                            type="button"
                                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                            onClick={cancelEdit}
                                          >
                                            Cancel
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                                            title="Edit subcategory"
                                            onClick={() => startEditSub(sub)}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </button>
                                          <button
                                            type="button"
                                            className="rounded-lg border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                            title="Delete subcategory"
                                            disabled={savingId === sub.id}
                                            onClick={() => deleteSub(sub)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
