import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
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

  const { data: departments = [], isLoading: isDepsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => platformApi.listDepartments(),
  })

  const { data: leaderboard = [], isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ['leaderboard', 5],
    queryFn: () => gamificationApi.getLeaderboard(5),
  })

  const isLoading = isDashboardLoading || isScoresLoading || isDepsLoading || isLeaderboardLoading

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

  const chartData = scores.map((s) => {
    const dept = departments.find((d) => d.id === s.department_id)
    return {
      name: dept ? dept.name : `Dept ${s.department_id}`,
      Environmental: s.environmental_score,
      Social: s.social_score,
      Governance: s.governance_score,
    }
  })

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

      {/* ESG Performance Chart */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-charcoal">ESG Performance by Department</h2>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6F2DD" />
              <XAxis
                dataKey="name"
                interval={0}
                tick={{ fill: '#2D3A35', fontSize: 10 }}
                height={55}
                angle={-15}
                textAnchor="end"
                axisLine={false}
                tickLine={false}
              />
              <YAxis domain={[0, 100]} tick={{ fill: '#2D3A35', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#2D3A35', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar name="Environmental" dataKey="Environmental" fill="#659287" radius={[4, 4, 0, 0]} />
              <Bar name="Social" dataKey="Social" fill="#88BDA4" radius={[4, 4, 0, 0]} />
              <Bar name="Governance" dataKey="Governance" fill="#B1D3B9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
