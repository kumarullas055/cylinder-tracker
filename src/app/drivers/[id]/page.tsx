import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getDriverData, DriverKPICard, DriverProfileField } from './components/driver-detail'
import { PageHeader } from '@/components/page-header'
import { Package, DollarSign, AlertTriangle, Calendar, TrendingUp, CreditCard, Truck } from 'lucide-react'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface DriverDetailPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function DriverDetailPage({ params }: DriverDetailPageProps) {
  const { id } = await params
  
  return (
    <div className="space-y-6 animate-fade-in">
      <Suspense fallback={<DriverDetailSkeleton />}>
        <DriverDetail id={id} />
      </Suspense>
    </div>
  )
}

async function DriverDetail({ id }: { id: string }) {
  const driver = await getDriverData(id)

  if (!driver) {
    notFound()
  }

  return (
    <>
      <PageHeader
        title={driver.name}
        description={driver.code}
        actions={
          <div className="flex gap-2">
            <a href={`/drivers/${driver.id}/edit`} className="btn-secondary">Edit</a>
            <a href={`/allocations/new?driver=${driver.id}`} className="btn-primary">New Allocation</a>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <DriverKPICard
          title="Lifetime Cylinders"
          value={formatNumber(driver.totalCylinders)}
          icon={<Package className="w-5 h-5" />}
          iconBg="bg-brand-500/20"
          iconColor="text-brand-400"
        />
        <DriverKPICard
          title="Total Collected"
          value={formatCurrency(driver.totalCollected)}
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-emerald-500/20"
          iconColor="text-emerald-400"
        />
        <DriverKPICard
          title="Outstanding Dues"
          value={formatCurrency(driver.outstanding)}
          color={driver.outstanding > 0 ? 'text-red-400' : 'text-emerald-400'}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-amber-500/20"
          iconColor="text-amber-400"
        />
        <DriverKPICard
          title="Active Days"
          value={`${driver.totalDays}`}
          icon={<Calendar className="w-5 h-5" />}
          iconBg="bg-slate-700/50"
          iconColor="text-slate-300"
        />
        <DriverKPICard
          title="Reliability"
          value={`${driver.reliabilityScore}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg={driver.reliabilityScore >= 90 ? 'bg-emerald-500/20' : driver.reliabilityScore >= 70 ? 'bg-amber-500/20' : 'bg-red-500/20'}
          iconColor={driver.reliabilityScore >= 90 ? 'text-emerald-400' : driver.reliabilityScore >= 70 ? 'text-amber-400' : 'text-red-400'}
        />
      </div>

      {/* Tabs */}
      <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="tab-list border-b border-slate-700/50">
          <button className="tab-trigger active" data-tab="allocations">Allocations</button>
          <button className="tab-trigger" data-tab="payments">Payments</button>
          <button className="tab-trigger" data-tab="profile">Profile</button>
        </div>

        <div className="tab-content">
          {/* Allocations Tab */}
          <div id="allocations" className="tab-pane active">
            <div className="overflow-x-auto p-4">
              <table className="table-base w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Issued</th>
                    <th>Sold</th>
                    <th>Returned</th>
                    <th>Empties</th>
                    <th>Expected</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {driver.allocations.map((alloc) => (
                    <tr key={alloc.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3">{formatDate(alloc.date)}</td>
                      <td className="px-4 py-3">{alloc.fullCylindersIssued}</td>
                      <td className="px-4 py-3 text-emerald-400">{alloc.fullCylindersSold}</td>
                      <td className="px-4 py-3 text-slate-400">{alloc.fullCylindersReturned}</td>
                      <td className="px-4 py-3 text-brand-400">{alloc.emptyCylindersCollected}</td>
                      <td className="px-4 py-3">{formatCurrency(alloc.expectedCash)}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'badge',
                          alloc.status === 'CLOSED' && 'badge-success',
                          alloc.status === 'PENDING' && 'badge-info',
                          alloc.status === 'FLAGGED' && 'badge-danger'
                        )}>
                          {alloc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {driver.allocations.length === 0 && (
                <div className="empty-state py-8">
                  <Package className="empty-state-icon" />
                  <p className="empty-state-title">No allocations yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Payments Tab */}
          <div id="payments" className="tab-pane">
            <div className="overflow-x-auto p-4">
              <table className="table-base w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {driver.payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3">{formatDate(payment.date)}</td>
                      <td className="px-4 py-3 font-medium text-emerald-400">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3">
                        <span className="badge badge-neutral">{payment.method}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{payment.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {driver.payments.length === 0 && (
                <div className="empty-state py-8">
                  <CreditCard className="empty-state-icon" />
                  <p className="empty-state-title">No payments recorded</p>
                </div>
              )}
            </div>
          </div>

          {/* Profile Tab */}
          <div id="profile" className="tab-pane">
            <div className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <DriverProfileField label="Code" value={driver.code} />
                <DriverProfileField label="Phone" value={driver.phone} />
                <DriverProfileField label="Vehicle" value={`${driver.vehicleType || '-'} - ${driver.vehicleNumber || '-'}`} />
                <DriverProfileField label="Joining Date" value={formatDate(driver.joiningDate)} />
                <DriverProfileField label="License" value={driver.licenseNumber || 'Not provided'} />
                <DriverProfileField label="License Expiry" value={driver.licenseExpiry ? formatDate(driver.licenseExpiry) : 'Not provided'} />
                <DriverProfileField label="Dues Threshold" value={formatCurrency(driver.duesThreshold)} />
                <DriverProfileField label="Status" value={driver.isActive ? 'Active' : 'Inactive'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function DriverDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass p-5 rounded-2xl border border-slate-700/50">
            <div className="skeleton h-4 w-3/4 mb-2 rounded" />
            <div className="skeleton h-8 w-1/2 rounded" />
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl border border-slate-700/50 p-6">
        <div className="skeleton h-8 w-48 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-12 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}