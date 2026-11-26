'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import StatusBadge from '@/components/StatusBadge'
import { FiCalendar, FiMapPin, FiCreditCard, FiMessageSquare, FiFileText, FiArrowLeft, FiCheckCircle, FiXCircle, FiClock, FiEye } from 'react-icons/fi'
import { getClaimById } from '@/lib/claims'
import { Claim, Attachment } from '@/lib/types'

export default function ClaimDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewDoc, setPreviewDoc] = useState<Attachment | null>(null)

  useEffect(() => {
    if (!params?.id) return
    getClaimById(params.id as string).then(data => {
      setClaim(data)
      setLoading(false)
    })
  }, [params?.id])

  if (loading) return (
    <div className="text-center py-20 text-gray-400">Loading...</div>
  )

  if (!claim) return (
    <div className="text-center py-20 text-gray-400">
      <FiFileText className="text-5xl mx-auto mb-3" />
      <p className="font-medium text-gray-600">Claim not found</p>
      <button onClick={() => router.back()} className="text-blue-600 text-sm mt-3 hover:underline">← Back</button>
    </div>
  )

  const isApproved   = ['manager_approved', 'finance_approved', 'paid'].includes(claim.status)
  const isRejected   = ['manager_rejected', 'finance_rejected'].includes(claim.status)
  const isHold       = claim.status === 'on_hold'
  const isFinance    = ['finance_approved', 'finance_rejected', 'paid'].includes(claim.status)
  const isPaid       = claim.status === 'paid'

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Back + Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()}
          className="mt-1 p-2 hover:bg-gray-100 rounded-lg text-gray-500 flex-shrink-0">
          <FiArrowLeft />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{claim.claim_number}</h1>
            <StatusBadge status={claim.status as any} />
          </div>
          <p className="text-gray-500 mt-0.5">{claim.tour_purpose}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Tour Info */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-800 border-b pb-2">Tour Information</h3>
          <InfoRow icon={<FiCalendar className="text-blue-500" />} label="Tour Period">
            {format(new Date(claim.tour_from_date), 'dd MMM yyyy')} → {format(new Date(claim.tour_to_date), 'dd MMM yyyy')}
          </InfoRow>
          <InfoRow icon={<FiMapPin className="text-green-500" />} label="Site">
            {claim.site_name}
          </InfoRow>
          {claim.sender_name && (
            <InfoRow icon={<FiFileText className="text-purple-500" />} label="Sender Name">
              {claim.sender_name}
            </InfoRow>
          )}
          {claim.remarks && (
            <InfoRow icon={<FiMessageSquare className="text-orange-500" />} label="Remarks">
              {claim.remarks}
            </InfoRow>
          )}
          <div className="text-xs text-gray-400 pt-1">
            Submitted: {format(new Date(claim.created_at), 'dd MMM yyyy, hh:mm a')}
          </div>
        </div>

        {/* Amount Card */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-800 border-b pb-2">Amount Details</h3>

          {/* Claimed Amount */}
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <FiCreditCard className="text-gray-400" /> Claimed Amount
            </span>
            <span className="font-semibold text-gray-800">₹{claim.total_amount?.toLocaleString('en-IN')}</span>
          </div>

          {/* Approved Amount — sirf tab dikho jab manager ya finance ne approve kiya ho */}
          {claim.approved_amount != null && (
            <div className="flex items-center justify-between py-2 px-3 bg-green-50 border border-green-200 rounded-xl">
              <span className="text-sm text-green-700 flex items-center gap-2">
                <FiCheckCircle className="text-green-500" /> Approved Amount
              </span>
              <span className="font-bold text-green-700 text-lg">₹{claim.approved_amount?.toLocaleString('en-IN')}</span>
            </div>
          )}

          {/* Paid */}
          {isPaid && claim.paid_at && (
            <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-sm text-emerald-700">Payment Date</span>
              <span className="font-semibold text-emerald-700">{format(new Date(claim.paid_at), 'dd MMM yyyy')}</span>
            </div>
          )}

          {/* Attachments count */}
          {(claim.attachments?.length ?? 0) > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-500 px-1">
              <span>Documents attached</span>
              <span className="font-medium">{claim.attachments!.length} file{claim.attachments!.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Manager Remarks — hold / reject / approve ke baad */}
        {claim.manager_remarks && (
          <div className={`card border-l-4 ${
            claim.status === 'manager_rejected' ? 'border-red-400 bg-red-50' :
            claim.status === 'on_hold'          ? 'border-yellow-400 bg-yellow-50' :
                                                  'border-green-400 bg-green-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {claim.status === 'manager_rejected' ? <FiXCircle className="text-red-500" /> :
               claim.status === 'on_hold'          ? <FiClock className="text-yellow-500" /> :
                                                     <FiCheckCircle className="text-green-500" />}
              <h3 className="font-semibold text-gray-800 text-sm">Manager Remarks</h3>
            </div>
            <p className="text-sm text-gray-700">{claim.manager_remarks}</p>
            {claim.manager_approved_at && (
              <p className="text-xs text-gray-400 mt-2">
                {format(new Date(claim.manager_approved_at), 'dd MMM yyyy, hh:mm a')}
              </p>
            )}
          </div>
        )}

        {/* Finance Remarks */}
        {claim.finance_remarks && (
          <div className={`card border-l-4 ${
            claim.status === 'finance_rejected' ? 'border-red-400 bg-red-50' : 'border-green-400 bg-green-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {claim.status === 'finance_rejected'
                ? <FiXCircle className="text-red-500" />
                : <FiCheckCircle className="text-green-500" />}
              <h3 className="font-semibold text-gray-800 text-sm">Finance Remarks</h3>
            </div>
            <p className="text-sm text-gray-700">{claim.finance_remarks}</p>
            {claim.finance_approved_at && (
              <p className="text-xs text-gray-400 mt-2">
                {format(new Date(claim.finance_approved_at), 'dd MMM yyyy, hh:mm a')}
              </p>
            )}
          </div>
        )}

        {/* Approval Timeline */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-gray-800 border-b pb-2 mb-4">Approval Timeline</h3>
          <div className="flex flex-col sm:flex-row gap-0">
            <TimelineStep label="Submitted" done status="done" date={claim.created_at} />
            <TimelineStep
              label="Manager Approval"
              done={isApproved || isRejected || isHold || isFinance}
              status={
                claim.status === 'manager_rejected' ? 'rejected' :
                claim.status === 'on_hold'          ? 'hold' :
                isApproved || isFinance              ? 'done' : 'pending'
              }
              date={claim.manager_approved_at || undefined}
            />
            <TimelineStep
              label="Finance Approval"
              done={isFinance}
              status={
                claim.status === 'finance_rejected' ? 'rejected' :
                isFinance                            ? 'done' : 'pending'
              }
              date={claim.finance_approved_at || undefined}
            />
            <TimelineStep
              label="Payment Done"
              done={isPaid}
              status={isPaid ? 'done' : 'pending'}
              date={claim.paid_at || undefined}
              last
            />
          </div>
        </div>

        {/* Attachments */}
        {(claim.attachments?.length ?? 0) > 0 && (
          <div className="card lg:col-span-2">
            <h3 className="font-semibold text-gray-800 border-b pb-2 mb-4">
              Attached Documents ({claim.attachments!.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {claim.attachments!.map((a, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden group relative shadow-sm">
                  {a.type.startsWith('image/') ? (
                    <>
                      <img src={a.base64} alt={a.name} className="w-full h-36 object-cover bg-gray-100" />
                      <button onClick={() => setPreviewDoc(a)}
                        className="absolute bottom-8 right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 hover:bg-blue-700 transition-all">
                        <FiEye className="text-sm" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-36 bg-gray-50 flex flex-col items-center justify-center">
                      <span className="text-4xl">📄</span>
                      <p className="text-xs text-gray-500 mt-2">PDF</p>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-500 p-2 bg-white truncate border-t border-gray-100">{a.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Full-screen image preview */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center">
            ✕
          </button>
          <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm truncate max-w-xs">
            {previewDoc.name}
          </p>
          <img src={previewDoc.base64} alt={previewDoc.name}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}

    </div>
  )
}

// ── Helper Components ─────────────────────────────────────────

function InfoRow({ icon, label, children }: {
  icon: React.ReactNode; label: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="text-gray-800 font-medium">{children}</p>
      </div>
    </div>
  )
}

function TimelineStep({ label, done, status, date, last }: {
  label: string
  done: boolean
  status: 'done' | 'rejected' | 'hold' | 'pending'
  date?: string
  last?: boolean
}) {
  const colors = {
    done:     'bg-green-100 border-green-500 text-green-600',
    rejected: 'bg-red-100 border-red-400 text-red-600',
    hold:     'bg-yellow-100 border-yellow-400 text-yellow-600',
    pending:  'bg-gray-100 border-gray-300 text-gray-400',
  }
  const icons = { done: '✓', rejected: '✕', hold: '⏸', pending: '○' }
  const labelColors = {
    done: 'text-green-700', rejected: 'text-red-600',
    hold: 'text-yellow-600', pending: 'text-gray-400',
  }

  return (
    <div className="flex-1 flex items-start gap-2">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 ${colors[status]}`}>
          {icons[status]}
        </div>
        {!last && <div className="w-0.5 h-6 bg-gray-200 mt-1 sm:hidden" />}
      </div>
      <div className="pb-4">
        <p className={`text-sm font-medium ${labelColors[status]}`}>{label}</p>
        {date && done && (
          <p className="text-xs text-gray-400">{format(new Date(date), 'dd MMM yyyy')}</p>
        )}
      </div>
      {!last && <div className="hidden sm:block flex-1 h-0.5 bg-gray-200 mt-3.5 mx-1" />}
    </div>
  )
}
