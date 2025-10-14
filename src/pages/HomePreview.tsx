import { Card } from '../components/Card'
import { Link } from 'react-router-dom'

export default function HomePreviewPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Icon Admin</h1>
        <Link to="/health" className="text-blue-600 hover:underline">
          Health
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Shops">
          Manage shop listings and operating hours.
        </Card>
        <Card title="Users">
          Review registrations and manage roles.
        </Card>
      </div>
    </div>
  )
}