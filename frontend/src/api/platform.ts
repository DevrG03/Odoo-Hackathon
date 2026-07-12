import api from './axios'
import type { Department, Category, ESGConfig, DepartmentScore, DashboardData } from '../types/platform'

export const platformApi = {
  getDashboard: () => api.get<DashboardData>('/platform/dashboard').then(r => r.data),

  listDepartments: () => api.get<Department[]>('/platform/departments').then(r => r.data),
  createDepartment: (data: Partial<Department>) => api.post<Department>('/platform/departments', data).then(r => r.data),
  updateDepartment: (id: number, data: Partial<Department>) => api.put<Department>(`/platform/departments/${id}`, data).then(r => r.data),
  deleteDepartment: (id: number) => api.delete(`/platform/departments/${id}`),

  listCategories: (type?: string) => api.get<Category[]>('/platform/categories', { params: { type } }).then(r => r.data),
  createCategory: (data: Partial<Category>) => api.post<Category>('/platform/categories', data).then(r => r.data),
  updateCategory: (id: number, data: Partial<Category>) => api.put<Category>(`/platform/categories/${id}`, data).then(r => r.data),
  deleteCategory: (id: number) => api.delete(`/platform/categories/${id}`),

  getConfig: () => api.get<ESGConfig>('/platform/config').then(r => r.data),
  updateConfig: (data: Partial<ESGConfig>) => api.put<ESGConfig>('/platform/config', data).then(r => r.data),

  listScores: () => api.get<DepartmentScore[]>('/platform/scores').then(r => r.data),
}
