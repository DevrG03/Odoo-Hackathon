import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { Table, type Column } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { environmentalApi } from '../../api/environmental'
import type { EmissionFactor } from '../../types/environmental'

export function EmissionFactorsPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingFactor, setEditingFactor] = useState<EmissionFactor | null>(null)
  const [form, setForm] = useState({
    name: '',
    unit: '',
    value: '',
  })

  const { data: factors = [], isLoading } = useQuery({
    queryKey: ['emissionFactors'],
    queryFn: () => environmentalApi.listFactors(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Partial<EmissionFactor>) => environmentalApi.createFactor(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emissionFactors'] })
      handleClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EmissionFactor> }) =>
      environmentalApi.updateFactor(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emissionFactors'] })
      handleClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => environmentalApi.deleteFactor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emissionFactors'] })
    },
  })

  function handleOpenCreate() {
    setEditingFactor(null)
    setForm({ name: '', unit: '', value: '' })
    setModalOpen(true)
  }

  function handleOpenEdit(factor: EmissionFactor) {
    setEditingFactor(factor)
    setForm({
      name: factor.name,
      unit: factor.unit,
      value: String(factor.value),
    })
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditingFactor(null)
    setForm({ name: '', unit: '', value: '' })
  }

  function handleConfirm() {
    if (!form.name || !form.unit || !form.value) {
      alert('Please fill out all fields.')
      return
    }
    const payload = {
      name: form.name,
      unit: form.unit,
      value: Number(form.value),
    }

    if (editingFactor) {
      updateMutation.mutate({ id: editingFactor.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const columns: Column<EmissionFactor>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Unit', accessor: 'unit' },
    {
      header: 'Value',
      accessor: 'value',
      numeric: true,
      render: (r) => r.value.toFixed(4),
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
              if (confirm('Are you sure you want to delete this emission factor?')) {
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
      <Layout title="Emission Factors">
        <PageSpinner />
      </Layout>
    )
  }

  return (
    <Layout title="Emission Factors">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-charcoal">Emission Factors Library</h2>
          <Button variant="primary" icon="ti-plus" onClick={handleOpenCreate}>
            Add Factor
          </Button>
        </div>

        {factors.length === 0 ? (
          <EmptyState
            icon="ti-calculator"
            title="No emission factors yet"
            description="Create an emission factor to start calculating carbon equivalents."
            action={
              <Button variant="primary" icon="ti-plus" onClick={handleOpenCreate}>
                Add Factor
              </Button>
            }
          />
        ) : (
          <Table columns={columns} data={factors} />
        )}
      </div>

      <Modal
        title={editingFactor ? 'Edit Emission Factor' : 'Add Emission Factor'}
        open={modalOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        confirmLabel={editingFactor ? 'Save Changes' : 'Create'}
      >
        <div>
          <label className="input-label">Factor Name *</label>
          <input
            className="input"
            placeholder="e.g. Electricity Grid Factor"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Unit *</label>
          <input
            className="input"
            placeholder="e.g. kgCO2e/kWh"
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Value *</label>
          <input
            type="number"
            step="0.0001"
            className="input"
            placeholder="e.g. 0.4521"
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            required
          />
        </div>
      </Modal>
    </Layout>
  )
}
