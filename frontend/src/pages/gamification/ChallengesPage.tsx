import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { Table, type Column } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { gamificationApi } from '../../api/gamification'
import { platformApi } from '../../api/platform'
import type { Challenge } from '../../types/gamification'

type Difficulty = 'Easy' | 'Medium' | 'Hard'
const difficultyColors: Record<Difficulty, string> = {
  Easy: 'Low',
  Medium: 'Medium',
  Hard: 'High',
}

const tabs = ['All', 'Draft', 'Active', 'Under Review', 'Completed', 'Archived']

export function ChallengesPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
  
  const [form, setForm] = useState({
    title: '',
    category_id: '',
    description: '',
    xp_reward: '',
    difficulty: 'Easy',
    evidence_required: false,
    deadline: '',
    status: 'Draft',
  })

  const { data: challenges = [], isLoading: isChalLoading } = useQuery({
    queryKey: ['gamificationChallenges'],
    queryFn: () => gamificationApi.listChallenges(),
  })

  const { data: categories = [], isLoading: isCatLoading } = useQuery({
    queryKey: ['categories', 'CHALLENGE'],
    queryFn: () => platformApi.listCategories('CHALLENGE'),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Challenge>) => gamificationApi.createChallenge(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamificationChallenges'] })
      handleClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Challenge> }) =>
      gamificationApi.updateChallenge(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamificationChallenges'] })
      handleClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => gamificationApi.deleteChallenge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamificationChallenges'] })
    },
  })

  function handleOpenCreate() {
    setEditingChallenge(null)
    setForm({
      title: '',
      category_id: '',
      description: '',
      xp_reward: '',
      difficulty: 'Easy',
      evidence_required: false,
      deadline: '',
      status: 'Draft',
    })
    setModalOpen(true)
  }

  function handleOpenEdit(chal: Challenge) {
    setEditingChallenge(chal)
    setForm({
      title: chal.title,
      category_id: String(chal.category_id),
      description: chal.description,
      xp_reward: String(chal.xp_reward),
      difficulty: chal.difficulty,
      evidence_required: chal.evidence_required,
      deadline: chal.deadline ? chal.deadline.split('T')[0] : '',
      status: chal.status,
    })
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditingChallenge(null)
    setForm({
      title: '',
      category_id: '',
      description: '',
      xp_reward: '',
      difficulty: 'Easy',
      evidence_required: false,
      deadline: '',
      status: 'Draft',
    })
  }

  function handleConfirm() {
    if (!form.title || !form.category_id || !form.xp_reward) {
      alert('Please fill out all required fields.')
      return
    }

    const payload = {
      title: form.title,
      category_id: Number(form.category_id),
      description: form.description,
      xp_reward: Number(form.xp_reward),
      difficulty: form.difficulty,
      evidence_required: form.evidence_required,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      status: form.status,
    }

    if (editingChallenge) {
      updateMutation.mutate({ id: editingChallenge.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  function handleTransition(id: number, nextStatus: string) {
    updateMutation.mutate({ id, data: { status: nextStatus } })
  }

  const filteredChallenges = challenges.filter((c) => {
    if (activeTab === 'All') return true
    return c.status.toLowerCase() === activeTab.toLowerCase()
  })

  const columns: Column<Challenge>[] = [
    { header: 'Title', accessor: 'title' },
    {
      header: 'Category',
      accessor: 'category_id',
      render: (r) => {
        const cat = categories.find((cat) => cat.id === r.category_id)
        return cat ? cat.name : `Cat: ${r.category_id}`
      },
    },
    {
      header: 'Difficulty',
      accessor: 'difficulty',
      render: (r) => {
        const badgeVal = difficultyColors[r.difficulty as Difficulty] ?? r.difficulty
        return <Badge value={badgeVal} />
      },
    },
    { header: 'XP Reward', accessor: 'xp_reward', numeric: true },
    {
      header: 'Evidence Req.',
      accessor: 'evidence_required',
      render: (r) => (r.evidence_required ? 'Yes' : 'No'),
    },
    {
      header: 'Deadline',
      accessor: 'deadline',
      render: (r) => (r.deadline ? new Date(r.deadline).toLocaleDateString() : '—'),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => (
        <div className="flex flex-col gap-1 items-start">
          <Badge value={r.status} />
          {/* Lifecycle actions */}
          <div className="flex flex-wrap gap-1 mt-1">
            {r.status === 'Draft' && (
              <Button
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation()
                  handleTransition(r.id, 'Active')
                }}
                className="px-1.5 py-[2px] text-[10px] rounded"
              >
                Activate
              </Button>
            )}
            {r.status === 'Active' && (
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  handleTransition(r.id, 'Under Review')
                }}
                className="px-1.5 py-[2px] text-[10px] rounded"
              >
                Send for Review
              </Button>
            )}
            {r.status === 'Under Review' && (
              <>
                <Button
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTransition(r.id, 'Completed')
                  }}
                  className="px-1.5 py-[2px] text-[10px] rounded"
                >
                  Complete
                </Button>
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTransition(r.id, 'Active')
                  }}
                  className="px-1.5 py-[2px] text-[10px] rounded"
                >
                  Reactivate
                </Button>
              </>
            )}
            {r.status !== 'Archived' && (
              <Button
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  handleTransition(r.id, 'Archived')
                }}
                className="px-1.5 py-[2px] text-[10px] rounded"
              >
                Archive
              </Button>
            )}
          </div>
        </div>
      ),
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
              if (confirm('Are you sure you want to delete this challenge?')) {
                deleteMutation.mutate(r.id)
              }
            }}
            className="text-red-600 border-none hover:bg-red-50"
          />
        </div>
      ),
    },
  ]

  const isLoading = isChalLoading || isCatLoading

  if (isLoading) {
    return (
      <Layout title="Challenges">
        <PageSpinner />
      </Layout>
    )
  }

  return (
    <Layout title="Challenges">
      {/* Tabs */}
      <div className="flex border-b border-mist mb-6">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-[12.5px] font-medium border-b-2 -mb-[2px] transition-colors cursor-pointer
              ${
                activeTab === t
                  ? 'border-forest text-forest font-semibold'
                  : 'border-transparent text-sage hover:text-charcoal hover:border-mist'
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-charcoal">Challenges Registry ({activeTab})</h2>
          <Button variant="primary" icon="ti-plus" onClick={handleOpenCreate}>
            Add Challenge
          </Button>
        </div>

        {filteredChallenges.length === 0 ? (
          <EmptyState
            icon="ti-sword"
            title="No challenges found"
            description="Create a quest for employees to complete and earn XP."
            action={
              <Button variant="primary" icon="ti-plus" onClick={handleOpenCreate}>
                Add Challenge
              </Button>
            }
          />
        ) : (
          <Table columns={columns} data={filteredChallenges} />
        )}
      </div>

      {/* Modal */}
      <Modal
        title={editingChallenge ? 'Edit Challenge' : 'Add Challenge'}
        open={modalOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        confirmLabel={editingChallenge ? 'Save Changes' : 'Create'}
      >
        <div>
          <label className="input-label">Title *</label>
          <input
            className="input"
            placeholder="e.g. Carpool for a week"
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
            className="input min-h-[60px] py-2"
            placeholder="Describe what needs to be done..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="input-label">XP Reward *</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 250"
            value={form.xp_reward}
            onChange={(e) => setForm((f) => ({ ...f, xp_reward: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Difficulty *</label>
          <select
            className="input"
            value={form.difficulty}
            onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
            required
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            id="evidence_required"
            checked={form.evidence_required}
            onChange={(e) => setForm((f) => ({ ...f, evidence_required: e.target.checked }))}
            className="w-4 h-4 text-forest border-mist rounded focus:ring-forest"
          />
          <label htmlFor="evidence_required" className="text-[12.5px] text-charcoal font-medium">
            Evidence Required (file upload / proof URL)
          </label>
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

        <div>
          <label className="input-label">Status *</label>
          <select
            className="input"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            required
          >
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Under Review">Under Review</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </Modal>
    </Layout>
  )
}
