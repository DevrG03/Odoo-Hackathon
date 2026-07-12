import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { StatCard } from '../../components/ui/StatCard'
import { Table, type Column } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { environmentalApi } from '../../api/environmental'
import { platformApi } from '../../api/platform'
import type { CarbonTransaction } from '../../types/environmental'

export function CarbonTransactionsPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    department_id: '',
    source: '',
    value: '',
    emission_factor_id: '',
    date: '',
  })

  const { data: transactions = [], isLoading: isTxLoading } = useQuery({
    queryKey: ['carbonTransactions'],
    queryFn: () => environmentalApi.listTransactions(),
  })

  const { data: factors = [], isLoading: isFactorsLoading } = useQuery({
    queryKey: ['emissionFactors'],
    queryFn: () => environmentalApi.listFactors(),
  })

  const { data: departments = [], isLoading: isDepsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => platformApi.listDepartments(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: any) => environmentalApi.createTransaction(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carbonTransactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['scores'] })
      setModalOpen(false)
      setForm({
        department_id: '',
        source: '',
        value: '',
        emission_factor_id: '',
        date: '',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => environmentalApi.deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carbonTransactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['scores'] })
    },
  })

  const isLoading = isTxLoading || isFactorsLoading || isDepsLoading

  if (isLoading) {
    return (
      <Layout title="Carbon Transactions">
        <PageSpinner />
      </Layout>
    )
  }

  const totalTransactions = transactions.length
  const totalEmissions = transactions.reduce((acc, curr) => acc + curr.calculated_emissions, 0)

  const columns: Column<CarbonTransaction>[] = [
    { header: 'Source', accessor: 'source' },
    { header: 'Department ID', accessor: 'department_id', numeric: true },
    { header: 'Value', accessor: 'value', numeric: true },
    {
      header: 'Emission Factor',
      accessor: 'emission_factor_id',
      render: (r) => {
        const factor = factors.find(f => f.id === r.emission_factor_id)
        return factor ? `${factor.name} (${factor.unit})` : '—'
      },
    },
    {
      header: 'Calculated Emissions',
      accessor: 'calculated_emissions',
      numeric: true,
      render: (r) => `${r.calculated_emissions.toFixed(4)} kgCO₂e`,
    },
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
            if (confirm('Are you sure you want to delete this transaction?')) {
              deleteMutation.mutate(r.id)
            }
          }}
          className="text-red-600 border-none hover:bg-red-50"
        />
      ),
    },
  ]

  function handleConfirm() {
    if (!form.department_id || !form.source || !form.value) {
      alert('Please fill out all required fields.')
      return
    }
    const payload = {
      department_id: Number(form.department_id),
      source: form.source,
      value: Number(form.value),
      emission_factor_id: form.emission_factor_id ? Number(form.emission_factor_id) : null,
      date: form.date ? new Date(form.date).toISOString() : undefined,
    }
    createMutation.mutate(payload)
  }

  return (
    <Layout title="Carbon Transactions">
      {/* Stat row */}
      <div className="grid grid-cols-2 gap-[10px] mb-6">
        <StatCard
          label="Total Transactions"
          value={totalTransactions}
          stripe="forest"
          icon="ti-list-check"
        />
        <StatCard
          label="Total Emissions"
          value={`${totalEmissions.toFixed(2)} kgCO₂e`}
          stripe="sage"
          icon="ti-cloud-fog"
        />
      </div>

      {/* Info Banner */}
      <div className="bg-dew border border-mist rounded-lg p-3.5 mb-6 text-charcoal text-[12px] flex items-center gap-2">
        <i className="ti ti-info-circle text-forest text-base" aria-hidden="true" />
        <span>Auto-calculation is enabled — emissions are computed automatically when an emission factor is selected.</span>
      </div>

      {/* Main card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-charcoal">All Transactions</h2>
          <Button variant="primary" icon="ti-plus" onClick={() => setModalOpen(true)}>
            Add Transaction
          </Button>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            icon="ti-inbox"
            title="No transactions found"
            description="Add a carbon transaction to start tracking department emissions."
            action={
              <Button variant="primary" icon="ti-plus" onClick={() => setModalOpen(true)}>
                Add Transaction
              </Button>
            }
          />
        ) : (
          <Table columns={columns} data={transactions} />
        )}
      </div>

      {/* Modal */}
      <Modal
        title="Add Carbon Transaction"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        confirmLabel="Create"
      >
        <div>
          <label className="input-label">Department *</label>
          <select
            className="input"
            value={form.department_id}
            onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
            required
          >
            <option value="">Select a Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Source *</label>
          <input
            className="input"
            placeholder="e.g. Office Electricity, Business Travel"
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Value *</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 150.5"
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Emission Factor</label>
          <select
            className="input"
            value={form.emission_factor_id}
            onChange={(e) => setForm((f) => ({ ...f, emission_factor_id: e.target.value }))}
          >
            <option value="">None (Custom / Uncalculated)</option>
            {factors.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name} ({fac.value} {fac.unit})
              </option>
            ))}
          </select>
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
