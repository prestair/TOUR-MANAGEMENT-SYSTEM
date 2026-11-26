'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole } from '@/lib/types'
import clsx from 'clsx'
import { useState } from 'react'
import {
  FiHome, FiPlusCircle, FiList, FiCheckSquare,
  FiCreditCard, FiUsers, FiFileText, FiBarChart2,
  FiChevronsLeft, FiChevronsRight
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
  { href: '/dashboard/manager/reports', label: 'Team Reports', icon: <FiBarChart2 />, roles: ['manager', 'admin'] },
  { href: '/dashboard/finance/pending', label: 'Finance Approval', icon: <FiCreditCard />, roles: ['finance', 'admin'] },
  { href: '/dashboard/finance/payout', label: 'Payout', icon: <FiFileText />, roles: ['finance', 'admin'] },
  { href: '/dashboard/admin/users', label: 'User Management', icon: <FiUsers />, roles: ['admin'] },
]

export default function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const filtered = navItems.filter(item => item.roles.includes(role))

  return (
    <aside
      className={clsx(
        'relative bg-blue-900 text-white flex flex-col h-full transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 w-6 h-6 bg-blue-700 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <FiChevronsRight size={13} /> : <FiChevronsLeft size={13} />}
      </button>

      {/* Logo */}
      <div className="p-4 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <FiFileText className="text-lg" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm leading-tight whitespace-nowrap">Tour Bill</p>
              <p className="text-blue-300 text-xs whitespace-nowrap">Management System</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {filtered.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && (pathname ?? '').startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : ''}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              )}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Role Badge */}
      <div className="p-4 border-t border-blue-800">
        {collapsed ? (
          <span className="text-xs text-blue-300 uppercase tracking-wider flex justify-center" title={`Role: ${role}`}>
            {role.charAt(0).toUpperCase()}
          </span>
        ) : (
          <span className="text-xs text-blue-300 uppercase tracking-wider">
            Role: {role}
          </span>
        )}
      </div>
    </aside>
  )
}
