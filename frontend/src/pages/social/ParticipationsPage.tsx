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
import { socialApi } from '../../api/social'
import type { EmployeeParticipation } from '../../types/social'

export function ParticipationsPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')
  const [form, setForm] = useState({
    employee_id: '',
    activity_id: '',
    proof_url: '',
  })

  const { data: participations = [], isLoading } = useQuery({
    queryKey: ['socialParticipations'],
    queryFn: () => socialApi.listParticipations(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: { employee_id: number; activity_id: number; proof_url?: string }) =>
      socialApi.createParticipation(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['socialParticipations'] })
      qc.invalidateQueries({ queryKey: ['socialReport'] })
      setModalOpen(false)
      setForm({ employee_id: '', activity_id: '', proof_url: '' })
    },
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'Approved' | 'Rejected' }) =>
      socialApi.approveParticipation(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['socialParticipations'] })
      qc.invalidateQueries({ queryKey: ['socialReport'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })

  if (isLoading) {
    return (
      <Layout title="CSR Participations">
        <PageSpinner />
      </Layout>
    )
  }

  const total = participations.length
  const pending = participations.filter((p) => p.approval_status === 'Pending').length
  const approved = participations.filter((p) => p.approval_status === 'Approved').length
  const pointsAwarded = participations
    .filter((p) => p.approval_status === 'Approved')
    .reduce((acc, curr) => acc + curr.points_earned, 0)

  const filteredParticipations = participations.filter((p) => {
    if (statusFilter === 'All') return true
    return p.approval_status.toLowerCase() === statusFilter.toLowerCase()
  })

  const columns: Column<EmployeeParticipation>[] = [
    { header: 'Employee ID', accessor: 'employee_id', numeric: true },
    { header: 'Activity ID', accessor: 'activity_id', numeric: true },
    {
      header: 'Proof',
      accessor: 'proof_url',
      render: (r) =>
        r.proof_url ? (
          <a
            href={r.proof_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest hover:underline font-semibold"
          >
            View
          </a>
        ) : (
          '—'
        ),
    },
    {
      header: 'Status',
      accessor: 'approval_status',
      render: (r) => <Badge value={r.approval_status} />,
    },
    { header: 'Points Earned', accessor: 'points_earned', numeric: true },
    {
      header: 'Date',
      accessor: 'completion_date',
      render: (r) => new Date(r.completion_date).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (r) => {
        if (r.approval_status === 'Pending') {
          return (
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation()
                  approveMutation.mutate({ id: r.id, status: 'Approved' })
                }}
                className="px-2.5 py-[3px] text-[11px]"
              >
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation()
                  approveMutation.mutate({ id: r.id, status: 'Rejected' })
                }}
                className="px-2.5 py-[3px] text-[11px]"
              >
                Reject
              </Button>
            </div>
          )
        }
        return '—'
      },
    },
  ]

  function handleConfirm() {
    if (!form.employee_id || !form.activity_id) {
      alert('Please fill out all required fields.')
      return
    }
    const payload = {
      employee_id: Number(form.employee_id),
      activity_id: Number(form.activity_id),
      proof_url: form.proof_url || undefined,
    }
    createMutation.mutate(payload)
  }

  return (
    <Layout title="CSR Participations">
      {/* Stat Row */}
      <div className="grid grid-cols-4 gap-[10px] mb-6">
        <StatCard label="Total" value={total} stripe="forest" icon="ti-clipboard" />
        <StatCard label="Pending" value={pending} stripe="amber" icon="ti-hourglass" />
        <StatCard label="Approved" value={approved} stripe="sage" icon="ti-circle-check" />
        <StatCard label="Points Awarded" value={pointsAwarded} stripe="mist" icon="ti-gift" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-mist rounded-lg p-3.5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[11.5px] font-semibold text-charcoal uppercase tracking-[0.5px]">Filter Status:</span>
          <select
            className="px-2.5 py-[5px] border border-mist rounded text-[12.5px] text-charcoal bg-white focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <Button variant="primary" icon="ti-plus" onClick={() => setModalOpen(true)}>
          Add Participation
        </Button>
      </div>

      {/* Table Card */}
      <div className="card">
        {filteredParticipations.length === 0 ? (
          <EmptyState
            icon="ti-inbox"
            title="No participations found"
            description="Log an employee participation to check progress."
            action={
              <Button variant="primary" icon="ti-plus" onClick={() => setModalOpen(true)}>
                Add Participation
              </Button>
            }
          />
        ) : (
          <Table columns={columns} data={filteredParticipations} />
        )}
      </div>

      {/* Modal */}
      <Modal
        title="Add Participation"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        confirmLabel="Create"
      >
        <div>
          <label className="input-label">Employee ID *</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 1"
            value={form.employee_id}
            onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Activity ID *</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 2"
            value={form.activity_id}
            onChange={(e) => setForm((f) => ({ ...f, activity_id: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Proof URL</label>
          <input
            className="input"
            placeholder="e.g. https://images.com/tree-plantation-proof.jpg"
            value={form.proof_url}
            onChange={(e) => setForm((f) => ({ ...f, proof_url: e.target.value }))}
          />
        </div>
      </Modal>
    </Layout>
  )
}
