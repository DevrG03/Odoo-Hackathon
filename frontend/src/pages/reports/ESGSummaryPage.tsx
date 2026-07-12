import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/ui/Button'
import { Table, type Column } from '../../components/ui/Table'
import { PageSpinner } from '../../components/ui/Spinner'
import { environmentalApi } from '../../api/environmental'
import { socialApi } from '../../api/social'
import { governanceApi } from '../../api/governance'
import { platformApi } from '../../api/platform'
import type { DepartmentScore } from '../../types/platform'

export function ESGSummaryPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [queryParams, setQueryParams] = useState({ date_from: '', date_to: '' })

  const { data: envReport, isLoading: isEnvLoading } = useQuery({
    queryKey: ['environmentalReport', queryParams],
    queryFn: () =>
      environmentalApi.getReport({
        date_from: queryParams.date_from ? new Date(queryParams.date_from).toISOString() : undefined,
        date_to: queryParams.date_to ? new Date(queryParams.date_to).toISOString() : undefined,
      }),
  })

  const { data: socialReport, isLoading: isSocLoading } = useQuery({
    queryKey: ['socialReport', queryParams],
    queryFn: () =>
      socialApi.getReport(
        Object.fromEntries(
          Object.entries({
            date_from: queryParams.date_from ? new Date(queryParams.date_from).toISOString() : '',
            date_to: queryParams.date_to ? new Date(queryParams.date_to).toISOString() : '',
          }).filter(([_, v]) => v !== '')
        )
      ),
  })

  const { data: govReport, isLoading: isGovLoading } = useQuery({
    queryKey: ['governanceReport', queryParams],
    queryFn: () =>
      governanceApi.getReport(
        Object.fromEntries(
          Object.entries({
            date_from: queryParams.date_from ? new Date(queryParams.date_from).toISOString() : '',
            date_to: queryParams.date_to ? new Date(queryParams.date_to).toISOString() : '',
          }).filter(([_, v]) => v !== '')
        )
      ),
  })

  const { data: scores = [], isLoading: isScoresLoading } = useQuery({
    queryKey: ['scores'],
    queryFn: () => platformApi.listScores(),
  })

  function handleApplyFilters() {
    setQueryParams({ date_from: dateFrom, date_to: dateTo })
  }

  const isLoading = isEnvLoading || isSocLoading || isGovLoading || isScoresLoading

  if (isLoading) {
    return (
      <Layout title="ESG Summary">
        <PageSpinner />
      </Layout>
    )
  }

  // Fallbacks for data structures
  const envData = envReport ?? {
    total_calculated_emissions_kgCO2e: 0,
    total_transactions: 0,
    goals_summary: [],
  }

  const socData = socialReport ?? {
    total_participations: 0,
    approved_count: 0,
    total_points_awarded: 0,
  }

  const govData = govReport ?? {
    total_audits: 0,
    compliance_issues_summary: { open: 0, overdue: 0 },
  }

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

  return (
    <Layout title="ESG Summary Report">
      {/* Date Range Filter Bar */}
      <div className="bg-white border border-mist rounded-lg p-3.5 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-charcoal uppercase tracking-[0.5px]">From:</label>
          <input
            type="date"
            className="px-2.5 py-[5px] border border-mist rounded text-[12.5px] text-charcoal bg-white focus:outline-none"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-charcoal uppercase tracking-[0.5px]">To:</label>
          <input
            type="date"
            className="px-2.5 py-[5px] border border-mist rounded text-[12.5px] text-charcoal bg-white focus:outline-none"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <Button variant="primary" onClick={handleApplyFilters}>
          Apply Filters
        </Button>
      </div>

      {/* 3 Section cards side by side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Environmental Summary Card */}
        <div className="card border-l-4 border-l-forest">
          <div className="flex items-center gap-2 mb-3">
            <i className="ti ti-leaf text-forest text-lg" />
            <h3 className="text-[14px] font-semibold text-charcoal">Environmental</h3>
          </div>
          <div className="flex flex-col gap-2 mt-4 text-[12.5px]">
            <div className="flex justify-between border-b border-dew pb-1.5">
              <span className="text-sage">Carbon Emissions</span>
              <span className="font-semibold text-charcoal tabular-nums">
                {envData.total_calculated_emissions_kgCO2e.toLocaleString()} kgCO₂e
              </span>
            </div>
            <div className="flex justify-between border-b border-dew pb-1.5">
              <span className="text-sage">Carbon Transactions</span>
              <span className="font-semibold text-charcoal tabular-nums">
                {envData.total_transactions}
              </span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-sage">Goals Count</span>
              <span className="font-semibold text-charcoal tabular-nums">
                {envData.goals_summary.length}
              </span>
            </div>
          </div>
        </div>

        {/* Social Summary Card */}
        <div className="card border-l-4 border-l-sage">
          <div className="flex items-center gap-2 mb-3">
            <i className="ti ti-users text-sage text-lg" />
            <h3 className="text-[14px] font-semibold text-charcoal">Social</h3>
          </div>
          <div className="flex flex-col gap-2 mt-4 text-[12.5px]">
            <div className="flex justify-between border-b border-dew pb-1.5">
              <span className="text-sage">Total Participations</span>
              <span className="font-semibold text-charcoal tabular-nums">
                {socData.total_participations}
              </span>
            </div>
            <div className="flex justify-between border-b border-dew pb-1.5">
              <span className="text-sage">Approved CSR Actions</span>
              <span className="font-semibold text-charcoal tabular-nums">
                {socData.approved_count}
              </span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-sage">Points Awarded</span>
              <span className="font-semibold text-charcoal tabular-nums">
                {socData.total_points_awarded.toLocaleString()} pts
              </span>
            </div>
          </div>
        </div>

        {/* Governance Summary Card */}
        <div className="card border-l-4 border-l-amber-400">
          <div className="flex items-center gap-2 mb-3">
            <i className="ti ti-gavel text-amber-500 text-lg" />
            <h3 className="text-[14px] font-semibold text-charcoal">Governance</h3>
          </div>
          <div className="flex flex-col gap-2 mt-4 text-[12.5px]">
            <div className="flex justify-between border-b border-dew pb-1.5">
              <span className="text-sage">Total Audits</span>
              <span className="font-semibold text-charcoal tabular-nums">
                {govData.total_audits}
              </span>
            </div>
            <div className="flex justify-between border-b border-dew pb-1.5">
              <span className="text-sage">Open Issues</span>
              <span className="font-semibold text-charcoal tabular-nums">
                {govData.compliance_issues_summary.open}
              </span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-sage">Overdue Issues</span>
              <span className="font-semibold text-red-600 tabular-nums">
                {govData.compliance_issues_summary.overdue}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Department Scores Table below */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-[14px] font-semibold text-charcoal">Performance by Department</h2>
        </div>
        <Table columns={scoreColumns} data={scores} />
      </div>
    </Layout>
  )
}
