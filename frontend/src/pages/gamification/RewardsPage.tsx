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
import { gamificationApi } from '../../api/gamification'
import { authApi } from '../../api/auth'
import type { Reward } from '../../types/gamification'

export function RewardsPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  
  // Redeem states
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [redeemRewardId, setRedeemRewardId] = useState<number | null>(null)
  const [redeemEmployeeId, setRedeemEmployeeId] = useState('')
  const [redeemSuccessMsg, setRedeemSuccessMsg] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    points_required: '',
    stock: '',
  })

  const { data: rewards = [], isLoading: isRewardsLoading } = useQuery({
    queryKey: ['gamificationRewards'],
    queryFn: () => gamificationApi.listRewards(),
  })

  const { data: employees = [], isLoading: isEmpLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => authApi.listEmployees(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Reward>) => gamificationApi.createReward(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamificationRewards'] })
      handleClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Reward> }) =>
      gamificationApi.updateReward(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamificationRewards'] })
      handleClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => gamificationApi.deleteReward(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamificationRewards'] })
    },
  })

  const redeemMutation = useMutation({
    mutationFn: ({ rewardId, employeeId }: { rewardId: number; employeeId: number }) =>
      gamificationApi.redeemReward(rewardId, employeeId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['gamificationRewards'] })
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['leaderboard'] })

      const reward = rewards.find(r => r.id === variables.rewardId)
      setRedeemSuccessMsg(`Reward redeemed. ${reward?.points_required ?? 0} points deducted.`)
      setRedeemOpen(false)
      setRedeemRewardId(null)
      setRedeemEmployeeId('')
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail ?? 'Failed to redeem reward. Check employee balance.')
    },
  })

  function handleOpenCreate() {
    setEditingReward(null)
    setForm({ name: '', description: '', points_required: '', stock: '' })
    setModalOpen(true)
  }

  function handleOpenEdit(rew: Reward) {
    setEditingReward(rew)
    setForm({
      name: rew.name,
      description: rew.description,
      points_required: String(rew.points_required),
      stock: String(rew.stock),
    })
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditingReward(null)
    setForm({ name: '', description: '', points_required: '', stock: '' })
  }

  function handleConfirm() {
    if (!form.name || !form.points_required || !form.stock) {
      alert('Please fill out all required fields.')
      return
    }

    const payload = {
      name: form.name,
      description: form.description,
      points_required: Number(form.points_required),
      stock: Number(form.stock),
      status: Number(form.stock) > 0 ? 'Available' : 'Out of Stock',
    }

    if (editingReward) {
      updateMutation.mutate({ id: editingReward.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  function handleOpenRedeem(rewardId: number) {
    setRedeemRewardId(rewardId)
    setRedeemEmployeeId('')
    setRedeemOpen(true)
  }

  function handleConfirmRedeem() {
    if (!redeemRewardId || !redeemEmployeeId) {
      alert('Please select an employee.')
      return
    }
    redeemMutation.mutate({ rewardId: redeemRewardId, employeeId: Number(redeemEmployeeId) })
  }

  const isLoading = isRewardsLoading || isEmpLoading

  if (isLoading) {
    return (
      <Layout title="Rewards">
        <PageSpinner />
      </Layout>
    )
  }

  const totalRewards = rewards.length
  const availableRewards = rewards.filter((r) => r.stock > 0).length
  const outOfStockRewards = rewards.filter((r) => r.stock === 0).length

  const columns: Column<Reward>[] = [
    { header: 'Name', accessor: 'name' },
    {
      header: 'Description',
      accessor: 'description',
      render: (r) =>
        r.description.length > 50 ? `${r.description.substring(0, 50)}...` : r.description,
    },
    { header: 'Points Required', accessor: 'points_required', numeric: true },
    { header: 'Stock', accessor: 'stock', numeric: true },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => <Badge value={r.stock > 0 ? 'Available' : 'Out of Stock'} />,
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (r) => (
        <div className="flex gap-1.5 items-center">
          {r.stock > 0 && (
            <Button
              variant="primary"
              onClick={(e) => {
                e.stopPropagation()
                handleOpenRedeem(r.id)
              }}
              className="px-2.5 py-[3px] text-[11px]"
            >
              Redeem
            </Button>
          )}
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
              if (confirm('Are you sure you want to delete this reward?')) {
                deleteMutation.mutate(r.id)
              }
            }}
            className="text-red-600 border-none hover:bg-red-50"
          />
        </div>
      ),
    },
  ]

  return (
    <Layout title="Rewards">
      {/* Stat Row */}
      <div className="grid grid-cols-3 gap-[10px] mb-6">
        <StatCard label="Total Rewards" value={totalRewards} stripe="forest" icon="ti-gift" />
        <StatCard label="Available" value={availableRewards} stripe="sage" icon="ti-package" />
        <StatCard
          label="Out of Stock"
          value={outOfStockRewards}
          stripe="red"
          icon="ti-package-off"
        />
      </div>

      {/* Success Banner */}
      {redeemSuccessMsg && (
        <div className="bg-green-100 border border-green-200 rounded-lg p-3.5 mb-6 text-green-800 text-[12px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ti ti-circle-check text-green-700 text-base" aria-hidden="true" />
            <span>{redeemSuccessMsg}</span>
          </div>
          <button
            onClick={() => setRedeemSuccessMsg('')}
            className="text-green-800 font-semibold hover:underline text-[12px] bg-transparent border-none cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-charcoal">Points Shop Rewards</h2>
          <Button variant="primary" icon="ti-plus" onClick={handleOpenCreate}>
            Add Reward
          </Button>
        </div>

        {rewards.length === 0 ? (
          <EmptyState
            icon="ti-gift"
            title="No rewards added yet"
            description="Offer physical or digital vouchers that employees can purchase with points."
            action={
              <Button variant="primary" icon="ti-plus" onClick={handleOpenCreate}>
                Add Reward
              </Button>
            }
          />
        ) : (
          <Table columns={columns} data={rewards} />
        )}
      </div>

      {/* Modal - Create / Edit */}
      <Modal
        title={editingReward ? 'Edit Reward' : 'Add Reward'}
        open={modalOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        confirmLabel={editingReward ? 'Save Changes' : 'Create'}
      >
        <div>
          <label className="input-label">Reward Name *</label>
          <input
            className="input"
            placeholder="e.g. Tree Planting Certificate"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Description</label>
          <textarea
            className="input min-h-[60px] py-2"
            placeholder="Describe what the reward is..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="input-label">Points Required *</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 500"
            value={form.points_required}
            onChange={(e) => setForm((f) => ({ ...f, points_required: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Stock *</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 20"
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            required
          />
        </div>
      </Modal>

      {/* Modal - Redeem */}
      <Modal
        title="Redeem Reward"
        open={redeemOpen}
        onClose={() => setRedeemOpen(false)}
        onConfirm={handleConfirmRedeem}
        confirmLabel="Redeem"
      >
        <div>
          <label className="input-label">Select Employee *</label>
          <select
            className="input"
            value={redeemEmployeeId}
            onChange={(e) => setRedeemEmployeeId(e.target.value)}
            required
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} (Pts: {emp.total_points})
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </Layout>
  )
}
