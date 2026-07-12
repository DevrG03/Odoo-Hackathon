export interface Challenge { id: number; title: string; category_id: number; description: string; xp_reward: number; difficulty: string; evidence_required: boolean; deadline: string; status: string }
export interface ChallengeParticipation { id: number; challenge_id: number; employee_id: number; progress: number; proof_url: string | null; approval_status: string; xp_awarded: number }
export interface Badge { id: number; name: string; description: string; unlock_rule: string; icon: string }
export interface Reward { id: number; name: string; description: string; points_required: number; stock: number; status: string }
export interface LeaderboardEntry { rank: number; employee_id: number; name: string; total_xp: number; total_points: number }
