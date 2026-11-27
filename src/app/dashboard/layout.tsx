import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('tbms_session')

  if (!sessionCookie) redirect('/login')

  let profile: Profile
  try {
    const userData = JSON.parse(decodeURIComponent(sessionCookie.value))
    profile = {
      id: userData.id || userData.username,
      full_name: userData.full_name,
      email: '',
      username: userData.username,
      role: userData.role,
      department: userData.department || null,
      manager_id: null,
      employee_code: userData.employee_code || null,
      created_at: new Date().toISOString(),
    }
  } catch {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar — hidden on mobile, visible on md+ */}
      <Sidebar role={profile.role} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header profile={profile} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
