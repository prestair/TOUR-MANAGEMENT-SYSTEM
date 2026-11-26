'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { FiDollarSign, FiFileText } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getClaimsByStatus, updateClaimStatus } from '@/lib/claims'
import { Claim } from '@/lib/types'

export default function FinancePendingPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getClaimsByStatus(['manager_approved']).then(data => {
      setClaims(data)
      setLoading(false)
    })
  }, [])

  const approve = async (id: string) => {
    const { error } = await updateClaimStatus(id, 'finance_approved', {
      finance_approved_at: new Date().toISOString(),
    })
    if (error) { toast.error(error); return }
    setClaims(prev => prev.filter(c => c.id !== id))
    toast.success('Finance approved')
  }

  const reject = async (id: string) => {
    const { error } = await updateClaimStatus(id, 'finance_rejected')
    if (error) { toast.error(error); return }
    setClaims(prev => prev.filter(c => c.id !== id))
    toast.error('Claim rejected')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FiDollarSign className="text-blue-500" /> Finance Approval
        </h1>
        <p className="text-gray-500 mt-1">Manager-approved claims pending finance review</p>
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
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Requested (₹)</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Approved (₹)</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-blue-600 font-medium whitespace-nowrap">{claim.claim_number}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{claim.submitted_by}</td>
                    <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{claim.tour_purpose}</td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{claim.site_name}</td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(claim.tour_from_date), 'dd MMM')} – {format(new Date(claim.tour_to_date), 'dd MMM yy')}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500">₹{claim.total_amount?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-bold text-green-700">
                      ₹{(claim.approved_amount ?? claim.total_amount)?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(claim.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => approve(claim.id)}
                          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200">
                          Approve
                        </button>
                        <button onClick={() => reject(claim.id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <FiFileText className="text-5xl mx-auto mb-3" />
            <p className="font-medium">No claims pending finance approval</p>
          </div>
        )}
      </div>
    </div>
  )
}
