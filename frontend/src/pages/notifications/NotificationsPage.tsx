import { Layout } from '../../components/layout/Layout'
import { EmptyState } from '../../components/ui/EmptyState'

export function NotificationsPage() {
  return (
    <Layout title="Notifications">
      <div className="card">
        <EmptyState
          icon="ti-bell"
          title="Notifications coming soon"
          description="In-app alerts and notifications about ESG goals, challenges, and policies will appear here."
        />
      </div>
    </Layout>
  )
}
