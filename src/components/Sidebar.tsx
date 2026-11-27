'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole, ROLE_LABELS } from '@/lib/types'
import clsx from 'clsx'
import { useState } from 'react'
import {
  FiHome, FiCheckSquare,
  FiCreditCard, FiUsers, FiFileText, FiBarChart2,
  FiChevronsLeft, FiChevronsRight, FiMenu, FiX
} from 'react-icons/fi'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { href: '/dashboard',                  label: 'Dashboard',        icon: <FiHome />,        roles: ['employee','manager','finance','admin'] },
  { href: '/dashboard/manager/pending',  label: 'Approvals',        icon: <FiCheckSquare />, roles: ['manager','admin'] },
  { href: '/dashboard/manager/reports',  label: 'Team Reports',     icon: <FiBarChart2 />,   roles: ['manager','admin'] },
  { href: '/dashboard/finance/pending',  label: 'Finance Approval', icon: <FiCreditCard />,  roles: ['finance','admin'] },
  { href: '/dashboard/finance/payout',   label: 'Payout',           icon: <FiFileText />,    roles: ['finance','admin'] },
  { href: '/dashboard/admin/users',      label: 'Users',            icon: <FiUsers />,       roles: ['admin'] },
]

export default function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const filtered = navItems.filter(item => item.roles.includes(role))

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {filtered.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== '/dashboard' && (pathname ?? '').startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
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
    </>
  )

  return (
    <>
      {/* ── Desktop Sidebar (md+) ── */}
      <aside className={clsx(
        'hidden md:flex flex-col h-full bg-blue-900 text-white relative transition-all duration-300',
        collapsed ? 'w-16' : 'w-56'
      )}>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-10 w-6 h-6 bg-blue-700 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
        >
          {collapsed ? <FiChevronsRight size={13} /> : <FiChevronsLeft size={13} />}
        </button>

        {/* Logo */}
        <div className="p-4 border-b border-blue-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <FiFileText size={16} />
          </div>
          {!collapsed && (
            <div>
              <p className="font-bold text-xs leading-tight">Tour Bill</p>
              <p className="text-blue-300 text-[10px]">Management System</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* Role badge */}
        <div className="p-3 border-t border-blue-800 text-center">
          {collapsed
            ? <span className="text-[10px] text-blue-300 uppercase" title={ROLE_LABELS[role]}>{role.charAt(0).toUpperCase()}</span>
            : <span className="text-[10px] text-blue-300 uppercase tracking-wider">{ROLE_LABELS[role]}</span>
          }
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-blue-900 text-white flex items-center justify-between px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <FiFileText size={14} />
          </div>
          <span className="font-bold text-sm">Tour Bill</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-1.5 hover:bg-blue-800 rounded-lg">
          <FiMenu size={20} />
        </button>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />

          {/* Drawer */}
          <div className="relative w-64 bg-blue-900 text-white flex flex-col h-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-blue-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FiFileText size={15} />
                </div>
                <div>
                  <p className="font-bold text-sm">Tour Bill</p>
                  <p className="text-blue-300 text-xs">Management System</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-blue-800 rounded-lg">
                <FiX size={18} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              <NavLinks onClick={() => setMobileOpen(false)} />
            </nav>

            {/* Role */}
            <div className="p-4 border-t border-blue-800">
              <span className="text-xs text-blue-300 uppercase tracking-wider">{ROLE_LABELS[role]}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
