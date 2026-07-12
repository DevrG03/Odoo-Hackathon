export interface CSRActivity { id: number; title: string; category_id: number; description: string; points_offered: number; date: string }
export interface EmployeeParticipation { id: number; employee_id: number; activity_id: number; proof_url: string | null; approval_status: string; points_earned: number; completion_date: string }
