import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { StatCard } from '../../components/ui/StatCard'
import { Table, type Column } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { socialApi } from '../../api/social'
import { platformApi } from '../../api/platform'
import type { CSRActivity } from '../../types/social'

export function CSRActivitiesPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    category_id: '',
    description: '',
    points_offered: '',
    date: '',
  })

  const { data: activities = [], isLoading: isActLoading } = useQuery({
    queryKey: ['csrActivities'],
    queryFn: () => socialApi.listActivities(),
  })

  const { data: categories = [], isLoading: isCatLoading } = useQuery({
    queryKey: ['categories', 'CSR_ACTIVITY'],
    queryFn: () => platformApi.listCategories('CSR_ACTIVITY'),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Partial<CSRActivity>) => socialApi.createActivity(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['csrActivities'] })
      qc.invalidateQueries({ queryKey: ['socialReport'] })
      setModalOpen(false)
      setForm({
        title: '',
        category_id: '',
        description: '',
        points_offered: '',
        date: '',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => socialApi.deleteActivity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['csrActivities'] })
      qc.invalidateQueries({ queryKey: ['socialReport'] })
    },
  })

  const isLoading = isActLoading || isCatLoading

  if (isLoading) {
    return (
      <Layout title="CSR Activities">
        <PageSpinner />
      </Layout>
    )
  }

  const totalActivities = activities.length
  const totalPointsOffered = activities.reduce((acc, curr) => acc + curr.points_offered, 0)

  const columns: Column<CSRActivity>[] = [
    { header: 'Title', accessor: 'title' },
    {
      header: 'Category',
      accessor: 'category_id',
      render: (r) => {
        const cat = categories.find(c => c.id === r.category_id)
        return cat ? cat.name : `Cat ID: ${r.category_id}`
      },
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (r) =>
        r.description.length > 60 ? `${r.description.substring(0, 60)}...` : r.description,
    },
    { header: 'Points Offered', accessor: 'points_offered', numeric: true },
    {
      header: 'Date',
      accessor: 'date',
      render: (r) => new Date(r.date).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (r) => (
        <Button
          variant="ghost"
          icon="ti-trash"
          onClick={(e) => {
            e.stopPropagation()
            if (confirm('Are you sure you want to delete this activity?')) {
              deleteMutation.mutate(r.id)
            }
          }}
          className="text-red-600 border-none hover:bg-red-50"
        />
      ),
    },
  ]

  function handleConfirm() {
    if (!form.title || !form.category_id || !form.points_offered) {
      alert('Please fill out all required fields.')
      return
    }

    const payload = {
      title: form.title,
      category_id: Number(form.category_id),
      description: form.description,
      points_offered: Number(form.points_offered),
      date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
    }

    createMutation.mutate(payload)
  }

  return (
    <Layout title="CSR Activities">
      {/* Stat Row */}
      <div className="grid grid-cols-2 gap-[10px] mb-6">
        <StatCard
          label="Total Activities"
          value={totalActivities}
          stripe="forest"
          icon="ti-heart-handshake"
        />
        <StatCard
          label="Total Points Offered"
          value={totalPointsOffered}
          stripe="sage"
          icon="ti-award"
        />
      </div>

      {/* Main Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-charcoal">All CSR Activities</h2>
          <Button variant="primary" icon="ti-plus" onClick={() => setModalOpen(true)}>
            Add Activity
          </Button>
        </div>

        {activities.length === 0 ? (
          <EmptyState
            icon="ti-inbox"
            title="No CSR Activities found"
            description="Add a corporate social responsibility program for employees to join."
            action={
              <Button variant="primary" icon="ti-plus" onClick={() => setModalOpen(true)}>
                Add Activity
              </Button>
            }
          />
        ) : (
          <Table columns={columns} data={activities} />
        )}
      </div>

      {/* Modal */}
      <Modal
        title="Add CSR Activity"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        confirmLabel="Create"
      >
        <div>
          <label className="input-label">Title *</label>
          <input
            className="input"
            placeholder="e.g. Tree Plantation Drive"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Category *</label>
          <select
            className="input"
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
            required
          >
            <option value="">Select a Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Description</label>
          <textarea
            className="input min-h-[80px] py-2"
            placeholder="Provide brief details about the CSR action..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="input-label">Points Offered *</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 100"
            value={form.points_offered}
            onChange={(e) => setForm((f) => ({ ...f, points_offered: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Date</label>
          <input
            type="date"
            className="input"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </div>
      </Modal>
    </Layout>
  )
}
