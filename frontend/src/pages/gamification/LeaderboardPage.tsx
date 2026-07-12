import { useQuery } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { gamificationApi } from '../../api/gamification'

export function LeaderboardPage() {
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['leaderboard', 20],
    queryFn: () => gamificationApi.getLeaderboard(20),
  })

  if (isLoading) {
    return (
      <Layout title="Leaderboard">
        <PageSpinner />
      </Layout>
    )
  }

  // Get custom border & background styles for top 3 ranks
  function getTop3Styles(rank: number) {
    if (rank === 1) return { borderLeft: '3px solid #F59E0B', backgroundColor: '#FEF3C7' } // Gold border, amber-100 bg
    if (rank === 2) return { borderLeft: '3px solid #94A3B8', backgroundColor: '#F1F5F9' } // Silver border, slate-100 bg
    if (rank === 3) return { borderLeft: '3px solid #B45309', backgroundColor: '#FFEDD5' } // Bronze border, orange-100 bg
    return {}
  }

  return (
    <Layout title="Leaderboard">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-charcoal">Global Employee Standings</h2>
        </div>

        {leaderboard.length === 0 ? (
          <EmptyState
            icon="ti-trophy"
            title="Leaderboard is empty"
            description="Employees will rank here once they earn sustainability XP."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.6px] text-sage px-4 pb-2.5 border-b border-mist">
                    Rank
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.6px] text-sage px-4 pb-2.5 border-b border-mist">
                    Name
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-[0.6px] text-sage px-4 pb-2.5 border-b border-mist">
                    XP
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-[0.6px] text-sage px-4 pb-2.5 border-b border-mist">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row) => (
                  <tr
                    key={row.rank}
                    style={getTop3Styles(row.rank)}
                    className="border-b border-dew hover:bg-dew/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-charcoal">
                      #{row.rank}
                    </td>
                    <td className="px-4 py-3 font-medium text-charcoal">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-forest text-[14px] tabular-nums">
                      {row.total_xp.toLocaleString()} XP
                    </td>
                    <td className="px-4 py-3 text-right text-[#3d5248] tabular-nums">
                      {row.total_points.toLocaleString()} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
