import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { Table, type Column } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { governanceApi } from '../../api/governance'
import { authApi } from '../../api/auth'
import type { ESGPolicy } from '../../types/governance'

export function PoliciesPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<ESGPolicy | null>(null)

  // Acknowledgement modals state
  const [ackOpen, setAckOpen] = useState(false)
  const [ackPolicyId, setAckPolicyId] = useState<number | null>(null)
  const [ackEmployeeId, setAckEmployeeId] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    version: '',
    effective_date: '',
    document_url: '',
  })

  const { data: policies = [], isLoading: isPoliciesLoading } = useQuery({
    queryKey: ['governancePolicies'],
    queryFn: () => governanceApi.listPolicies(),
  })

  const { data: employees = [], isLoading: isEmpLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => authApi.listEmployees(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Partial<ESGPolicy>) => governanceApi.createPolicy(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['governancePolicies'] })
      handleClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ESGPolicy> }) =>
      governanceApi.updatePolicy(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['governancePolicies'] })
      handleClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => governanceApi.deletePolicy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['governancePolicies'] })
    },
  })

  const createAckMutation = useMutation({
    mutationFn: (payload: { policy_id: number; employee_id: number }) =>
      governanceApi.createAcknowledgement(payload),
    onSuccess: () => {
      alert('Acknowledgement request sent successfully.')
      setAckOpen(false)
      setAckPolicyId(null)
      setAckEmployeeId('')
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail ?? 'Failed to send acknowledgement request.')
    },
  })

  function handleOpenCreate() {
    setEditingPolicy(null)
    setForm({ title: '', description: '', version: '1.0', effective_date: '', document_url: '' })
    setModalOpen(true)
  }

  function handleOpenEdit(pol: ESGPolicy) {
    setEditingPolicy(pol)
    setForm({
      title: pol.title,
      description: pol.description,
      version: pol.version,
      effective_date: pol.effective_date ? pol.effective_date.split('T')[0] : '',
      document_url: pol.document_url || '',
    })
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditingPolicy(null)
    setForm({ title: '', description: '', version: '', effective_date: '', document_url: '' })
  }

  function handleConfirm() {
    if (!form.title || !form.version || !form.effective_date) {
      alert('Please fill out all required fields.')
      return
    }

    const payload = {
      title: form.title,
      description: form.description,
      version: form.version,
      effective_date: new Date(form.effective_date).toISOString(),
      document_url: form.document_url || null,
    }

    if (editingPolicy) {
      updateMutation.mutate({ id: editingPolicy.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  function handleOpenAck(policyId: number) {
    setAckPolicyId(policyId)
    setAckEmployeeId('')
    setAckOpen(true)
  }

  function handleConfirmAck() {
    if (!ackPolicyId || !ackEmployeeId) {
      alert('Please select an employee.')
      return
    }
    createAckMutation.mutate({ policy_id: ackPolicyId, employee_id: Number(ackEmployeeId) })
  }

  const columns: Column<ESGPolicy>[] = [
    { header: 'Title', accessor: 'title' },
    { header: 'Version', accessor: 'version' },
    {
      header: 'Effective Date',
      accessor: 'effective_date',
      render: (r) => new Date(r.effective_date).toLocaleDateString(),
    },
    {
      header: 'Document URL',
      accessor: 'document_url',
      render: (r) =>
        r.document_url ? (
          <a
            href={r.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest hover:underline font-semibold"
          >
            View Doc
          </a>
        ) : (
          '—'
        ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (r) => (
        <div className="flex gap-1.5 items-center">
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              handleOpenAck(r.id)
            }}
            className="px-2.5 py-[3px] text-[11px]"
          >
            Request Ack
          </Button>
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
              if (confirm('Are you sure you want to delete this policy?')) {
                deleteMutation.mutate(r.id)
              }
            }}
            className="text-red-600 border-none hover:bg-red-50"
          />
        </div>
      ),
    },
  ]

  const isLoading = isPoliciesLoading || isEmpLoading

  if (isLoading) {
    return (
      <Layout title="Policies">
        <PageSpinner />
      </Layout>
    )
  }

  return (
    <Layout title="Policies">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-charcoal">ESG Policies & Compliance</h2>
          <Button variant="primary" icon="ti-plus" onClick={handleOpenCreate}>
            Add Policy
          </Button>
        </div>

        {policies.length === 0 ? (
          <EmptyState
            icon="ti-file-certificate"
            title="No policies created yet"
            description="Add corporate ESG policies and send acknowledgement requests to employees."
            action={
              <Button variant="primary" icon="ti-plus" onClick={handleOpenCreate}>
                Add Policy
              </Button>
            }
          />
        ) : (
          <Table columns={columns} data={policies} />
        )}
      </div>

      {/* Policy Modal */}
      <Modal
        title={editingPolicy ? 'Edit Policy' : 'Add Policy'}
        open={modalOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        confirmLabel={editingPolicy ? 'Save Changes' : 'Create'}
      >
        <div>
          <label className="input-label">Title *</label>
          <input
            className="input"
            placeholder="e.g. Anti-Bribery Policy"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Description</label>
          <textarea
            className="input min-h-[80px] py-2"
            placeholder="Details of the policy scope..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="input-label">Version *</label>
          <input
            className="input"
            placeholder="e.g. 1.0"
            value={form.version}
            onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Effective Date *</label>
          <input
            type="date"
            className="input"
            value={form.effective_date}
            onChange={(e) => setForm((f) => ({ ...f, effective_date: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Document URL</label>
          <input
            className="input"
            placeholder="e.g. https://domain.com/docs/anti-bribery.pdf"
            value={form.document_url}
            onChange={(e) => setForm((f) => ({ ...f, document_url: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Acknowledgement Modal */}
      <Modal
        title="Send Acknowledgement Request"
        open={ackOpen}
        onClose={() => setAckOpen(false)}
        onConfirm={handleConfirmAck}
        confirmLabel="Send"
      >
        <div>
          <label className="input-label">Select Employee *</label>
          <select
            className="input"
            value={ackEmployeeId}
            onChange={(e) => setAckEmployeeId(e.target.value)}
            required
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} (ID: {emp.id})
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </Layout>
  )
}
