'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FiUsers, FiPlus, FiEdit2, FiTrash2, FiX, FiSave,
  FiEye, FiEyeOff, FiSearch, FiAlertTriangle,
} from 'react-icons/fi'
import { LocalUser, UserRole, ROLE_LABELS } from '@/lib/types'
import { getUsers, addUser, updateUser, deleteUser, usernameExists, roleColors } from '@/lib/users'

const ROLES: UserRole[] = ['employee', 'manager', 'finance', 'admin']

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'employee', label: 'User' },
  { value: 'manager', label: 'Approver' },
  { value: 'finance', label: 'Finance Approver' },
  { value: 'admin', label: 'Admin' },
]

const emptyForm = {
  username: '', password: '', full_name: '',
  role: 'employee' as UserRole,
  department: '', employee_code: '', manager_id: '',
}

function getSessionId(): string {
  try {
    const raw = document.cookie.split('; ').find(r => r.startsWith('tbms_session='))?.split('=').slice(1).join('=')
    if (!raw) return ''
    return JSON.parse(decodeURIComponent(raw))?.id || ''
  } catch { return '' }
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<LocalUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [currentUserId, setCurrentUserId] = useState('')

  const [addModal, setAddModal] = useState(false)
  const [editUser, setEditUser] = useState<LocalUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LocalUser | null>(null)
  const [changePassUser, setChangePassUser] = useState<LocalUser | null>(null)

  const [addForm, setAddForm] = useState({ ...emptyForm })
  const [editForm, setEditForm] = useState({ ...emptyForm })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showAddPass, setShowAddPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [addError, setAddError] = useState('')
  const [editError, setEditError] = useState('')
  const [passError, setPassError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    const data = await getUsers()
    setUsers(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    setCurrentUserId(getSessionId())
    reload()
  }, [reload])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.employee_code || '').toLowerCase().includes(q)
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  const managers = users.filter(u => u.role === 'manager' || u.role === 'admin')

  // ── Add User ──────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    if (!addForm.username.trim()) return setAddError('Username required hai.')
    if (!addForm.password.trim()) return setAddError('Password required hai.')
    if (addForm.password.length < 4) return setAddError('Password kam se kam 4 characters ka ho.')
    const exists = await usernameExists(addForm.username.trim())
    if (exists) return setAddError('Yeh username pehle se exist karta hai.')

    const { error } = await addUser({
      username: addForm.username.trim(),
      password: addForm.password,
      full_name: addForm.full_name.trim() || addForm.username.trim(),
      role: addForm.role,
      department: addForm.department.trim(),
      employee_code: addForm.employee_code.trim(),
      manager_id: addForm.manager_id || null,
      is_active: true,
    })
    if (error) return setAddError(error)
    await reload()
    setAddModal(false)
    setAddForm({ ...emptyForm })
  }

  // ── Edit User ─────────────────────────────────────────────
  const openEdit = (u: LocalUser) => {
    setEditUser(u)
    setEditForm({
      username: u.username, password: '',
      full_name: u.full_name, role: u.role,
      department: u.department || '',
      employee_code: u.employee_code || '',
      manager_id: u.manager_id || '',
    })
    setEditError('')
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setEditError('')
    if (!editForm.username.trim()) return setEditError('Username required hai.')
    const exists = await usernameExists(editForm.username.trim(), editUser.id)
    if (exists) return setEditError('Yeh username kisi aur ke paas hai.')

    const { error } = await updateUser(editUser.id, {
      username: editForm.username.trim(),
      full_name: editForm.full_name.trim() || editForm.username.trim(),
      role: editForm.role,
      department: editForm.department.trim(),
      employee_code: editForm.employee_code.trim(),
      manager_id: editForm.manager_id || null,
    })
    if (error) return setEditError(error)
    await reload()
    setEditUser(null)
  }

  // ── Change Password ───────────────────────────────────────
  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!changePassUser) return
    setPassError('')
    if (newPassword.length < 4) return setPassError('Password kam se kam 4 characters ka ho.')
    if (newPassword !== confirmPassword) return setPassError('Passwords match nahi karte.')

    const { error } = await updateUser(changePassUser.id, { password: newPassword })
    if (error) return setPassError(error)
    await reload()
    setChangePassUser(null)
    setNewPassword('')
    setConfirmPassword('')
  }

  // ── Delete User ───────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await deleteUser(deleteTarget.id)
    if (error) { alert('Delete failed: ' + error); return }
    await reload()
    setDeleteTarget(null)
  }

  // ── Toggle Active/Inactive ────────────────────────────────
  const handleToggleActive = async (u: LocalUser) => {
    const { error } = await updateUser(u.id, { is_active: !u.is_active })
    if (error) { alert('Update failed: ' + error); return }
    await reload()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiUsers className="text-blue-500" /> User Management
          </h1>
          <p className="text-gray-500 mt-1">{users.length} users registered</p>
        </div>
        <button onClick={() => { setAddModal(true); setAddError('') }}
          className="btn-primary flex items-center gap-2">
          <FiPlus /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ROLE_OPTIONS.map(({ value, label }) => (
          <div key={value} className="card text-center py-4">
            <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.role === value).length}</p>
            <span className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block ${roleColors[value]}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9" placeholder="Naam, username, ya emp. code se search..." />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as UserRole | '')}
          className="input-field sm:w-48">
          <option value="">All Roles</option>
          {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">#</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Full Name</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Username</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Role</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Department</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Emp. Code</th>
                <th className="text-center py-3 px-4 text-gray-600 font-medium">Status</th>
                <th className="text-center py-3 px-4 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Koi user nahi mila</td></tr>
              ) : filtered.map((u, i) => {
                const isSelf = u.id === currentUserId
                const isActive = u.is_active !== false
                return (
                  <tr key={u.id} className={`hover:bg-gray-50 ${isSelf ? 'bg-blue-50/40' : ''} ${!isActive ? 'opacity-60' : ''}`}>
                    <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {u.full_name}
                      {isSelf && <span className="ml-2 text-xs text-blue-500">(you)</span>}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-700 font-semibold">{u.username}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{u.department || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{u.employee_code || '-'}</td>
                    {/* Active/Inactive Toggle */}
                    <td className="py-3 px-4 text-center">
                      {!isSelf ? (
                        <button
                          onClick={() => handleToggleActive(u)}
                          title={isActive ? 'Click to deactivate' : 'Click to activate'}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      ) : (
                        <span className="text-xs text-blue-500 font-medium">Active</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(u)} title="Edit"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <FiEdit2 size={14} />
                        </button>
                        <button onClick={() => { setChangePassUser(u); setNewPassword(''); setConfirmPassword(''); setPassError(''); setShowCurrentPass(false) }}
                          title="Change password"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg">
                          <LockIcon size={14} />
                        </button>
                        {!isSelf && (
                          <button onClick={() => setDeleteTarget(u)} title="Delete"
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {addModal && (
        <Modal title="Add New User" icon={<FiPlus />} onClose={() => setAddModal(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name">
                <input value={addForm.full_name} onChange={e => setAddForm({ ...addForm, full_name: e.target.value })}
                  className="input-field" placeholder="e.g. Ramesh Kumar" />
              </Field>
              <Field label="Username" required>
                <input value={addForm.username} onChange={e => setAddForm({ ...addForm, username: e.target.value })}
                  className="input-field" placeholder="e.g. ramesh.kumar" required />
              </Field>
              <Field label="Password" required>
                <div className="relative">
                  <input type={showAddPass ? 'text' : 'password'} value={addForm.password}
                    onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                    className="input-field pr-9" placeholder="Min. 4 characters" required />
                  <button type="button" onClick={() => setShowAddPass(!showAddPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showAddPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
              </Field>
              <Field label="Role" required>
                <select value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value as UserRole, manager_id: '' })}
                  className="input-field">
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </Field>
              <Field label="Employee Code">
                <input value={addForm.employee_code} onChange={e => setAddForm({ ...addForm, employee_code: e.target.value })}
                  className="input-field" placeholder="e.g. EMP042" />
              </Field>
              <Field label="Department">
                <input value={addForm.department} onChange={e => setAddForm({ ...addForm, department: e.target.value })}
                  className="input-field" placeholder="e.g. Sales" />
              </Field>
            </div>
            {(addForm.role === 'employee') && (
              <Field label="Assign Manager">
                <select value={addForm.manager_id} onChange={e => setAddForm({ ...addForm, manager_id: e.target.value })}
                  className="input-field">
                  <option value="">-- Select Manager --</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.username})</option>)}
                </select>
              </Field>
            )}
            {addError && <ErrorMsg msg={addError} />}
            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                <FiPlus /> Create User
              </button>
              <button type="button" onClick={() => setAddModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editUser && (
        <Modal title="Edit User" icon={<FiEdit2 />} onClose={() => setEditUser(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="input-field" required />
              </Field>
              <Field label="Username" required>
                <input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                  className="input-field" required />
              </Field>
              <Field label="Role" required>
                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value as UserRole, manager_id: '' })}
                  className="input-field">
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </Field>
              <Field label="Employee Code">
                <input value={editForm.employee_code} onChange={e => setEditForm({ ...editForm, employee_code: e.target.value })}
                  className="input-field" />
              </Field>
              <div className="col-span-2">
                <Field label="Department">
                  <input value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                    className="input-field" />
                </Field>
              </div>
            </div>
            <Field label="Assign Manager">
              <select value={editForm.manager_id} onChange={e => setEditForm({ ...editForm, manager_id: e.target.value })}
                className="input-field">
                <option value="">-- No Manager --</option>
                {managers.filter(m => m.id !== editUser.id).map(m => (
                  <option key={m.id} value={m.id}>{m.full_name} ({m.username})</option>
                ))}
              </select>
            </Field>
            {editError && <ErrorMsg msg={editError} />}
            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                <FiSave /> Save Changes
              </button>
              <button type="button" onClick={() => setEditUser(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change Password Modal */}
      {changePassUser && (
        <Modal title="Password Management" icon={<LockIcon />} onClose={() => setChangePassUser(null)}>
          <p className="text-sm text-gray-600 mb-4">
            User: <span className="font-semibold">{changePassUser.full_name}</span>
            <span className="ml-2 font-mono text-blue-600">({changePassUser.username})</span>
          </p>

          {/* Current Password Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-500 font-medium mb-2">Current Password</p>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-gray-800 text-sm tracking-wider">
                {showCurrentPass ? changePassUser.password : '•'.repeat(changePassUser.password?.length || 8)}
              </span>
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                {showCurrentPass ? <><FiEyeOff size={13} /> Hide</> : <><FiEye size={13} /> Show</>}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 mb-3">Change Password</p>
            <form onSubmit={handleChangePass} className="space-y-4">
              <Field label="New Password" required>
                <div className="relative">
                  <input type={showNewPass ? 'text' : 'password'} value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="input-field pr-9" placeholder="Min. 4 characters" required />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNewPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm Password" required>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="input-field" placeholder="Password dobara likhein" required />
              </Field>
              {passError && <ErrorMsg msg={passError} />}
              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <FiSave /> Update Password
                </button>
                <button type="button" onClick={() => setChangePassUser(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="User Delete Karein?" icon={<FiAlertTriangle className="text-red-500" />} onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-gray-600 mb-6">
            Kya aap <span className="font-bold">{deleteTarget.full_name}</span>{' '}
            (<span className="font-mono text-blue-600">{deleteTarget.username}</span>) ko delete karna chahte hain?
            Yeh action undo nahi hogi.
          </p>
          <div className="flex gap-3">
            <button onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl font-medium flex items-center justify-center gap-2">
              <FiTrash2 /> Haan, Delete Karo
            </button>
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Small Components ──────────────────────────────────────────

function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function Modal({ title, icon, onClose, children }: {
  title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl my-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">{icon} {title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><FiX /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{msg}</p>
  )
}
