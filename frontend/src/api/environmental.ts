import api from './axios'
import type { EmissionFactor, CarbonTransaction, EnvironmentalGoal } from '../types/environmental'

export const environmentalApi = {
  listFactors: () => api.get<EmissionFactor[]>('/environmental/emission-factors').then(r => r.data),
  createFactor: (data: Partial<EmissionFactor>) => api.post<EmissionFactor>('/environmental/emission-factors', data).then(r => r.data),
  updateFactor: (id: number, data: Partial<EmissionFactor>) => api.put<EmissionFactor>(`/environmental/emission-factors/${id}`, data).then(r => r.data),
  deleteFactor: (id: number) => api.delete(`/environmental/emission-factors/${id}`),

  listTransactions: (params?: { department_id?: number; date_from?: string; date_to?: string }) =>
    api.get<CarbonTransaction[]>('/environmental/carbon-transactions', { params }).then(r => r.data),
  createTransaction: (data: Partial<CarbonTransaction>) => api.post<CarbonTransaction>('/environmental/carbon-transactions', data).then(r => r.data),
  deleteTransaction: (id: number) => api.delete(`/environmental/carbon-transactions/${id}`),

  listGoals: (department_id?: number) => api.get<EnvironmentalGoal[]>('/environmental/goals', { params: { department_id } }).then(r => r.data),
  createGoal: (data: Partial<EnvironmentalGoal>) => api.post<EnvironmentalGoal>('/environmental/goals', data).then(r => r.data),
  updateGoal: (id: number, data: Partial<EnvironmentalGoal>) => api.put<EnvironmentalGoal>(`/environmental/goals/${id}`, data).then(r => r.data),
  deleteGoal: (id: number) => api.delete(`/environmental/goals/${id}`),

  getReport: (params?: { department_id?: number; date_from?: string; date_to?: string }) =>
    api.get('/environmental/report', { params }).then(r => r.data),
}
