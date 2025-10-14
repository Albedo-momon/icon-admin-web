import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Card } from '../components/Card'

export default function HealthPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: api.health,
  })

  if (isLoading) return <div className="p-4">Checking health...</div>
  if (error) return <div className="p-4 text-red-600">Error loading health</div>

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">System Health</h1>
      <Card title="API">
        <div>Status: {data?.status}</div>
        {data?.db && <div>Database: {data.db}</div>}
      </Card>
    </div>
  )
}