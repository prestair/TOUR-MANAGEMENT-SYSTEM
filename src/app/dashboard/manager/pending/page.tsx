'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { format } from 'date-fns'
import {
  FiCheckSquare, FiFileText, FiSearch, FiX,
  FiPrinter, FiDownload, FiEye, FiCalendar, FiMapPin, FiUser, FiMessageSquare, FiCreditCard
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getClaimsByStatus, updateClaimStatus } from '@/lib/claims'
import { getEmployeeIdsByManager } from '@/lib/users'
import { Claim, Attachment, SessionUser } from '@/lib/types'
import { M } from '@/lib/messages'

type ActionType = 'approve' | 'reject' | 'hold'
interface ModalState { type: ActionType; claim: Claim }

function getSession(): SessionUser | null {
  try {
    const raw = document.cookie.split('; ').find(r => r.startsWith('tbms_session='))?.split('=').slice(1).join('=')
    if (!raw) return null
    return JSON.parse(decodeURIComponent(raw))
  } catch { return null }
}

// ─── Documents HTML builder ───────────────────────────────────────────────────
function buildDocsHTML(claim: Claim): string {
  const attachments = claim.attachments || []
  const imgAttachments = attachments.filter(a => a.type.startsWith('image/'))
  const pdfAttachments = attachments.filter(a => a.type === 'application/pdf')

  const pagesHTML = imgAttachments.map((a, i) => `
    <div class="page" ${i > 0 ? 'style="page-break-before:always"' : ''}>
      <div class="page-header">
        <span class="claim-no">${claim.claim_number} · ${claim.submitted_by || ''}</span>
        <span class="doc-name">${a.name}</span>
        <span class="doc-count">${i + 1} / ${attachments.length}</span>
      </div>
      <div class="img-container">
        <img src="${a.base64}" alt="${a.name}" />
      </div>
    </div>`).join('')

  const pdfNote = pdfAttachments.length
    ? `<div class="page" ${imgAttachments.length > 0 ? 'style="page-break-before:always"' : ''}>
        <div class="page-header">
          <span class="claim-no">${claim.claim_number}</span>
          <span class="doc-name">PDF Documents</span>
          <span class="doc-count">${pdfAttachments.length} file(s)</span>
        </div>
        <div style="padding:40px;font-family:Arial,sans-serif">
          ${pdfAttachments.map(a => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px">
              <span style="font-size:22px">📄</span>
              <div>
                <p style="font-size:13px;font-weight:600;color:#111">${a.name}</p>
                <p style="font-size:11px;color:#6b7280">${(a.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>`).join('')}
        </div>
      </div>` : ''

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#fff;font-family:Arial,sans-serif}
    .page{width:100%;min-height:100vh;display:flex;flex-direction:column}
    .page-header{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:#1d4ed8;color:#fff;flex-shrink:0;gap:8px}
    .claim-no{font-size:12px;font-weight:bold;white-space:nowrap}
    .doc-name{font-size:12px;opacity:.85;flex:1;text-align:center;padding:0 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .doc-count{font-size:12px;opacity:.7;white-space:nowrap}
    .img-container{flex:1;display:flex;align-items:center;justify-content:center;padding:16px;background:#f1f5f9}
    .img-container img{max-width:100%;max-height:calc(100vh - 60px);object-fit:contain;display:block;box-shadow:0 2px 16px rgba(0,0,0,.15);background:#fff}
    @media print{.page{min-height:100vh;page-break-after:always}.page:last-child{page-break-after:avoid}}
  </style>
  </head><body>${pagesHTML}${pdfNote}
  ${attachments.length === 0 ? `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial;color:#6b7280;font-size:16px">No documents attached</div>` : ''}
  </body></html>`
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ManagerPendingPage() {
  const [allClaims, setAllClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [approveAmounts, setApproveAmounts] = useState<Record<string, string>>({})
  const [modal, setModal] = useState<ModalState | null>(null)
  const [remarks, setRemarks] = useState('')
  const [viewClaim, setViewClaim] = useState<Claim | null>(null)
  const [previewDoc, setPreviewDoc] = useState<Attachment | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const printFrameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) return

    getClaimsByStatus(['submitted', 'on_hold']).then(async allPending => {
      let visible = allPending

      // Manager sirf apni assigned team ki claims dekhe
      if (session.role !== 'admin' && session.id) {
        const empIds = await getEmployeeIdsByManager(session.id)
        visible = allPending.filter(c => empIds.includes(c.submitted_by_id))
      }

      setAllClaims(visible)
      const defaults: Record<string, string> = {}
      visible.forEach(c => { defaults[c.id] = String(c.total_amount) })
      setApproveAmounts(defaults)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allClaims
    return allClaims.filter(c =>
      (c.submitted_by || '').toLowerCase().includes(q) ||
      c.claim_number.toLowerCase().includes(q) ||
      c.tour_purpose.toLowerCase().includes(q) ||
      (c.site_name || '').toLowerCase().includes(q)
    )
  }, [allClaims, search])

  const userNames = useMemo(() =>
    Array.from(new Set(allClaims.map(c => c.submitted_by).filter(Boolean))), [allClaims])

  // ── Print ──────────────────────────────────────────────────
  const handlePrint = (claim: Claim) => {
    if (!claim.attachments?.length) { toast.error('Koi document attached nahi hai'); return }
    const html = buildDocsHTML(claim)
    const iframe = printFrameRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    doc.open(); doc.write(html); doc.close()
    iframe.onload = () => { iframe.contentWindow?.focus(); iframe.contentWindow?.print() }
  }

  // ── Download PDF ───────────────────────────────────────────
  const handleDownload = async (claim: Claim) => {
    if (!claim.attachments?.length) { toast.error('Koi document attached nahi hai'); return }
    setDownloading(claim.id)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const html = buildDocsHTML(claim)
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;height:1123px'
      document.body.appendChild(iframe)
      const doc = iframe.contentDocument!
      doc.open(); doc.write(html); doc.close()
      await new Promise(r => setTimeout(r, 800))
      await html2pdf().set({
        margin: 0,
        filename: `${claim.claim_number}-documents.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false, width: 794 },
        jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
      }).from(doc.body).save()
      document.body.removeChild(iframe)
      toast.success(`${claim.claim_number}-documents.pdf downloaded!`)
    } catch (err) {
      toast.error('PDF download failed')
    } finally {
      setDownloading(null)
    }
  }

  // ── Open action modal ──────────────────────────────────────
  const openModal = (type: ActionType, claim: Claim) => {
    if (type === 'approve') {
      const amt = parseFloat(approveAmounts[claim.id] || '0')
      if (!amt || amt <= 0) { toast.error(`${M.approveAmtRequired.en} (${M.approveAmtRequired.hi})`); return }
    }
    setModal({ type, claim })
    setRemarks('')
  }

  // ── Confirm action ─────────────────────────────────────────
  const confirmAction = async () => {
    if (!modal) return

    if (modal.type === 'approve') {
      const amt = parseFloat(approveAmounts[modal.claim.id] || '0')
      const { error } = await updateClaimStatus(modal.claim.id, 'manager_approved', {
        approved_amount: amt,
        manager_remarks: remarks,
        manager_approved_at: new Date().toISOString(),
      })
      const m = M.claimApproved(amt)
      if (error) { toast.error(error); return }
      setAllClaims(prev => prev.filter(c => c.id !== modal.claim.id))
      toast.success(`${m.en} (${m.hi})`)
    }

    if (modal.type === 'reject') {
      const { error } = await updateClaimStatus(modal.claim.id, 'manager_rejected', {
        manager_remarks: remarks,
      })
      if (error) { toast.error(error); return }
      setAllClaims(prev => prev.filter(c => c.id !== modal.claim.id))
      toast.error(`${M.claimRejected.en} (${M.claimRejected.hi})`)
    }

    if (modal.type === 'hold') {
      const { error } = await updateClaimStatus(modal.claim.id, 'on_hold', {
        manager_remarks: remarks,
      })
      if (error) { toast.error(error); return }
      setAllClaims(prev => prev.map(c => c.id === modal.claim.id ? { ...c, status: 'on_hold' } : c))
      toast(`${M.claimOnHold.en} (${M.claimOnHold.hi})`, { icon: '⏸️' })
    }

    setModal(null)
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <iframe ref={printFrameRef} className="hidden" title="print-frame" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiCheckSquare className="text-blue-500" /> Manager Approval
          </h1>
          <p className="text-gray-500 mt-0.5">{allClaims.length} claim{allClaims.length !== 1 ? 's' : ''} pending</p>
        </div>
        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, claim no, site..."
            className="input-field pl-9 pr-8 text-sm" list="user-suggestions" />
          <datalist id="user-suggestions">
            {userNames.map(n => <option key={n} value={n} />)}
          </datalist>
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <FiX className="text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-3 text-gray-600 font-medium">Claim No.</th>
                  <th className="text-left py-3 px-3 text-gray-600 font-medium">Submitted By</th>
                  <th className="text-left py-3 px-3 text-gray-600 font-medium">Purpose</th>
                  <th className="text-left py-3 px-3 text-gray-600 font-medium">Site</th>
                  <th className="text-left py-3 px-3 text-gray-600 font-medium">Tour Period</th>
                  <th className="text-right py-3 px-3 text-gray-600 font-medium">Claim (₹)</th>
                  <th className="text-right py-3 px-3 text-gray-600 font-medium">Approve Amt (₹)</th>
                  <th className="text-left py-3 px-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left py-3 px-3 text-gray-600 font-medium">Date</th>
                  <th className="text-center py-3 px-3 text-gray-600 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono text-blue-600 font-medium whitespace-nowrap">{claim.claim_number}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-800 whitespace-nowrap">{claim.submitted_by || '—'}</td>
                    <td className="py-2.5 px-3 text-gray-700 max-w-[130px]">{claim.tour_purpose}</td>
                    <td className="py-2.5 px-3 text-gray-500">{claim.site_name}</td>
                    <td className="py-2.5 px-3 text-gray-500">
                      {format(new Date(claim.tour_from_date), 'dd-MMM-yy')} – {format(new Date(claim.tour_to_date), 'dd-MMM-yy')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                      ₹{claim.total_amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-3">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">₹</span>
                        <input
                          type="number"
                          value={approveAmounts[claim.id] ?? claim.total_amount}
                          onChange={e => setApproveAmounts(prev => ({ ...prev, [claim.id]: e.target.value }))}
                          className="w-28 pl-5 pr-2 py-1.5 border border-green-300 rounded-lg text-sm font-semibold text-green-700 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400 text-right"
                          min="0" step="0.01"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {claim.status === 'on_hold'
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">⏸ On Hold</span>
                        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Pending</span>}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">{format(new Date(claim.created_at), 'dd MMM yy')}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <button onClick={() => setViewClaim(claim)} title="View Details"
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                          <FiEye className="text-sm" />
                        </button>
                        <button onClick={() => openModal('approve', claim)}
                          className="px-2 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200">✓</button>
                        <button onClick={() => openModal('hold', claim)}
                          className="px-2 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-semibold hover:bg-yellow-200">⏸</button>
                        <button onClick={() => openModal('reject', claim)}
                          className="px-2 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200">✕</button>
                        <span className="text-gray-200 text-xs">|</span>
                        <button onClick={() => handlePrint(claim)} title="Print Documents"
                          className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-700 relative">
                          <FiPrinter className="text-sm" />
                          {(claim.attachments?.length ?? 0) > 0 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                              {claim.attachments!.length}
                            </span>
                          )}
                        </button>
                        <button onClick={() => handleDownload(claim)} title="Download PDF"
                          disabled={downloading === claim.id}
                          className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-green-50 hover:text-green-700 disabled:opacity-50 relative">
                          {downloading === claim.id ? <span className="text-[9px]">...</span> : <FiDownload className="text-sm" />}
                          {(claim.attachments?.length ?? 0) > 0 && downloading !== claim.id && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                              {claim.attachments!.length}
                            </span>
                          )}
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
            <p className="font-medium">{search ? `"${search}" ke liye koi claim nahi mila` : 'No pending claims'}</p>
            {search && <button onClick={() => setSearch('')} className="text-blue-600 text-sm mt-2 hover:underline">Clear search</button>}
          </div>
        )}
      </div>

      {/* ── View Claim Modal ── */}
      {viewClaim && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900">{viewClaim.claim_number}</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {viewClaim.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <button onClick={() => setViewClaim(null)} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500">
                <FiX />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <FiUser className="text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-400 text-xs">Submitted By</p>
                    <p className="font-semibold text-gray-800">{viewClaim.submitted_by || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FiCalendar className="text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-400 text-xs">Tour Period</p>
                    <p className="font-semibold text-gray-800">
                      {format(new Date(viewClaim.tour_from_date), 'dd MMM yyyy')} → {format(new Date(viewClaim.tour_to_date), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FiMapPin className="text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-400 text-xs">Site Name</p>
                    <p className="font-semibold text-gray-800">{viewClaim.site_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FiFileText className="text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-400 text-xs">Purpose</p>
                    <p className="font-semibold text-gray-800">{viewClaim.tour_purpose}</p>
                  </div>
                </div>
                {/* Co-workers */}
                {(viewClaim.co_workers || []).filter(cw => cw.name).map((cw, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <FiUser className="text-orange-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-400 text-xs">Co-worker {i + 1}</p>
                      <p className="font-semibold text-gray-800">{cw.name}</p>
                      {cw.father_name && <p className="text-xs text-gray-500">S/o {cw.father_name}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {viewClaim.remarks && (
                <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm">
                  <FiMessageSquare className="text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Remarks</p>
                    <p className="text-gray-700">{viewClaim.remarks}</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiCreditCard className="text-blue-600" />
                  <span className="font-semibold text-blue-800">Total Bill Amount</span>
                </div>
                <span className="text-2xl font-bold text-blue-700">₹{viewClaim.total_amount?.toLocaleString('en-IN')}</span>
              </div>

              {(viewClaim.attachments?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Attached Documents ({viewClaim.attachments!.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {viewClaim.attachments!.map((a, i) => (
                      <div key={i} className="border border-gray-200 rounded-xl overflow-hidden group relative shadow-sm">
                        {a.type.startsWith('image/') ? (
                          <>
                            <img src={a.base64} alt={a.name} className="w-full h-36 object-cover bg-gray-100" />
                            <button onClick={() => setPreviewDoc(a)}
                              className="absolute bottom-8 right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 hover:bg-blue-700 transition-all">
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

              <button onClick={() => setViewClaim(null)}
                className="w-full py-2.5 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Full-screen Preview ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button onClick={() => setPreviewDoc(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center">
            <FiX className="text-xl" />
          </button>
          <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium max-w-xs truncate text-center">
            {previewDoc.name}
          </p>
          <img src={previewDoc.base64} alt={previewDoc.name}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
        </div>
      )}

      {/* ── Action Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl ${
                modal.type === 'approve' ? 'bg-green-100' : modal.type === 'hold' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                {modal.type === 'approve' ? '✅' : modal.type === 'hold' ? '⏸️' : '❌'}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {modal.type === 'approve' ? 'Approve Claim' : modal.type === 'hold' ? 'Put on Hold' : 'Reject Claim'}
                </h3>
                <p className="text-sm text-gray-500">
                  {modal.claim.claim_number} · {modal.claim.submitted_by}
                  {modal.type === 'approve' && (
                    <span className="ml-2 font-semibold text-green-700">
                      ₹{parseFloat(approveAmounts[modal.claim.id] || '0').toLocaleString('en-IN')}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks {modal.type === 'reject' ? <span className="text-red-500">*</span> : <span className="text-gray-400">(Optional)</span>}
              </label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
                className="input-field h-20 resize-none" autoFocus
                placeholder={modal.type === 'reject' ? 'Rejection ka reason...' : modal.type === 'hold' ? 'Hold ka reason...' : 'Koi remarks...'} />
            </div>
            <div className="flex gap-3">
              <button onClick={confirmAction}
                disabled={modal.type === 'reject' && !remarks.trim()}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 ${
                  modal.type === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white'
                  : modal.type === 'hold' ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }`}>
                {modal.type === 'approve' ? 'Confirm Approval' : modal.type === 'hold' ? 'Put on Hold' : 'Confirm Reject'}
              </button>
              <button onClick={() => setModal(null)}
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

