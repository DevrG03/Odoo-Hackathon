export interface User { id: number; email: string; role: string }
export interface Employee { id: number; user_id: number; department_id: number | null; name: string; total_xp: number; total_points: number }
export interface LoginResponse { access_token: string; token_type: string }
