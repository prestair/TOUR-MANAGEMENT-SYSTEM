'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { FiFileText, FiCreditCard } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getClaimsByStatus, updateClaimStatus } from '@/lib/claims'
import { Claim } from '@/lib/types'

export default function PayoutPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getClaimsByStatus(['finance_approved']).then(data => {
      setClaims(data)
      setLoading(false)
    })
  }, [])

  const markPaid = async (id: string) => {
    const { error } = await updateClaimStatus(id, 'paid', {
      paid_at: new Date().toISOString(),
    })
    if (error) { toast.error(error); return }
    setClaims(prev => prev.filter(c => c.id !== id))
    toast.success('Marked as paid!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FiCreditCard className="text-blue-500" /> Payout
        </h1>
        <p className="text-gray-500 mt-1">Finance-approved claims ready for payment</p>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : claims.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Claim No.</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Submitted By</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Purpose</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Site</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Tour Period</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Payable (₹)</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-blue-600 font-medium">{claim.claim_number}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{claim.submitted_by}</td>
                    <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{claim.tour_purpose}</td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{claim.site_name}</td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(claim.tour_from_date), 'dd MMM')} – {format(new Date(claim.tour_to_date), 'dd MMM yy')}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-green-700">
                      ₹{(claim.approved_amount ?? claim.total_amount)?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(claim.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => markPaid(claim.id)}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200">
                        Mark as Paid
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <FiFileText className="text-5xl mx-auto mb-3" />
            <p className="font-medium">No claims ready for payout</p>
          </div>
        )}
      </div>
    </div>
  )
}
