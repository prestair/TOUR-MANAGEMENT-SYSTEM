'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { FiEye, FiFileText, FiTrash2, FiEdit2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getClaimsByUser, getAllClaims, deleteClaim } from '@/lib/claims'
import { Claim, SessionUser } from '@/lib/types'
import { M } from '@/lib/messages'

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

export default function DashboardPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)

  const loadClaims = useCallback(async (user: SessionUser) => {
    setLoading(true)
    const data = user.role === 'admin'
      ? await getAllClaims()
      : await getClaimsByUser(user.id)

    // User ke liye sirf relevant claims dikhao — manager_approved hide karo
    const visible = user.role === 'admin'
      ? data
      : data.filter(c => !['manager_approved'].includes(c.status))

    setClaims(visible)
    setLoading(false)
  }, [])

  useEffect(() => {
    const user = getSession()
    if (!user) return
    setCurrentUser(user)
    loadClaims(user)
  }, [loadClaims])

  const handleDelete = async (id: string) => {
    const { error } = await deleteClaim(id)
    if (error) { toast.error(`${M.claimDeleteFail.en} (${M.claimDeleteFail.hi})`); return }
    setClaims(prev => prev.filter(c => c.id !== id))
    setConfirmId(null)
    toast.success(`${M.claimDeleteSuccess.en} (${M.claimDeleteSuccess.hi})`)
  }

  const claimToDelete = claims.find(c => c.id === confirmId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {currentUser?.role === 'admin' ? 'All Claims' : 'My Claims'}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {currentUser?.role === 'admin'
            ? `System mein kul ${claims.length} claims`
            : 'Track all your submitted tour bill claims'}
        </p>
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
                  {currentUser?.role === 'admin' && (
                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Submitted By</th>
                  )}
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Purpose</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Site</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Tour Period</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Amount (₹)</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Approved (₹)</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-blue-600 font-medium whitespace-nowrap">
                      {claim.claim_number}
                    </td>
                    {currentUser?.role === 'admin' && (
                      <td className="py-3 px-4 text-gray-700">{claim.submitted_by}</td>
                    )}
                    <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{claim.tour_purpose}</td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{claim.site_name}</td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(claim.tour_from_date), 'dd MMM')} – {format(new Date(claim.tour_to_date), 'dd MMM yy')}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-blue-700">
                      ₹{claim.total_amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {claim.approved_amount != null
                        ? <span className="text-green-700">₹{claim.approved_amount.toLocaleString('en-IN')}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={claim.status as any}
                        remarks={claim.manager_remarks || claim.finance_remarks}
                      />
                    </td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(claim.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* View */}
                        <Link href={`/dashboard/claims/${claim.id}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg text-xs font-medium">
                          <FiEye /> View
                        </Link>

                        {/* Edit — submitted ya on_hold mein allowed (manager ne action nahi liya) */}
                        {['submitted', 'on_hold'].includes(claim.status) && (
                          <Link href={`/dashboard/claims/${claim.id}/edit`}
                            className="inline-flex items-center gap-1 text-orange-600 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg text-xs font-medium">
                            <FiEdit2 /> Edit
                          </Link>
                        )}

                        {/* Delete — sirf admin aur manager ke paas */}
                        {['admin', 'manager'].includes(currentUser?.role || '') && (
                          <button onClick={() => setConfirmId(claim.id)}
                            className="inline-flex items-center gap-1 text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg text-xs font-medium">
                            <FiTrash2 /> Delete
                          </button>
                        )}
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
            <p className="font-medium">No claims yet</p>
            <Link href="/dashboard/claims/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Submit your first claim →
            </Link>
          </div>
        )}
      </div>

      {confirmId && claimToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <FiTrash2 className="text-red-600 text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Claim Delete Karein?</h3>
                <p className="text-sm text-gray-500">Yeh action undo nahi hogi</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-5 space-y-1">
              <p className="text-sm font-semibold text-blue-600">{claimToDelete.claim_number}</p>
              <p className="text-sm text-gray-700">{claimToDelete.tour_purpose}</p>
              <p className="text-sm text-gray-500">₹{claimToDelete.total_amount?.toLocaleString('en-IN')} · {claimToDelete.site_name}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmId)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 text-white">
                Haan, Delete Karein
              </button>
              <button onClick={() => setConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
