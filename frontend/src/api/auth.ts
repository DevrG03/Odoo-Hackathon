import api from './axios'
import type { User, Employee, LoginResponse } from '../types/auth'

export const authApi = {
  register: (email: string, password: string, role = 'employee') =>
    api.post<User>('/auth/register', { email, password, role }).then(r => r.data),

  login: (email: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post<LoginResponse>('/auth/token', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(r => r.data)
  },

  listEmployees: () => api.get<Employee[]>('/auth/employees').then(r => r.data),
  getEmployee: (id: number) => api.get<Employee>(`/auth/employees/${id}`).then(r => r.data),
  createEmployee: (data: { user_id: number; department_id?: number; name: string }) =>
    api.post<Employee>('/auth/employees', data).then(r => r.data),
}
