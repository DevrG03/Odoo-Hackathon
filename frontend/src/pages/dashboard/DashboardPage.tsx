import { useQuery } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { StatCard } from '../../components/ui/StatCard'
import { Table, type Column } from '../../components/ui/Table'
import { PageSpinner } from '../../components/ui/Spinner'
import { platformApi } from '../../api/platform'
import { gamificationApi } from '../../api/gamification'
import type { DepartmentScore } from '../../types/platform'
import type { LeaderboardEntry } from '../../types/gamification'

export function DashboardPage() {
  const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => platformApi.getDashboard(),
  })

  const { data: scores = [], isLoading: isScoresLoading } = useQuery({
    queryKey: ['scores'],
    queryFn: () => platformApi.listScores(),
  })

  const { data: leaderboard = [], isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ['leaderboard', 5],
    queryFn: () => gamificationApi.getLeaderboard(5),
  })

  const isLoading = isDashboardLoading || isScoresLoading || isLeaderboardLoading

  if (isLoading) {
    return (
      <Layout title="Dashboard">
        <PageSpinner />
      </Layout>
    )
  }

  const overallEsgScore = dashboard?.overall_esg_score ?? 0
  const totalDepartments = scores.length
  const topXP = leaderboard[0]?.total_xp ?? 0

  const scoreColumns: Column<DepartmentScore>[] = [
    { header: 'Department ID', accessor: 'department_id', numeric: true },
    {
      header: 'Environmental',
      accessor: 'environmental_score',
      numeric: true,
      render: (r) => r.environmental_score.toFixed(1),
    },
    {
      header: 'Social',
      accessor: 'social_score',
      numeric: true,
      render: (r) => r.social_score.toFixed(1),
    },
    {
      header: 'Governance',
      accessor: 'governance_score',
      numeric: true,
      render: (r) => r.governance_score.toFixed(1),
    },
    {
      header: 'Total Score',
      accessor: 'total_score',
      numeric: true,
      render: (r) => r.total_score.toFixed(1),
    },
  ]

  const leaderboardColumns: Column<LeaderboardEntry>[] = [
    { header: 'Rank', accessor: 'rank', numeric: true, render: (r) => `#${r.rank}` },
    { header: 'Name', accessor: 'name' },
    { header: 'XP', accessor: 'total_xp', numeric: true },
    { header: 'Points', accessor: 'total_points', numeric: true },
  ]

  return (
    <Layout title="Dashboard">
      {/* 4 stat cards in a grid */}
      <div className="grid grid-cols-4 gap-[10px] mb-6">
        <StatCard
          label="Overall ESG Score"
          value={overallEsgScore.toFixed(1)}
          stripe="forest"
          icon="ti-activity"
        />
        <StatCard
          label="Total Departments"
          value={totalDepartments}
          stripe="sage"
          icon="ti-building-community"
        />
        <StatCard
          label="Leader XP"
          value={topXP}
          stripe="mist"
          icon="ti-trophy"
        />
        <StatCard
          label="Pending Reviews"
          value="0"
          stripe="red"
          icon="ti-hourglass-low"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section: Department Scores */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-charcoal">Department Scores</h2>
          </div>
          <Table columns={scoreColumns} data={scores} />
        </div>

        {/* Section: Top Employees */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-charcoal">Top Employees</h2>
          </div>
          <Table columns={leaderboardColumns} data={leaderboard} />
        </div>
      </div>
    </Layout>
  )
}
