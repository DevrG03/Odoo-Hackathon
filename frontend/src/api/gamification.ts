import api from './axios'
import type { Challenge, ChallengeParticipation, Badge, Reward, LeaderboardEntry } from '../types/gamification'

export const gamificationApi = {
  listChallenges: (params?: { status?: string; category_id?: number }) =>
    api.get<Challenge[]>('/gamification/challenges', { params }).then(r => r.data),
  createChallenge: (data: Partial<Challenge>) => api.post<Challenge>('/gamification/challenges', data).then(r => r.data),
  updateChallenge: (id: number, data: Partial<Challenge>) => api.put<Challenge>(`/gamification/challenges/${id}`, data).then(r => r.data),
  deleteChallenge: (id: number) => api.delete(`/gamification/challenges/${id}`),

  listChallengeParticipations: (params?: { challenge_id?: number; employee_id?: number }) =>
    api.get<ChallengeParticipation[]>('/gamification/challenge-participations', { params }).then(r => r.data),
  createChallengeParticipation: (data: { challenge_id: number; employee_id: number; proof_url?: string }) =>
    api.post<ChallengeParticipation>('/gamification/challenge-participations', data).then(r => r.data),
  approveChallengeParticipation: (id: number, approval_status: 'Approved' | 'Rejected') =>
    api.put<ChallengeParticipation>(`/gamification/challenge-participations/${id}/approve`, { approval_status }).then(r => r.data),

  listBadges: () => api.get<Badge[]>('/gamification/badges').then(r => r.data),
  createBadge: (data: Partial<Badge>) => api.post<Badge>('/gamification/badges', data).then(r => r.data),
  updateBadge: (id: number, data: Partial<Badge>) => api.put<Badge>(`/gamification/badges/${id}`, data).then(r => r.data),
  deleteBadge: (id: number) => api.delete(`/gamification/badges/${id}`),

  listRewards: () => api.get<Reward[]>('/gamification/rewards').then(r => r.data),
  createReward: (data: Partial<Reward>) => api.post<Reward>('/gamification/rewards', data).then(r => r.data),
  updateReward: (id: number, data: Partial<Reward>) => api.put<Reward>(`/gamification/rewards/${id}`, data).then(r => r.data),
  deleteReward: (id: number) => api.delete(`/gamification/rewards/${id}`),
  redeemReward: (reward_id: number, employee_id: number) =>
    api.post(`/gamification/rewards/${reward_id}/redeem`, null, { params: { employee_id } }).then(r => r.data),

  getLeaderboard: (limit = 10) => api.get<LeaderboardEntry[]>('/gamification/leaderboard', { params: { limit } }).then(r => r.data),
}
