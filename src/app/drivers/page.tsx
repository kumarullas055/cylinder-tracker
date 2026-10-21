import { Suspense } from 'react'
import { DriversList } from './components/drivers-list'
import { PageHeader } from '@/components/page-header'

export const dynamic = 'force-dynamic'

export default async function DriversPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Drivers"
        description="Manage delivery drivers and track performance"
        actions={
          <a href="/drivers/new" className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Driver
          </a>
        }
      />

      <Suspense fallback={<DriversListSkeleton />}>
        <DriversList />
      </Suspense>
    </div>
  )
}

function DriversListSkeleton() {
  return (
    <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <div className="skeleton h-6 w-48 rounded" />
      </div>
      <div className="divide-y divide-slate-800/50">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="skeleton h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-48 rounded" />
              <div className="skeleton h-4 w-64 rounded" />
            </div>
            <div className="skeleton h-8 w-24 rounded" />
            <div className="skeleton h-8 w-24 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}