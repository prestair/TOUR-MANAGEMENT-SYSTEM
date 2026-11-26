import { ClaimStatus } from '@/lib/types'
import clsx from 'clsx'

const statusConfig: Record<ClaimStatus, { label: string; className: string }> = {
  draft:             { label: 'Draft',              className: 'bg-gray-100 text-gray-700' },
  submitted:         { label: 'Submitted',          className: 'bg-blue-100 text-blue-700' },
  manager_approved:  { label: 'Manager Approved',   className: 'bg-yellow-100 text-yellow-700' },
  manager_rejected:  { label: 'Manager Rejected',   className: 'bg-red-100 text-red-700' },
  finance_approved:  { label: 'Finance Approved',   className: 'bg-purple-100 text-purple-700' },
  finance_rejected:  { label: 'Finance Rejected',   className: 'bg-red-100 text-red-700' },
  paid:              { label: 'Paid',               className: 'bg-green-100 text-green-700' },
}

export default function StatusBadge({ status }: { status: ClaimStatus }) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', config.className)}>
      {config.label}
    </span>
  )
}
