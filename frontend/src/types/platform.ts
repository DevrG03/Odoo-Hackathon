export interface Department { id: number; name: string; code: string; head_id: number | null; parent_department_id: number | null; employee_count: number; status: string }
export interface Category { id: number; name: string; type: string; status: string }
export interface ESGConfig { id: number; auto_emission_calculation_enabled: boolean; evidence_requirement_enabled: boolean; badge_auto_award_enabled: boolean }
export interface DepartmentScore { id: number; department_id: number; environmental_score: number; social_score: number; governance_score: number; total_score: number }
export interface DashboardData { overall_esg_score: number; departments: DepartmentScore[] }
