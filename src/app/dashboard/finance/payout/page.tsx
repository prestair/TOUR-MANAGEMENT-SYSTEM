'use client'

import { FiCreditCard, FiClock } from 'react-icons/fi'

export default function PayoutPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
        <FiCreditCard className="text-green-500 text-3xl" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-800">Payout</h1>
        <p className="text-gray-500 mt-2 max-w-sm">
          This feature is under development and will be available soon.
          For now, <span className="font-semibold text-green-600">Manager Approval is considered final approval.</span>
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-100 px-4 py-2 rounded-full">
        <FiClock /> Coming soon
      </div>
    </div>
  )
}
