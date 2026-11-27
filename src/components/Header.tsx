'use client'

import { Profile, ROLE_LABELS } from '@/lib/types'
import { FiLogOut, FiUser, FiPlusCircle } from 'react-icons/fi'
import Link from 'next/link'

export default function Header({ profile }: { profile: Profile | null }) {

  const handleLogout = () => {
    document.cookie = 'tbms_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    window.location.replace('/login')
  }

  const roleLabel = profile?.role ? ROLE_LABELS[profile.role] : ''

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      {/* Left — Welcome */}
      <div>
        <p className="text-xs text-gray-400">Welcome Back,</p>
        <p className="text-base font-bold text-gray-900">{profile?.full_name || 'User'}</p>
      </div>

      {/* Right — New Claim + User + Logout */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/claims/new"
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <FiPlusCircle size={15} /> New Claim
        </Link>

        <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <FiUser className="text-blue-600" size={15} />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-800 leading-tight">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-gray-400 leading-tight">{roleLabel}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
        >
          <FiLogOut size={15} />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  )
}
