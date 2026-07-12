import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { StatCard } from '../../components/ui/StatCard'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { governanceApi } from '../../api/governance'
import type { ComplianceIssue } from '../../types/governance'

const severities = ['All', 'Critical', 'High', 'Medium', 'Low']
const statuses = ['All', 'Open', 'Overdue', 'Resolved']

export function ComplianceIssuesPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // Form State
  const [form, setForm] = useState({
    audit_id: '',
    severity: 'Medium',
    description: '',
    owner_id: '',
    due_date: '',
  })

  const { data: issues = [], isLoading: isIssuesLoading } = useQuery({
    queryKey: ['complianceIssues'],
    queryFn: () => governanceApi.listComplianceIssues(),
  })

  const { data: audits = [], isLoading: isAuditsLoading } = useQuery({
    queryKey: ['governanceAudits'],
    queryFn: () => governanceApi.listAudits(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Partial<ComplianceIssue>) => governanceApi.createComplianceIssue(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complianceIssues'] })
      qc.invalidateQueries({ queryKey: ['governanceReport'] })
      setModalOpen(false)
      setForm({ audit_id: '', severity: 'Medium', description: '', owner_id: '', due_date: '' })
    },
  })


  const resolveMutation = useMutation({
    mutationFn: (id: number) => governanceApi.resolveComplianceIssue(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complianceIssues'] })
      qc.invalidateQueries({ queryKey: ['governanceReport'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => governanceApi.deleteComplianceIssue(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complianceIssues'] })
      qc.invalidateQueries({ queryKey: ['governanceReport'] })
    },
  })

  function handleConfirm() {
    if (!form.audit_id || !form.severity || !form.description || !form.owner_id || !form.due_date) {
      alert('Please fill out all fields.')
      return
    }

    const payload = {
      audit_id: Number(form.audit_id),
      severity: form.severity,
      description: form.description,
      owner_id: Number(form.owner_id),
      due_date: new Date(form.due_date).toISOString(),
      status: 'Open',
    }

    createMutation.mutate(payload)
  }

  const isLoading = isIssuesLoading || isAuditsLoading

  if (isLoading) {
    return (
      <Layout title="Compliance Issues">
        <PageSpinner />
      </Layout>
    )
  }

  // Helper to determine if an issue is overdue
  function isOverdue(issue: ComplianceIssue) {
    if (issue.status.toLowerCase() === 'resolved') return false
    if (issue.status.toLowerCase() === 'overdue') return true
    return new Date(issue.due_date) < new Date()
  }

  // Computations for Stat Cards
  const totalCount = issues.length
  const openCount = issues.filter((i) => i.status.toLowerCase() === 'open' && !isOverdue(i)).length
  const overdueCount = issues.filter((i) => i.status.toLowerCase() === 'overdue' || isOverdue(i)).length
  const resolvedCount = issues.filter((i) => i.status.toLowerCase() === 'resolved').length

  // Filter computation
  const filteredIssues = issues.filter((i) => {
    // Severity Filter
    if (severityFilter !== 'All' && i.severity.toLowerCase() !== severityFilter.toLowerCase()) {
      return false
    }

    // Status Filter
    if (statusFilter !== 'All') {
      const lowerStatus = statusFilter.toLowerCase()
      if (lowerStatus === 'overdue') {
        return isOverdue(i)
      } else if (lowerStatus === 'open') {
        return i.status.toLowerCase() === 'open' && !isOverdue(i)
      } else {
        return i.status.toLowerCase() === lowerStatus
      }
    }

    return true
  })

  return (
    <Layout title="Compliance Issues">
      {/* Stat Row */}
      <div className="grid grid-cols-4 gap-[10px] mb-6">
        <StatCard label="Total Issues" value={totalCount} stripe="forest" icon="ti-alert-octagon" />
        <StatCard label="Open" value={openCount} stripe="amber" icon="ti-folder-open" />
        <StatCard label="Overdue" value={overdueCount} stripe="red" icon="ti-clock-exclamation" />
        <StatCard label="Resolved" value={resolvedCount} stripe="sage" icon="ti-checkbox" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-mist rounded-lg p-3.5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-semibold text-charcoal uppercase tracking-[0.5px]">Severity:</span>
            <select
              className="px-2.5 py-[5px] border border-mist rounded text-[12.5px] text-charcoal bg-white focus:outline-none"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              {severities.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-semibold text-charcoal uppercase tracking-[0.5px]">Status:</span>
            <select
              className="px-2.5 py-[5px] border border-mist rounded text-[12.5px] text-charcoal bg-white focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button variant="primary" icon="ti-plus" onClick={() => setModalOpen(true)}>
          Add Issue
        </Button>
      </div>

      {/* Table Card */}
      <div className="card">
        {filteredIssues.length === 0 ? (
          <EmptyState
            icon="ti-alert-triangle"
            title="No compliance issues found"
            description="Log an issue under a governance audit to track its resolution."
            action={
              <Button variant="primary" icon="ti-plus" onClick={() => setModalOpen(true)}>
                Add Issue
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.6px] text-sage px-3 pb-2.5 border-b border-mist">
                    Description
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.6px] text-sage px-3 pb-2.5 border-b border-mist">
                    Severity
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.6px] text-sage px-3 pb-2.5 border-b border-mist">
                    Owner ID
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.6px] text-sage px-3 pb-2.5 border-b border-mist">
                    Due Date
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.6px] text-sage px-3 pb-2.5 border-b border-mist">
                    Status
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.6px] text-sage px-3 pb-2.5 border-b border-mist">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((row) => {
                  const desc = row.description.length > 60 ? `${row.description.substring(0, 60)}...` : row.description
                  const isRowOverdue = isOverdue(row)
                  const displayStatus = isRowOverdue ? 'Overdue' : row.status

                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-dew transition-colors
                        ${isRowOverdue ? 'bg-red-50 hover:bg-red-100/70' : 'hover:bg-dew'}`}
                    >
                      <td className="px-3 py-3 font-medium text-charcoal">
                        {desc}
                      </td>
                      <td className="px-3 py-3 text-[#3d5248]">
                        <Badge value={row.severity} />
                      </td>
                      <td className="px-3 py-3 text-[#3d5248] font-mono">
                        {row.owner_id}
                      </td>
                      <td className="px-3 py-3 text-[#3d5248]">
                        {new Date(row.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3 text-[#3d5248]">
                        <Badge value={displayStatus} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1.5 items-center">
                          {row.status.toLowerCase() !== 'resolved' && (
                            <Button
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                resolveMutation.mutate(row.id)
                              }}
                              className="px-2.5 py-[3px] text-[11px]"
                            >
                              Resolve
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            icon="ti-trash"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('Are you sure you want to delete this issue?')) {
                                deleteMutation.mutate(row.id)
                              }
                            }}
                            className="text-red-600 border-none hover:bg-red-50/50"
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        title="Add Compliance Issue"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        confirmLabel="Create"
      >
        <div>
          <label className="input-label">Audit *</label>
          <select
            className="input"
            value={form.audit_id}
            onChange={(e) => setForm((f) => ({ ...f, audit_id: e.target.value }))}
            required
          >
            <option value="">Select Audit</option>
            {audits.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} ({a.auditor})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Severity *</label>
          <select
            className="input"
            value={form.severity}
            onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
            required
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="input-label">Description *</label>
          <textarea
            className="input min-h-[80px] py-2"
            placeholder="Details about the governance violation..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Owner Employee ID *</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 1"
            value={form.owner_id}
            onChange={(e) => setForm((f) => ({ ...f, owner_id: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Due Date *</label>
          <input
            type="date"
            className="input"
            value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            required
          />
        </div>
      </Modal>
    </Layout>
  )
}
