'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import StatusBadge from '@/components/StatusBadge'
import { FiBarChart2, FiFileText } from 'react-icons/fi'
import { getAllClaims, getClaimsByUser } from '@/lib/claims'
import { Claim, SessionUser } from '@/lib/types'

function getSession(): SessionUser | null {
  try {
    const raw = document.cookie
      .split('; ')
      .find(r => r.startsWith('tbms_session='))
      ?.split('=').slice(1).join('=')
    if (!raw) return null
    return JSON.parse(decodeURIComponent(raw))
  } catch { return null }
}

export default function ReportsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)

  const loadClaims = useCallback(async (u: SessionUser) => {
    const data = u.role === 'admin' ? await getAllClaims() : await getClaimsByUser(u.id)
    setClaims(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    const u = getSession()
    if (!u) return
    loadClaims(u)
  }, [loadClaims])

  const total = claims.length
  const paid = claims.filter(c => c.status === 'paid').length
  const pending = claims.filter(c => ['submitted', 'manager_approved', 'finance_approved'].includes(c.status)).length
  const rejected = claims.filter(c => ['manager_rejected', 'finance_rejected'].includes(c.status)).length
  const totalAmt = claims.filter(c => c.status === 'paid').reduce((s, c) => s + (c.total_amount || 0), 0)
  const pendingAmt = claims.filter(c => ['submitted', 'manager_approved', 'finance_approved'].includes(c.status)).reduce((s, c) => s + (c.total_amount || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FiBarChart2 /> Reports
        </h1>
        <p className="text-gray-500 mt-1">Overview of all tour bill claims</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-l-4 border-blue-500">
          <p className="text-3xl font-bold text-blue-700">{loading ? '...' : total}</p>
          <p className="text-sm text-gray-500 mt-1">Total Claims</p>
        </div>
        <div className="card border-l-4 border-green-500">
          <p className="text-3xl font-bold text-green-700">{loading ? '...' : paid}</p>
          <p className="text-sm text-gray-500 mt-1">Paid</p>
          <p className="text-xs text-green-600 font-medium mt-0.5">₹{totalAmt.toLocaleString('en-IN')}</p>
        </div>
        <div className="card border-l-4 border-yellow-500">
          <p className="text-3xl font-bold text-yellow-700">{loading ? '...' : pending}</p>
          <p className="text-sm text-gray-500 mt-1">In Progress</p>
          <p className="text-xs text-yellow-600 font-medium mt-0.5">₹{pendingAmt.toLocaleString('en-IN')}</p>
        </div>
        <div className="card border-l-4 border-red-500">
          <p className="text-3xl font-bold text-red-700">{loading ? '...' : rejected}</p>
          <p className="text-sm text-gray-500 mt-1">Rejected</p>
        </div>
      </div>

      {/* Full Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">All Claims</h3>
        </div>
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : claims.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Claim No.</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Purpose</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Site</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Tour Period</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Amount (₹)</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-blue-600">{claim.claim_number}</td>
                    <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{claim.tour_purpose}</td>
                    <td className="py-3 px-4 text-gray-500">{claim.site_name}</td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(claim.tour_from_date), 'dd MMM')} – {format(new Date(claim.tour_to_date), 'dd MMM yy')}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-blue-700">
                      ₹{claim.total_amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={claim.status} /></td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {format(new Date(claim.created_at), 'dd MMM yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <FiFileText className="text-5xl mx-auto mb-3" />
            <p className="font-medium">No claims found</p>
          </div>
        )}
      </div>
    </div>
  )
}
