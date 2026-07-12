import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { gamificationApi } from '../../api/gamification'
import type { Badge } from '../../types/gamification'

export function BadgesPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: '',
    unlock_rule: '',
  })

  const { data: badges = [], isLoading } = useQuery({
    queryKey: ['gamificationBadges'],
    queryFn: () => gamificationApi.listBadges(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Badge>) => gamificationApi.createBadge(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamificationBadges'] })
      handleClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Badge> }) =>
      gamificationApi.updateBadge(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamificationBadges'] })
      handleClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => gamificationApi.deleteBadge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamificationBadges'] })
    },
  })

  function handleOpenCreate() {
    setEditingBadge(null)
    setForm({ name: '', description: '', icon: '🏅', unlock_rule: '' })
    setModalOpen(true)
  }

  function handleOpenEdit(badge: Badge) {
    setEditingBadge(badge)
    setForm({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      unlock_rule: badge.unlock_rule,
    })
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditingBadge(null)
    setForm({ name: '', description: '', icon: '', unlock_rule: '' })
  }

  function handleConfirm() {
    if (!form.name || !form.icon || !form.unlock_rule) {
      alert('Please fill out all required fields.')
      return
    }

    const payload = {
      name: form.name,
      description: form.description,
      icon: form.icon,
      unlock_rule: form.unlock_rule,
    }

    if (editingBadge) {
      updateMutation.mutate({ id: editingBadge.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  if (isLoading) {
    return (
      <Layout title="Badges">
        <PageSpinner />
      </Layout>
    )
  }

  return (
    <Layout title="Badges">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[16px] font-semibold text-charcoal">Sustainability Badges</h2>
        <Button variant="primary" icon="ti-plus" onClick={handleOpenCreate}>
          Add Badge
        </Button>
      </div>

      {badges.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="ti-medal"
            title="No badges created"
            description="Add achievements that employees can unlock based on their metrics."
            action={
              <Button variant="primary" icon="ti-plus" onClick={handleOpenCreate}>
                Add Badge
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div key={badge.id} className="card flex flex-col items-center justify-between text-center">
              <div className="flex flex-col items-center">
                {/* Large Text Icon */}
                <div className="text-[44px] mb-3 select-none filter drop-shadow">{badge.icon}</div>
                <h3 className="font-semibold text-[14px] text-charcoal mb-1">{badge.name}</h3>
                <p className="text-sage text-[12.5px] max-w-xs mb-3">{badge.description}</p>
                <div className="mt-2">
                  <span className="text-[10px] font-semibold text-sage uppercase tracking-[0.5px] block mb-1">
                    Unlock Criteria
                  </span>
                  <code className="text-[11.5px] font-mono bg-dew text-forest rounded px-2.5 py-1">
                    {badge.unlock_rule}
                  </code>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-3 border-t border-dew w-full justify-center">
                <Button
                  variant="ghost"
                  icon="ti-edit"
                  onClick={() => handleOpenEdit(badge)}
                  className="border-none text-forest hover:bg-dew"
                />
                <Button
                  variant="ghost"
                  icon="ti-trash"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this badge?')) {
                      deleteMutation.mutate(badge.id)
                    }
                  }}
                  className="border-none text-red-600 hover:bg-red-50"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        title={editingBadge ? 'Edit Badge' : 'Add Badge'}
        open={modalOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        confirmLabel={editingBadge ? 'Save Changes' : 'Create'}
      >
        <div>
          <label className="input-label">Badge Name *</label>
          <input
            className="input"
            placeholder="e.g. Green Champion"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Description</label>
          <textarea
            className="input min-h-[60px] py-2"
            placeholder="Describe what this badge represents..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="input-label">Icon (Emoji / Character) *</label>
          <input
            className="input"
            placeholder="e.g. 🌿 or 🏆"
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Unlock Rule (Code Condition) *</label>
          <input
            className="input font-mono text-[11.5px]"
            placeholder="e.g. total_xp >= 500"
            value={form.unlock_rule}
            onChange={(e) => setForm((f) => ({ ...f, unlock_rule: e.target.value }))}
            required
          />
        </div>
      </Modal>
    </Layout>
  )
}
