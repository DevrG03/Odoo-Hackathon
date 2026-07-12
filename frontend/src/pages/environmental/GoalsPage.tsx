import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { environmentalApi } from '../../api/environmental'
import { platformApi } from '../../api/platform'
import type { EnvironmentalGoal } from '../../types/environmental'

export function GoalsPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<EnvironmentalGoal | null>(null)
  const [form, setForm] = useState({
    title: '',
    department_id: '',
    target_value: '',
    current_value: '',
    deadline: '',
  })

  const { data: goals = [], isLoading: isGoalsLoading } = useQuery({
    queryKey: ['environmentalGoals'],
    queryFn: () => environmentalApi.listGoals(),
  })

  const { data: departments = [], isLoading: isDepsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => platformApi.listDepartments(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Partial<EnvironmentalGoal>) => environmentalApi.createGoal(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['environmentalGoals'] })
      handleClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EnvironmentalGoal> }) =>
      environmentalApi.updateGoal(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['environmentalGoals'] })
      handleClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => environmentalApi.deleteGoal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['environmentalGoals'] })
    },
  })

  function handleOpenCreate() {
    setEditingGoal(null)
    setForm({
      title: '',
      department_id: '',
      target_value: '',
      current_value: '',
      deadline: '',
    })
    setModalOpen(true)
  }

  function handleOpenEdit(goal: EnvironmentalGoal) {
    setEditingGoal(goal)
    setForm({
      title: goal.title,
      department_id: goal.department_id ? String(goal.department_id) : '',
      target_value: String(goal.target_value),
      current_value: String(goal.current_value),
      deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
    })
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditingGoal(null)
    setForm({
      title: '',
      department_id: '',
      target_value: '',
      current_value: '',
      deadline: '',
    })
  }

  function handleConfirm() {
    if (!form.title || !form.target_value || !form.current_value) {
      alert('Please fill out all required fields.')
      return
    }

    const payload = {
      title: form.title,
      department_id: form.department_id ? Number(form.department_id) : null,
      target_value: Number(form.target_value),
      current_value: Number(form.current_value),
      deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
    } as Partial<EnvironmentalGoal>

    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isLoading = isGoalsLoading || isDepsLoading

  if (isLoading) {
    return (
      <Layout title="Goals">
        <PageSpinner />
      </Layout>
    )
  }

  return (
    <Layout title="Goals">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[16px] font-semibold text-charcoal">Environmental Goals</h2>
        <Button variant="primary" icon="ti-plus" onClick={handleOpenCreate}>
          Add Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="ti-target"
            title="No goals set yet"
            description="Establish environmental goals for your departments to aim for."
            action={
              <Button variant="primary" icon="ti-plus" onClick={handleOpenCreate}>
                Add Goal
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const pct = goal.target_value ? Math.min(100, Math.max(0, (goal.current_value / goal.target_value) * 100)) : 0
            const deptName = departments.find(d => d.id === goal.department_id)?.name ?? `Dept ID: ${goal.department_id ?? 'Global'}`
            
            return (
              <div key={goal.id} className="card flex flex-col justify-between h-full min-h-[160px]">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-medium text-[13.5px] text-charcoal leading-snug">{goal.title}</h3>
                    <span className="text-[10px] bg-dew text-forest font-semibold px-2 py-0.5 rounded-full uppercase">
                      {deptName}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] text-sage mb-1 font-medium">
                      <span>Progress</span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                    {/* Progress track */}
                    <div className="w-full h-2 bg-mist rounded-full overflow-hidden">
                      <div className="h-full bg-forest transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[11px] text-charcoal mt-1.5 font-semibold">
                      {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5 pt-3 border-t border-dew">
                  <span className="text-[11px] text-sage flex items-center gap-1">
                    <i className="ti ti-calendar-event text-[13px]" />
                    {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      icon="ti-edit"
                      onClick={() => handleOpenEdit(goal)}
                      className="border-none text-forest hover:bg-dew"
                    />
                    <Button
                      variant="ghost"
                      icon="ti-trash"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this goal?')) {
                          deleteMutation.mutate(goal.id)
                        }
                      }}
                      className="border-none text-red-600 hover:bg-red-50"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        title={editingGoal ? 'Edit Goal' : 'Add Goal'}
        open={modalOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        confirmLabel={editingGoal ? 'Save Changes' : 'Create'}
      >
        <div>
          <label className="input-label">Goal Title *</label>
          <input
            className="input"
            placeholder="e.g. Reduce scope 1 emissions"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Department</label>
          <select
            className="input"
            value={form.department_id}
            onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
          >
            <option value="">Global / No Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Target Value *</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 10000"
            value={form.target_value}
            onChange={(e) => setForm((f) => ({ ...f, target_value: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Current Value *</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 1200"
            value={form.current_value}
            onChange={(e) => setForm((f) => ({ ...f, current_value: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Deadline</label>
          <input
            type="date"
            className="input"
            value={form.deadline}
            onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
          />
        </div>
      </Modal>
    </Layout>
  )
}
