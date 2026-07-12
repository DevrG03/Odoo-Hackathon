import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { StatCard } from '../../components/ui/StatCard'
import { Table, type Column } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { governanceApi } from '../../api/governance'
import type { Audit } from '../../types/governance'

export function AuditsPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null)
  
  const [form, setForm] = useState({
    title: '',
    auditor: '',
    date: '',
    status: 'Planned',
  })

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['governanceAudits'],
    queryFn: () => governanceApi.listAudits(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Audit>) => governanceApi.createAudit(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['governanceAudits'] })
      qc.invalidateQueries({ queryKey: ['governanceReport'] })
      handleClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Audit> }) =>
      governanceApi.updateAudit(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['governanceAudits'] })
      qc.invalidateQueries({ queryKey: ['governanceReport'] })
      handleClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => governanceApi.deleteAudit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['governanceAudits'] })
      qc.invalidateQueries({ queryKey: ['governanceReport'] })
    },
  })

  function handleOpenCreate() {
    setEditingAudit(null)
    setForm({ title: '', auditor: '', date: '', status: 'Planned' })
    setModalOpen(true)
  }

  function handleOpenEdit(audit: Audit) {
    setEditingAudit(audit)
    setForm({
      title: audit.title,
      auditor: audit.auditor,
      date: audit.date ? audit.date.split('T')[0] : '',
      status: audit.status,
    })
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditingAudit(null)
    setForm({ title: '', auditor: '', date: '', status: '' })
  }

  function handleConfirm() {
    if (!form.title || !form.auditor || !form.date || !form.status) {
      alert('Please fill out all required fields.')
      return
    }

    const payload = {
      title: form.title,
      auditor: form.auditor,
      date: new Date(form.date).toISOString(),
      status: form.status,
    }

    if (editingAudit) {
      updateMutation.mutate({ id: editingAudit.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const columns: Column<Audit>[] = [
    { header: 'Title', accessor: 'title' },
    { header: 'Auditor', accessor: 'auditor' },
    {
      header: 'Date',
      accessor: 'date',
      render: (r) => new Date(r.date).toLocaleDateString(),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => <Badge value={r.status} />,
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (r) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            icon="ti-edit"
            onClick={(e) => {
              e.stopPropagation()
              handleOpenEdit(r)
            }}
            className="text-forest border-none hover:bg-dew"
          />
          <Button
            variant="ghost"
            icon="ti-trash"
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Are you sure you want to delete this audit?')) {
                deleteMutation.mutate(r.id)
              }
            }}
            className="text-red-600 border-none hover:bg-red-50"
          />
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <Layout title="Audits">
        <PageSpinner />
      </Layout>
    )
  }

  const total = audits.length
  const planned = audits.filter((a) => a.status === 'Planned').length
  const inProgress = audits.filter((a) => a.status === 'In Progress').length
  const completed = audits.filter((a) => a.status === 'Completed').length

  return (
    <Layout title="Audits">
      {/* Stat Row */}
      <div className="grid grid-cols-4 gap-[10px] mb-6">
        <StatCard label="Total Audits" value={total} stripe="forest" icon="ti-clipboard-list" />
        <StatCard label="Planned" value={planned} stripe="mist" icon="ti-calendar" />
        <StatCard label="In Progress" value={inProgress} stripe="amber" icon="ti-loader" />
        <StatCard label="Completed" value={completed} stripe="sage" icon="ti-circle-check" />
      </div>

      {/* Main Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-charcoal">All Audits</h2>
          <Button variant="primary" icon="ti-plus" onClick={handleOpenCreate}>
            Add Audit
          </Button>
        </div>

        {audits.length === 0 ? (
          <EmptyState
            icon="ti-clipboard-check"
            title="No audits conducted yet"
            description="Create an audit request to log internal or external governance evaluations."
            action={
              <Button variant="primary" icon="ti-plus" onClick={handleOpenCreate}>
                Add Audit
              </Button>
            }
          />
        ) : (
          <Table columns={columns} data={audits} />
        )}
      </div>

      {/* Modal */}
      <Modal
        title={editingAudit ? 'Edit Audit Details' : 'Add Audit'}
        open={modalOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        confirmLabel={editingAudit ? 'Save Changes' : 'Create'}
      >
        <div>
          <label className="input-label">Audit Title *</label>
          <input
            className="input"
            placeholder="e.g. Scope 2 Carbon Audit"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Auditor *</label>
          <input
            className="input"
            placeholder="e.g. PwC ESG Reviewers"
            value={form.auditor}
            onChange={(e) => setForm((f) => ({ ...f, auditor: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Date *</label>
          <input
            type="date"
            className="input"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Status *</label>
          <select
            className="input"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            required
          >
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </Modal>
    </Layout>
  )
}
