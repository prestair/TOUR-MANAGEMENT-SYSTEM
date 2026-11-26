import clsx from 'clsx'

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  submitted:        { label: 'Submitted',        className: 'bg-blue-100 text-blue-700 border border-blue-200',          dot: 'bg-blue-500' },
  on_hold:          { label: 'On Hold',          className: 'bg-yellow-100 text-yellow-800 border border-yellow-300',    dot: 'bg-yellow-500' },
  manager_approved: { label: 'Manager Approved', className: 'bg-green-100 text-green-700 border border-green-200',       dot: 'bg-green-500' },
  manager_rejected: { label: 'Manager Rejected', className: 'bg-red-100 text-red-700 border border-red-200',             dot: 'bg-red-500' },
  finance_approved: { label: 'Finance Approved', className: 'bg-purple-100 text-purple-700 border border-purple-200',    dot: 'bg-purple-500' },
  finance_rejected: { label: 'Finance Rejected', className: 'bg-red-100 text-red-700 border border-red-200',             dot: 'bg-red-500' },
  paid:             { label: 'Paid ✓',           className: 'bg-emerald-100 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
}

interface StatusBadgeProps {
  status: string
  remarks?: string | null
  approvedAmount?: number | null
}

export default function StatusBadge({ status, remarks, approvedAmount }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-700 border border-gray-200',
    dot: 'bg-gray-400',
  }

  const showRemarks = remarks && (
    status === 'on_hold' ||
    status === 'manager_rejected' ||
    status === 'finance_rejected'
  )
  const showAmount = approvedAmount != null && (
    status === 'manager_approved' ||
    status === 'finance_approved' ||
    status === 'paid'
  )

  if (!showRemarks && !showAmount) {
    return (
      <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap', config.className)}>
        <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
        {config.label}
      </span>
    )
  }

  return (
    <div className={clsx('inline-flex flex-col rounded-xl px-3 py-1.5 text-xs font-semibold max-w-[200px]', config.className)}>
      <span className="flex items-center gap-1.5">
        <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
        {config.label}
      </span>
      {showAmount && (
        <span className="mt-1 font-bold text-sm">
          ₹{approvedAmount!.toLocaleString('en-IN')}
        </span>
      )}
      {showRemarks && (
        <span className="mt-1 font-normal opacity-80 leading-tight whitespace-normal">
          &ldquo;{remarks}&rdquo;
        </span>
      )}
    </div>
  )
}
