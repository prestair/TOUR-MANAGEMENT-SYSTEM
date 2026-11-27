'use client'

import { Profile } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'
import { FiLogOut, FiUser } from 'react-icons/fi'

export default function Header({ profile }: { profile: Profile | null }) {

  const handleLogout = () => {
    document.cookie = 'tbms_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    window.location.replace('/login')
  }

  const roleLabel = profile?.role ? ROLE_LABELS[profile.role] : ''

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800">
        Tour Bill Management System
      </h2>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
            <FiUser className="text-blue-600" />
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-gray-900">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-gray-400">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
        >
          <FiLogOut />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  )
}
