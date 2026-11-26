'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole } from '@/lib/types'
import clsx from 'clsx'
import {
  FiHome, FiPlusCircle, FiList, FiCheckSquare,
  FiDollarSign, FiUsers, FiFileText, FiBarChart2
} from 'react-icons/fi'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <FiHome />, roles: ['employee', 'manager', 'finance', 'admin'] },
  { href: '/dashboard/claims/new', label: 'Submit Claim', icon: <FiPlusCircle />, roles: ['employee', 'manager', 'finance', 'admin'] },
  { href: '/dashboard/claims/my', label: 'My Claims', icon: <FiList />, roles: ['employee', 'manager', 'finance', 'admin'] },
  { href: '/dashboard/manager/pending', label: 'Manager Approval', icon: <FiCheckSquare />, roles: ['manager', 'admin'] },
  { href: '/dashboard/finance/pending', label: 'Finance Approval', icon: <FiDollarSign />, roles: ['finance', 'admin'] },
  { href: '/dashboard/finance/payout', label: 'Payout', icon: <FiFileText />, roles: ['finance', 'admin'] },
  { href: '/dashboard/reports', label: 'Reports', icon: <FiBarChart2 />, roles: ['manager', 'finance', 'admin'] },
  { href: '/dashboard/admin/users', label: 'User Management', icon: <FiUsers />, roles: ['admin'] },
]

export default function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()

  const filtered = navItems.filter(item => item.roles.includes(role))

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
            <FiFileText className="text-lg" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Tour Bill</p>
            <p className="text-blue-300 text-xs">Management System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filtered.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Role Badge */}
      <div className="p-4 border-t border-blue-800">
        <span className="text-xs text-blue-300 uppercase tracking-wider">
          Role: {role}
        </span>
      </div>
    </aside>
  )
}
