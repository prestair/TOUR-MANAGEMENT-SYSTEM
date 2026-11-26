'use client'

import { useEffect, useState } from 'react'
import { FiFileText, FiClock, FiCheckCircle, FiDollarSign, FiTrendingUp, FiPlusCircle } from 'react-icons/fi'
import Link from 'next/link'

interface Claim {
  id: string
  status: string
  total_amount: number
  submitted_by_id?: string
  submitted_by?: string
}

interface CurrentUser {
  id: string
  full_name: string
  role: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0, totalAmount: 0 })

  useEffect(() => {
    // Current user
    try {
      const raw = localStorage.getItem('tbms_user')
      if (raw) {
        const u = JSON.parse(raw)
        setUser({ id: u.id || u.username, full_name: u.full_name || u.username, role: u.role })
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!user) return
    try {
      const all: Claim[] = JSON.parse(localStorage.getItem('tbms_claims') || '[]')

      // User ke hisaab se filter
      const mine = user.role === 'admin'
        ? all
        : all.filter(c =>
            c.submitted_by_id === user.id ||
            (!c.submitted_by_id && c.submitted_by === user.full_name)
          )

      setStats({
        total: mine.length,
        pending: mine.filter(c => ['submitted', 'on_hold', 'manager_approved'].includes(c.status)).length,
        paid: mine.filter(c => c.status === 'paid').length,
        totalAmount: mine.reduce((sum, c) => sum + (c.total_amount || 0), 0),
      })
    } catch { /* ignore */ }
  }, [user])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, {user?.full_name || '...'} 👋
        </h1>
        <p className="text-gray-500 mt-1 capitalize">
          {user?.role} · Tour Bill Management System
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FiFileText className="text-blue-600 text-xl" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Claims</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <FiClock className="text-yellow-600 text-xl" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <FiCheckCircle className="text-green-600 text-xl" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.paid}</p>
            <p className="text-sm text-gray-500">Paid</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <FiDollarSign className="text-purple-600 text-xl" />
          </div>
          <div>
            <p className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString('en-IN')}</p>
            <p className="text-sm text-gray-500">Total Amount</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <FiTrendingUp className="text-blue-500" /> Quick Actions
        </h3>
        <div className="flex gap-3 flex-wrap">
          <Link href="/dashboard/claims/new" className="btn-primary flex items-center gap-2">
            <FiPlusCircle /> Submit New Claim
          </Link>
          <Link href="/dashboard/claims/my" className="btn-secondary flex items-center gap-2">
            <FiFileText /> {user?.role === 'admin' ? 'All Claims' : 'My Claims'}
          </Link>
        </div>
      </div>

      {/* Recent Claims */}
      <RecentClaims user={user} />
    </div>
  )
}

function RecentClaims({ user }: { user: CurrentUser | null }) {
  const [recent, setRecent] = useState<Claim[]>([])

  useEffect(() => {
    if (!user) return
    try {
      const all = JSON.parse(localStorage.getItem('tbms_claims') || '[]')
      const mine = user.role === 'admin'
        ? all
        : all.filter((c: Claim) =>
            c.submitted_by_id === user.id ||
            (!c.submitted_by_id && (c as any).submitted_by === user.full_name)
          )
      setRecent(mine.slice(0, 5))
    } catch { /* ignore */ }
  }, [user])

  const statusLabel: Record<string, string> = {
    submitted: 'Pending', on_hold: 'On Hold',
    manager_approved: 'Manager Approved', manager_rejected: 'Rejected',
    finance_approved: 'Finance Approved', finance_rejected: 'Finance Rejected', paid: 'Paid',
  }
  const statusColor: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700', on_hold: 'bg-yellow-100 text-yellow-700',
    manager_approved: 'bg-purple-100 text-purple-700', manager_rejected: 'bg-red-100 text-red-700',
    finance_approved: 'bg-green-100 text-green-700', finance_rejected: 'bg-red-100 text-red-700',
    paid: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <FiFileText className="text-blue-500" /> Recent Claims
        </h3>
        <Link href="/dashboard/claims/my" className="text-sm text-blue-600 hover:underline">View all</Link>
      </div>
      {recent.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <FiFileText className="text-4xl mx-auto mb-2" />
          <p>No claims yet</p>
          <Link href="/dashboard/claims/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            Submit your first claim →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 border border-gray-100">
              <div>
                <p className="font-mono text-sm text-blue-600 font-semibold">{c.claim_number}</p>
                <p className="text-sm text-gray-700">{c.tour_purpose}</p>
                <p className="text-xs text-gray-400">{c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : ''}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">₹{(c.total_amount || 0).toLocaleString('en-IN')}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[c.status] || 'bg-gray-100 text-gray-600'}`}>
                  {statusLabel[c.status] || c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
