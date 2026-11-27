'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { format } from 'date-fns'
import { FiBarChart2, FiFileText, FiSearch, FiX, FiEye } from 'react-icons/fi'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { getClaimsByEmployeeIds } from '@/lib/claims'
import { getEmployeeIdsByManager, getUsers } from '@/lib/users'
import { Claim, SessionUser, ClaimStatus } from '@/lib/types'

function getSession(): SessionUser | null {
  try {
    const raw = document.cookie.split('; ').find(r => r.startsWith('tbms_session='))?.split('=').slice(1).join('=')
    if (!raw) return null
    return JSON.parse(decodeURIComponent(raw))
  } catch { return null }
}

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Pending', on_hold: 'On Hold',
  manager_approved: 'Approved', manager_rejected: 'Rejected',
  finance_approved: 'Finance Approved', finance_rejected: 'Finance Rejected', paid: 'Paid',
}

const REPORT_STATUSES: ClaimStatus[] = [
  'manager_approved', 'manager_rejected', 'on_hold',
  'finance_approved', 'finance_rejected', 'paid', 'submitted',
]

// Highlight matching text
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark>
          : part
      )}
    </>
  )
}

export default function ManagerReportsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [empNames, setEmpNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  // Filter bar — employee + site only
  const [empFilter, setEmpFilter] = useState('')
  const [siteFilter, setSiteFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | ''>('')

  // Ctrl+F find bar
  const [findQuery, setFindQuery] = useState('')
  const [showFind, setShowFind] = useState(false)
  const findRef = useRef<HTMLInputElement>(null)

  // Keyboard listener for Ctrl+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setShowFind(true)
        setTimeout(() => findRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setShowFind(false)
        setFindQuery('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const load = useCallback(async () => {
    const session = getSession()
    if (!session) return
    const isAdmin = session.role === 'admin'

    let empIds: string[] = []
    if (isAdmin) {
      const allUsers = await getUsers()
      empIds = allUsers.map(u => u.id)
    } else {
      empIds = await getEmployeeIdsByManager(session.id)
    }

    const allUsers = await getUsers()
    const nameMap: Record<string, string> = {}
    allUsers.filter(u => empIds.includes(u.id)).forEach(u => { nameMap[u.id] = u.full_name })
    setEmpNames(nameMap)

    const data = await getClaimsByEmployeeIds(empIds, REPORT_STATUSES)
    setClaims(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Filter — employee + site only
  const filtered = useMemo(() => {
    return claims.filter(c => {
      const matchEmp = !empFilter || c.submitted_by_id === empFilter
      const matchSite = !siteFilter || c.site_name.toLowerCase().includes(siteFilter.toLowerCase())
      const matchStatus = !statusFilter || c.status === statusFilter
      return matchEmp && matchSite && matchStatus
    })
  }, [claims, empFilter, siteFilter, statusFilter])

  // Unique sites for dropdown
  const uniqueSites = useMemo(() =>
    Array.from(new Set(claims.map(c => c.site_name).filter(Boolean))).sort()
  , [claims])

  const uniqueEmps = Object.entries(empNames)

  // Stats
  const stats = useMemo(() => ({
    total: filtered.length,
    approved: filtered.filter(c => ['manager_approved', 'finance_approved', 'paid'].includes(c.status)).length,
    rejected: filtered.filter(c => ['manager_rejected', 'finance_rejected'].includes(c.status)).length,
    hold: filtered.filter(c => c.status === 'on_hold').length,
    totalAmt: filtered.filter(c => ['manager_approved', 'finance_approved', 'paid'].includes(c.status))
      .reduce((s, c) => s + (c.approved_amount ?? c.total_amount ?? 0), 0),
  }), [filtered])

  return (
    <div className="space-y-5">

      {/* Ctrl+F Find Bar */}
      {showFind && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-yellow-300 shadow-xl rounded-xl px-4 py-3 flex items-center gap-3 min-w-[300px]">
          <FiSearch className="text-yellow-500 flex-shrink-0" />
          <input
            ref={findRef}
            value={findQuery}
            onChange={e => setFindQuery(e.target.value)}
            className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400"
            placeholder="Table mein dhundho..."
          />
          {findQuery && (
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {filtered.filter(c =>
                Object.values(c).some(v => String(v ?? '').toLowerCase().includes(findQuery.toLowerCase()))
              ).length} results
            </span>
          )}
          <button onClick={() => { setShowFind(false); setFindQuery('') }}
            className="text-gray-400 hover:text-gray-600">
            <FiX />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiBarChart2 className="text-blue-500" /> Team Reports
          </h1>
          <p className="text-gray-500 mt-0.5">Apni team ke sabhi claims ki report · <span className="text-xs text-gray-400">Ctrl+F se table mein search karein</span></p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card border-l-4 border-blue-500 py-3">
          <p className="text-2xl font-bold text-blue-700">{loading ? '—' : stats.total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Claims</p>
        </div>
        <div className="card border-l-4 border-green-500 py-3">
          <p className="text-2xl font-bold text-green-700">{loading ? '—' : stats.approved}</p>
          <p className="text-xs text-gray-500 mt-0.5">Approved</p>
        </div>
        <div className="card border-l-4 border-red-400 py-3">
          <p className="text-2xl font-bold text-red-600">{loading ? '—' : stats.rejected}</p>
          <p className="text-xs text-gray-500 mt-0.5">Rejected</p>
        </div>
        <div className="card border-l-4 border-yellow-400 py-3">
          <p className="text-2xl font-bold text-yellow-600">{loading ? '—' : stats.hold}</p>
          <p className="text-xs text-gray-500 mt-0.5">On Hold</p>
        </div>
        <div className="card border-l-4 border-purple-500 py-3">
          <p className="text-lg font-bold text-purple-700">{loading ? '—' : `₹${stats.totalAmt.toLocaleString('en-IN')}`}</p>
          <p className="text-xs text-gray-500 mt-0.5">Approved Amount</p>
        </div>
      </div>

      {/* Filters — Employee + Site + Status */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} className="input-field sm:w-48 text-sm">
          <option value="">All Employees</option>
          {uniqueEmps.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select value={siteFilter} onChange={e => setSiteFilter(e.target.value)} className="input-field sm:w-48 text-sm">
          <option value="">All Sites</option>
          {uniqueSites.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ClaimStatus | '')} className="input-field sm:w-44 text-sm">
          <option value="">All Status</option>
          {REPORT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        {(empFilter || siteFilter || statusFilter) && (
          <button onClick={() => { setEmpFilter(''); setSiteFilter(''); setStatusFilter('') }}
            className="text-sm text-red-500 hover:underline flex items-center gap-1">
            <FiX size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FiFileText className="text-5xl mx-auto mb-3" />
            <p className="font-medium">Koi claim nahi mila</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Claim No.</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Employee</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Purpose</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Site</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Tour Period</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Claimed (₹)</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Approved (₹)</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(claim => (
                  <tr key={claim.id} className={`hover:bg-gray-50 ${
                    findQuery && Object.values(claim).some(v =>
                      String(v ?? '').toLowerCase().includes(findQuery.toLowerCase())
                    ) ? 'bg-yellow-50' : ''
                  }`}>
                    <td className="py-3 px-4 font-mono text-blue-600 font-medium whitespace-nowrap">
                      <Highlight text={claim.claim_number} query={findQuery} />
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">
                      <Highlight text={claim.submitted_by || '—'} query={findQuery} />
                    </td>
                    <td className="py-3 px-4 text-gray-700 max-w-[140px] truncate">
                      <Highlight text={claim.tour_purpose} query={findQuery} />
                    </td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      <Highlight text={claim.site_name} query={findQuery} />
                    </td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(claim.tour_from_date), 'dd MMM')} – {format(new Date(claim.tour_to_date), 'dd MMM yy')}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">₹{claim.total_amount?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {claim.approved_amount != null
                        ? <span className="text-green-700">₹{claim.approved_amount.toLocaleString('en-IN')}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={claim.status} remarks={claim.manager_remarks || claim.finance_remarks} />
                    </td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap text-xs">
                      {format(new Date(claim.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link href={`/dashboard/claims/${claim.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg text-xs font-medium">
                        <FiEye /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              {filtered.length} claim{filtered.length !== 1 ? 's' : ''} shown
              {(empFilter || siteFilter || statusFilter) && ` (filtered from ${claims.length})`}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
