import api from './axios'
import type { CSRActivity, EmployeeParticipation } from '../types/social'

export const socialApi = {
  listActivities: () => api.get<CSRActivity[]>('/social/activities').then(r => r.data),
  createActivity: (data: Partial<CSRActivity>) => api.post<CSRActivity>('/social/activities', data).then(r => r.data),
  updateActivity: (id: number, data: Partial<CSRActivity>) => api.put<CSRActivity>(`/social/activities/${id}`, data).then(r => r.data),
  deleteActivity: (id: number) => api.delete(`/social/activities/${id}`),

  listParticipations: (params?: { employee_id?: number; activity_id?: number; status?: string }) =>
    api.get<EmployeeParticipation[]>('/social/participations', { params }).then(r => r.data),
  createParticipation: (data: { employee_id: number; activity_id: number; proof_url?: string }) =>
    api.post<EmployeeParticipation>('/social/participations', data).then(r => r.data),
  approveParticipation: (id: number, approval_status: 'Approved' | 'Rejected') =>
    api.put<EmployeeParticipation>(`/social/participations/${id}/approve`, { approval_status }).then(r => r.data),

  getReport: (params?: Record<string, string>) => api.get('/social/report', { params }).then(r => r.data),
}
