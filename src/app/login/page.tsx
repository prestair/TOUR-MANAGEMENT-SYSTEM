'use client'

import { useState } from 'react'
import { FiUser, FiLock, FiFileText, FiEye, FiEyeOff } from 'react-icons/fi'
import { getUserByUsername } from '@/lib/users'
import { M } from '@/lib/messages'

function setSession(user: {
  id: string; username: string; full_name: string
  role: string; department: string; employee_code: string
}) {
  const data = JSON.stringify(user)
  const expiry = new Date(Date.now() + 8 * 60 * 60 * 1000).toUTCString()
  document.cookie = `tbms_session=${encodeURIComponent(data)}; path=/; expires=${expiry}; SameSite=Lax`
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await getUserByUsername(username.trim())

      if (!user) {
        setError(`${M.loginUserNotFound.en} (${M.loginUserNotFound.hi})`)
        setLoading(false)
        return
      }

      if (user.is_active === false) {
        setError(`${M.loginInactive.en} (${M.loginInactive.hi})`)
        setLoading(false)
        return
      }

      if (user.password !== password) {
        setError(`${M.loginWrongPassword.en} (${M.loginWrongPassword.hi})`)
        setLoading(false)
        return
      }

      // Cookie set karo
      setSession({
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        department: user.department,
        employee_code: user.employee_code,
      })

      // Hard redirect — cache bypass
      window.location.replace('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError(`${M.loginServerError.en} (${M.loginServerError.hi})`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <FiFileText className="text-white text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tour Bill System</h1>
          <p className="text-gray-500 mt-1">Apne account mein sign in karein</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field pl-10"
                placeholder="admin"
                required
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10 pr-10"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error.includes('(') ? (
                <>
                  <p className="text-red-600 font-medium">{error.split('(')[0].trim()}</p>
                  <p className="text-red-500 mt-0.5 hindi text-xs">({error.split('(').slice(1).join('(')}</p>
                </>
              ) : (
                <p className="text-red-600">{error}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Access ke liye administrator se contact karein
        </p>
      </div>
    </div>
  )
}
