export interface EmissionFactor { id: number; name: string; unit: string; value: number }
export interface ProductESGProfile { id: number; name: string; esg_data: Record<string, unknown> }
export interface EnvironmentalGoal { id: number; department_id: number | null; title: string; target_value: number; current_value: number; deadline: string }
export interface CarbonTransaction { id: number; department_id: number; source: string; value: number; emission_factor_id: number | null; calculated_emissions: number; date: string }
