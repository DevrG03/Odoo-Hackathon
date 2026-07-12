import api from './axios'
import type { ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue } from '../types/governance'

export const governanceApi = {
  listPolicies: () => api.get<ESGPolicy[]>('/governance/policies').then(r => r.data),
  createPolicy: (data: Partial<ESGPolicy>) => api.post<ESGPolicy>('/governance/policies', data).then(r => r.data),
  updatePolicy: (id: number, data: Partial<ESGPolicy>) => api.put<ESGPolicy>(`/governance/policies/${id}`, data).then(r => r.data),
  deletePolicy: (id: number) => api.delete(`/governance/policies/${id}`),

  listAcknowledgements: (params?: { policy_id?: number; employee_id?: number }) =>
    api.get<PolicyAcknowledgement[]>('/governance/acknowledgements', { params }).then(r => r.data),
  createAcknowledgement: (data: { policy_id: number; employee_id: number }) =>
    api.post<PolicyAcknowledgement>('/governance/acknowledgements', data).then(r => r.data),
  acknowledgePolicy: (id: number) =>
    api.put<PolicyAcknowledgement>(`/governance/acknowledgements/${id}/acknowledge`).then(r => r.data),

  listAudits: (status?: string) => api.get<Audit[]>('/governance/audits', { params: { status } }).then(r => r.data),
  createAudit: (data: Partial<Audit>) => api.post<Audit>('/governance/audits', data).then(r => r.data),
  updateAudit: (id: number, data: Partial<Audit>) => api.put<Audit>(`/governance/audits/${id}`, data).then(r => r.data),
  deleteAudit: (id: number) => api.delete(`/governance/audits/${id}`),

  listComplianceIssues: (params?: { audit_id?: number; severity?: string; status?: string; owner_id?: number }) =>
    api.get<ComplianceIssue[]>('/governance/compliance-issues', { params }).then(r => r.data),
  createComplianceIssue: (data: Partial<ComplianceIssue>) => api.post<ComplianceIssue>('/governance/compliance-issues', data).then(r => r.data),
  updateComplianceIssue: (id: number, data: Partial<ComplianceIssue>) => api.put<ComplianceIssue>(`/governance/compliance-issues/${id}`, data).then(r => r.data),
  resolveComplianceIssue: (id: number) => api.put<ComplianceIssue>(`/governance/compliance-issues/${id}/resolve`).then(r => r.data),
  deleteComplianceIssue: (id: number) => api.delete(`/governance/compliance-issues/${id}`),

  getReport: (params?: Record<string, string>) => api.get('/governance/report', { params }).then(r => r.data),
}
