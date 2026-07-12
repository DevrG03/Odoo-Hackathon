import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/ui/Button'
import { Table, type Column } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { platformApi } from '../../api/platform'
import type { Department, Category, ESGConfig } from '../../types/platform'

export function SettingsPage() {
  const qc = useQueryClient()

  // Modals Open/Close
  const [depModalOpen, setDepModalOpen] = useState(false)
  const [catModalOpen, setCatModalOpen] = useState(false)

  // Edit trackers
  const [editingDep, setEditingDep] = useState<Department | null>(null)
  const [editingCat, setEditingCat] = useState<Category | null>(null)

  // Form states
  const [depForm, setDepForm] = useState({
    name: '',
    code: '',
    head_id: '',
    parent_department_id: '',
    employee_count: '0',
    status: 'active',
  })

  const [catForm, setCatForm] = useState({
    name: '',
    type: 'CSR_ACTIVITY',
    status: 'active',
  })

  // Queries
  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ['platformConfig'],
    queryFn: () => platformApi.getConfig(),
  })

  const { data: departments = [], isLoading: isDepsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => platformApi.listDepartments(),
  })

  const { data: categories = [], isLoading: isCatsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => platformApi.listCategories(),
  })

  // Config Mutation
  const updateConfigMutation = useMutation({
    mutationFn: (data: Partial<ESGConfig>) => platformApi.updateConfig(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platformConfig'] })
    },
  })

  // Department Mutations
  const createDepMutation = useMutation({
    mutationFn: (data: Partial<Department>) => platformApi.createDepartment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] })
      handleCloseDep()
    },
  })

  const updateDepMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Department> }) =>
      platformApi.updateDepartment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] })
      handleCloseDep()
    },
  })

  const deleteDepMutation = useMutation({
    mutationFn: (id: number) => platformApi.deleteDepartment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] })
      qc.invalidateQueries({ queryKey: ['scores'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  // Category Mutations
  const createCatMutation = useMutation({
    mutationFn: (data: Partial<Category>) => platformApi.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      handleCloseCat()
    },
  })

  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) =>
      platformApi.updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      handleCloseCat()
    },
  })

  const deleteCatMutation = useMutation({
    mutationFn: (id: number) => platformApi.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  // Modal Handlers
  function handleOpenCreateDep() {
    setEditingDep(null)
    setDepForm({ name: '', code: '', head_id: '', parent_department_id: '', employee_count: '0', status: 'active' })
    setDepModalOpen(true)
  }

  function handleOpenEditDep(dep: Department) {
    setEditingDep(dep)
    setDepForm({
      name: dep.name,
      code: dep.code,
      head_id: dep.head_id ? String(dep.head_id) : '',
      parent_department_id: dep.parent_department_id ? String(dep.parent_department_id) : '',
      employee_count: String(dep.employee_count),
      status: dep.status,
    })
    setDepModalOpen(true)
  }

  function handleCloseDep() {
    setDepModalOpen(false)
    setEditingDep(null)
    setDepForm({ name: '', code: '', head_id: '', parent_department_id: '', employee_count: '0', status: 'active' })
  }

  function handleConfirmDep() {
    if (!depForm.name || !depForm.code) {
      alert('Please fill out required fields.')
      return
    }
    const payload = {
      name: depForm.name,
      code: depForm.code,
      head_id: depForm.head_id ? Number(depForm.head_id) : null,
      parent_department_id: depForm.parent_department_id ? Number(depForm.parent_department_id) : null,
      employee_count: Number(depForm.employee_count),
      status: depForm.status,
    }

    if (editingDep) {
      updateDepMutation.mutate({ id: editingDep.id, data: payload })
    } else {
      createDepMutation.mutate(payload)
    }
  }

  function handleOpenCreateCat() {
    setEditingCat(null)
    setCatForm({ name: '', type: 'CSR_ACTIVITY', status: 'active' })
    setCatModalOpen(true)
  }

  function handleOpenEditCat(cat: Category) {
    setEditingCat(cat)
    setCatForm({
      name: cat.name,
      type: cat.type,
      status: cat.status,
    })
    setCatModalOpen(true)
  }

  function handleCloseCat() {
    setCatModalOpen(false)
    setEditingCat(null)
    setCatForm({ name: '', type: 'CSR_ACTIVITY', status: 'active' })
  }

  function handleConfirmCat() {
    if (!catForm.name || !catForm.type) {
      alert('Please fill out required fields.')
      return
    }
    const payload = {
      name: catForm.name,
      type: catForm.type,
      status: catForm.status,
    }

    if (editingCat) {
      updateCatMutation.mutate({ id: editingCat.id, data: payload })
    } else {
      createCatMutation.mutate(payload)
    }
  }

  const isLoading = isConfigLoading || isDepsLoading || isCatsLoading

  if (isLoading) {
    return (
      <Layout title="Settings">
        <PageSpinner />
      </Layout>
    )
  }

  const depColumns: Column<Department>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Code', accessor: 'code' },
    { header: 'Head ID', accessor: 'head_id', numeric: true, render: (r) => r.head_id ?? '—' },
    { header: 'Employees', accessor: 'employee_count', numeric: true },
    { header: 'Status', accessor: 'status', render: (r) => <Badge value={r.status} /> },
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
              handleOpenEditDep(r)
            }}
            className="text-forest border-none hover:bg-dew"
          />
          <Button
            variant="ghost"
            icon="ti-trash"
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Are you sure you want to delete this department?')) {
                deleteDepMutation.mutate(r.id)
              }
            }}
            className="text-red-600 border-none hover:bg-red-50"
          />
        </div>
      ),
    },
  ]

  const catColumns: Column<Category>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Type', accessor: 'type', render: (r) => <Badge value={r.type} /> },
    { header: 'Status', accessor: 'status', render: (r) => <Badge value={r.status} /> },
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
              handleOpenEditCat(r)
            }}
            className="text-forest border-none hover:bg-dew"
          />
          <Button
            variant="ghost"
            icon="ti-trash"
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Are you sure you want to delete this category?')) {
                deleteCatMutation.mutate(r.id)
              }
            }}
            className="text-red-600 border-none hover:bg-red-50"
          />
        </div>
      ),
    },
  ]

  return (
    <Layout title="System Settings">
      <div className="flex flex-col gap-6">
        {/* Card 1 — ESG Configuration */}
        <div className="card">
          <h2 className="text-[14px] font-semibold text-charcoal mb-4">ESG Platform Configuration</h2>
          <div className="flex flex-col gap-4">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between pb-3 border-b border-dew">
              <div>
                <div className="font-semibold text-charcoal text-[13px]">Auto Emission Calculation</div>
                <div className="text-sage text-[11.5px]">Automatically calculate carbon footprint on transactions.</div>
              </div>
              <input
                type="checkbox"
                checked={config?.auto_emission_calculation_enabled ?? true}
                onChange={(e) =>
                  updateConfigMutation.mutate({ auto_emission_calculation_enabled: e.target.checked })
                }
                className="w-9 h-5 text-forest border-mist rounded focus:ring-forest cursor-pointer"
              />
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between pb-3 border-b border-dew">
              <div>
                <div className="font-semibold text-charcoal text-[13px]">Evidence Requirement</div>
                <div className="text-sage text-[11.5px]">Enforce proof uploads on CSR and Challenge participations.</div>
              </div>
              <input
                type="checkbox"
                checked={config?.evidence_requirement_enabled ?? true}
                onChange={(e) =>
                  updateConfigMutation.mutate({ evidence_requirement_enabled: e.target.checked })
                }
                className="w-9 h-5 text-forest border-mist rounded focus:ring-forest cursor-pointer"
              />
            </div>

            {/* Toggle 3 */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-charcoal text-[13px]">Badge Auto-Award</div>
                <div className="text-sage text-[11.5px]">Automatically evaluate and award badges upon action completions.</div>
              </div>
              <input
                type="checkbox"
                checked={config?.badge_auto_award_enabled ?? true}
                onChange={(e) =>
                  updateConfigMutation.mutate({ badge_auto_award_enabled: e.target.checked })
                }
                className="w-9 h-5 text-forest border-mist rounded focus:ring-forest cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Card 2 — Departments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-charcoal">Departments Manager</h2>
            <Button variant="primary" icon="ti-plus" onClick={handleOpenCreateDep}>
              Add Department
            </Button>
          </div>
          {departments.length === 0 ? (
            <EmptyState icon="ti-building" title="No departments registered" />
          ) : (
            <Table columns={depColumns} data={departments} />
          )}
        </div>

        {/* Card 3 — Categories */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-charcoal">Categories Registry</h2>
            <Button variant="primary" icon="ti-plus" onClick={handleOpenCreateCat}>
              Add Category
            </Button>
          </div>
          {categories.length === 0 ? (
            <EmptyState icon="ti-category" title="No categories registered" />
          ) : (
            <Table columns={catColumns} data={categories} />
          )}
        </div>
      </div>

      {/* Modal - Department */}
      <Modal
        title={editingDep ? 'Edit Department' : 'Add Department'}
        open={depModalOpen}
        onClose={handleCloseDep}
        onConfirm={handleConfirmDep}
        confirmLabel={editingDep ? 'Save Changes' : 'Create'}
      >
        <div>
          <label className="input-label">Department Name *</label>
          <input
            className="input"
            placeholder="e.g. Research & Development"
            value={depForm.name}
            onChange={(e) => setDepForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Department Code *</label>
          <input
            className="input"
            placeholder="e.g. RD"
            value={depForm.code}
            onChange={(e) => setDepForm((f) => ({ ...f, code: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Head Employee ID</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 1"
            value={depForm.head_id}
            onChange={(e) => setDepForm((f) => ({ ...f, head_id: e.target.value }))}
          />
        </div>

        <div>
          <label className="input-label">Parent Department ID</label>
          <select
            className="input"
            value={depForm.parent_department_id}
            onChange={(e) => setDepForm((f) => ({ ...f, parent_department_id: e.target.value }))}
          >
            <option value="">None</option>
            {departments
              .filter((d) => !editingDep || d.id !== editingDep.id)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="input-label">Employee Count</label>
          <input
            type="number"
            className="input"
            value={depForm.employee_count}
            onChange={(e) => setDepForm((f) => ({ ...f, employee_count: e.target.value }))}
          />
        </div>

        <div>
          <label className="input-label">Status</label>
          <select
            className="input"
            value={depForm.status}
            onChange={(e) => setDepForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </Modal>

      {/* Modal - Category */}
      <Modal
        title={editingCat ? 'Edit Category' : 'Add Category'}
        open={catModalOpen}
        onClose={handleCloseCat}
        onConfirm={handleConfirmCat}
        confirmLabel={editingCat ? 'Save Changes' : 'Create'}
      >
        <div>
          <label className="input-label">Category Name *</label>
          <input
            className="input"
            placeholder="e.g. Renewable Energy"
            value={catForm.name}
            onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="input-label">Type *</label>
          <select
            className="input"
            value={catForm.type}
            onChange={(e) => setCatForm((f) => ({ ...f, type: e.target.value }))}
            required
          >
            <option value="CSR_ACTIVITY">CSR Activity</option>
            <option value="CHALLENGE">Challenge</option>
          </select>
        </div>

        <div>
          <label className="input-label">Status</label>
          <select
            className="input"
            value={catForm.status}
            onChange={(e) => setCatForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </Modal>
    </Layout>
  )
}
