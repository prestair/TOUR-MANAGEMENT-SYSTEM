'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FiUsers, FiPlus, FiEdit2, FiTrash2, FiX, FiSave,
  FiEye, FiEyeOff, FiSearch, FiAlertTriangle,
} from 'react-icons/fi'
import { LocalUser, UserRole, ROLE_LABELS } from '@/lib/types'
import { getUsers, addUser, updateUser, deleteUser, usernameExists, roleColors, setManagersForUser, getManagerIdsForUser } from '@/lib/users'
import { M } from '@/lib/messages'
import { ErrorMsg } from '@/components/BiMsg'
import toast from 'react-hot-toast'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'employee', label: 'User' },
  { value: 'manager', label: 'Approver' },
  { value: 'finance', label: 'Finance Approver' },
  { value: 'admin', label: 'Admin' },
]

const emptyForm = {
  username: '', password: '', full_name: '',
  role: 'employee' as UserRole,
  department: '', employee_code: '',
  manager_ids: [] as string[],
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
  const [addErr, setAddErr] = useState<{en:string;hi:string}|null>(null)
  const [editErr, setEditErr] = useState<{en:string;hi:string}|null>(null)
  const [passErr, setPassErr] = useState<{en:string;hi:string}|null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setUsers(await getUsers())
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
    return matchSearch && (!roleFilter || u.role === roleFilter)
  })

  const managers = users.filter(u => u.role === 'manager' || u.role === 'admin')

  const toggleMgr = (ids: string[], mid: string) =>
    ids.includes(mid) ? ids.filter(i => i !== mid) : [...ids, mid]

  // ── Add User ──────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddErr(null)
    if (!addForm.username.trim()) return setAddErr(M.usernameRequired)
    if (!addForm.password.trim()) return setAddErr(M.passwordRequired)
    if (addForm.password.length < 4) return setAddErr(M.passwordTooShort)
    if (await usernameExists(addForm.username.trim())) return setAddErr(M.usernameExists)

    const { user, error } = await addUser({
      username: addForm.username.trim(),
      password: addForm.password,
      full_name: addForm.full_name.trim() || addForm.username.trim(),
      role: addForm.role,
      department: addForm.department.trim(),
      employee_code: addForm.employee_code.trim(),
      manager_id: addForm.manager_ids[0] || null,
      manager_ids: addForm.manager_ids,
      is_active: true,
    })
    if (error) return setAddErr({ en: error, hi: '' })
    if (user && addForm.manager_ids.length > 0) await setManagersForUser(user.id, addForm.manager_ids)
    toast.success(`${M.userCreated.en} · ${M.userCreated.hi}`)
    await reload()
    setAddModal(false)
    setAddForm({ ...emptyForm })
  }

  // ── Edit User ─────────────────────────────────────────────
  const openEdit = async (u: LocalUser) => {
    const managerIds = await getManagerIdsForUser(u.id)
    setEditUser(u)
    setEditForm({
      username: u.username, password: '',
      full_name: u.full_name, role: u.role,
      department: u.department || '',
      employee_code: u.employee_code || '',
      manager_ids: managerIds,
    })
    setEditErr(null)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setEditErr(null)
    if (!editForm.username.trim()) return setEditErr(M.usernameRequired)
    if (await usernameExists(editForm.username.trim(), editUser.id)) return setEditErr(M.usernameExistsOther)

    const { error } = await updateUser(editUser.id, {
      username: editForm.username.trim(),
      full_name: editForm.full_name.trim() || editForm.username.trim(),
      role: editForm.role,
      department: editForm.department.trim(),
      employee_code: editForm.employee_code.trim(),
      manager_id: editForm.manager_ids[0] || null,
    })
    if (error) return setEditErr({ en: error, hi: '' })
    await setManagersForUser(editUser.id, editForm.manager_ids)
    toast.success(`${M.userUpdated.en} · ${M.userUpdated.hi}`)
    await reload()
    setEditUser(null)
  }

  // ── Change Password ───────────────────────────────────────
  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!changePassUser) return
    setPassErr(null)
    if (newPassword.length < 4) return setPassErr(M.passwordTooShort)
    if (newPassword !== confirmPassword) return setPassErr(M.passwordMismatch)

    const { error } = await updateUser(changePassUser.id, { password: newPassword })
    if (error) return setPassErr({ en: error, hi: '' })
    toast.success(`${M.passwordUpdated.en} · ${M.passwordUpdated.hi}`)
    await reload()
    setChangePassUser(null)
    setNewPassword('')
    setConfirmPassword('')
  }

  // ── Delete User ───────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await deleteUser(deleteTarget.id)
    if (error) { toast.error(`${M.userDeleteFail.en} · ${M.userDeleteFail.hi}`); return }
    toast.success(`${M.userDeleted.en} · ${M.userDeleted.hi}`)
    await reload()
    setDeleteTarget(null)
  }

  // ── Toggle Active/Inactive ────────────────────────────────
  const handleToggleActive = async (u: LocalUser) => {
    const newState = u.is_active === false
    const { error } = await updateUser(u.id, { is_active: newState })
    if (error) { toast.error(`${M.userToggleFail.en} · ${M.userToggleFail.hi}`); return }
    const msg = newState ? M.userActivated : M.userDeactivated
    toast.success(`${msg.en} · ${msg.hi}`)
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
        <button onClick={() => { setAddModal(true); setAddErr(null) }}
          className="btn-primary flex items-center gap-2">
          <FiPlus /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ROLE_OPTIONS.map(({ value, label }) => (
          <div key={value} className="card text-center py-4">
            <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.role === value).length}</p>
            <span className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block ${roleColors[value]}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9" placeholder="Search by name, username, emp. code..." />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as UserRole | '')} className="input-field sm:w-48">
          <option value="">All Roles</option>
          {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        {loading ? <div className="text-center py-16 text-gray-400">Loading...</div> : (
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['#','Full Name','Username','Role','Department','Emp. Code','Status','Actions'].map(h => (
                  <th key={h} className={`py-3 px-4 text-gray-600 font-medium ${h === 'Actions' || h === 'Status' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No users found</td></tr>
              ) : filtered.map((u, i) => {
                const isSelf = u.id === currentUserId
                const isActive = u.is_active !== false
                return (
                  <tr key={u.id} className={`hover:bg-gray-50 ${isSelf ? 'bg-blue-50/40' : ''} ${!isActive ? 'opacity-55' : ''}`}>
                    <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {u.full_name}{isSelf && <span className="ml-2 text-xs text-blue-500">(you)</span>}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-700 font-semibold">{u.username}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{u.department || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{u.employee_code || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      {!isSelf ? (
                        <button onClick={() => handleToggleActive(u)}
                          title={isActive ? 'Deactivate user' : 'Activate user'}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      ) : <span className="text-xs text-blue-500">Active</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(u)} title="Edit" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><FiEdit2 size={14} /></button>
                        <button onClick={() => { setChangePassUser(u); setNewPassword(''); setConfirmPassword(''); setPassErr(null); setShowCurrentPass(false) }}
                          title="Change password" className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><LockIcon size={14} /></button>
                        {!isSelf && <button onClick={() => setDeleteTarget(u)} title="Delete" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add Modal ── */}
      {addModal && (
        <Modal title="Add New User" icon={<FiPlus />} onClose={() => setAddModal(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name"><input value={addForm.full_name} onChange={e => setAddForm({...addForm, full_name: e.target.value})} className="input-field" placeholder="e.g. Ramesh Kumar" /></Field>
              <Field label="Username" required><input value={addForm.username} onChange={e => setAddForm({...addForm, username: e.target.value})} className="input-field" placeholder="e.g. ramesh.kumar" required /></Field>
              <Field label="Password" required>
                <div className="relative">
                  <input type={showAddPass ? 'text' : 'password'} value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} className="input-field pr-9" placeholder="Min. 4 characters" required />
                  <button type="button" onClick={() => setShowAddPass(!showAddPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showAddPass ? <FiEyeOff size={14}/> : <FiEye size={14}/>}</button>
                </div>
              </Field>
              <Field label="Role" required>
                <select value={addForm.role} onChange={e => setAddForm({...addForm, role: e.target.value as UserRole, manager_ids: []})} className="input-field">
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </Field>
              <Field label="Employee Code"><input value={addForm.employee_code} onChange={e => setAddForm({...addForm, employee_code: e.target.value})} className="input-field" placeholder="e.g. EMP042" /></Field>
              <Field label="Department"><input value={addForm.department} onChange={e => setAddForm({...addForm, department: e.target.value})} className="input-field" placeholder="e.g. Sales" /></Field>
            </div>
            <Field label="Assign Managers (multiple allowed)">
              <div className="border border-gray-200 rounded-xl p-3 space-y-2 max-h-36 overflow-y-auto">
                {managers.length === 0 ? <p className="text-xs text-gray-400">No managers available</p> :
                  managers.map(m => (
                    <label key={m.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1">
                      <input type="checkbox" checked={addForm.manager_ids.includes(m.id)} onChange={() => setAddForm({...addForm, manager_ids: toggleMgr(addForm.manager_ids, m.id)})} className="rounded text-blue-600" />
                      <span className="text-sm text-gray-700">{m.full_name}</span>
                      <span className="text-xs text-gray-400">({m.username})</span>
                    </label>
                  ))}
              </div>
              {addForm.manager_ids.length > 0 && <p className="text-xs text-blue-600 mt-1">{addForm.manager_ids.length} manager(s) selected</p>}
            </Field>
            {addErr && <ErrorMsg en={addErr.en} hi={addErr.hi} />}
            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2"><FiPlus /> Create User</button>
              <button type="button" onClick={() => setAddModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editUser && (
        <Modal title="Edit User" icon={<FiEdit2 />} onClose={() => setEditUser(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name" required><input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="input-field" required /></Field>
              <Field label="Username" required><input value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} className="input-field" required /></Field>
              <Field label="Role" required>
                <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value as UserRole, manager_ids: []})} className="input-field">
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </Field>
              <Field label="Employee Code"><input value={editForm.employee_code} onChange={e => setEditForm({...editForm, employee_code: e.target.value})} className="input-field" /></Field>
              <div className="col-span-2"><Field label="Department"><input value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} className="input-field" /></Field></div>
            </div>
            <Field label="Assign Managers (multiple allowed)">
              <div className="border border-gray-200 rounded-xl p-3 space-y-2 max-h-36 overflow-y-auto">
                {managers.filter(m => m.id !== editUser.id).map(m => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1">
                    <input type="checkbox" checked={editForm.manager_ids.includes(m.id)} onChange={() => setEditForm({...editForm, manager_ids: toggleMgr(editForm.manager_ids, m.id)})} className="rounded text-blue-600" />
                    <span className="text-sm text-gray-700">{m.full_name}</span>
                    <span className="text-xs text-gray-400">({m.username})</span>
                  </label>
                ))}
              </div>
              {editForm.manager_ids.length > 0 && <p className="text-xs text-blue-600 mt-1">{editForm.manager_ids.length} manager(s) selected</p>}
            </Field>
            {editErr && <ErrorMsg en={editErr.en} hi={editErr.hi} />}
            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2"><FiSave /> Save Changes</button>
              <button type="button" onClick={() => setEditUser(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Change Password Modal ── */}
      {changePassUser && (
        <Modal title="Change Password" icon={<LockIcon />} onClose={() => setChangePassUser(null)}>
          <p className="text-sm text-gray-600 mb-4">
            User: <span className="font-semibold">{changePassUser.full_name}</span>
            <span className="ml-2 font-mono text-blue-600">({changePassUser.username})</span>
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-500 font-medium mb-2">Current Password</p>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-gray-800 text-sm">{showCurrentPass ? changePassUser.password : '•'.repeat(changePassUser.password?.length || 8)}</span>
              <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium">
                {showCurrentPass ? <><FiEyeOff size={13}/> Hide</> : <><FiEye size={13}/> Show</>}
              </button>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <form onSubmit={handleChangePass} className="space-y-4">
              <Field label="New Password" required>
                <div className="relative">
                  <input type={showNewPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field pr-9" placeholder="Min. 4 characters" required />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showNewPass ? <FiEyeOff size={14}/> : <FiEye size={14}/>}</button>
                </div>
              </Field>
              <Field label="Confirm New Password" required>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field" placeholder="Re-enter new password" required />
              </Field>
              {passErr && <ErrorMsg en={passErr.en} hi={passErr.hi} />}
              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2"><FiSave /> Update Password</button>
                <button type="button" onClick={() => setChangePassUser(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <Modal title="Delete User?" icon={<FiAlertTriangle className="text-red-500" />} onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-gray-700 mb-1">
            Are you sure you want to delete <span className="font-bold">{deleteTarget.full_name}</span>? This action cannot be undone.
          </p>
          <p className="text-sm mb-6 hindi text-gray-500">
            क्या आप <span className="font-bold">{deleteTarget.full_name}</span> को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं होगी।
          </p>
          <div className="flex gap-3">
            <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl font-medium flex items-center justify-center gap-2">
              <FiTrash2 /> Yes, Delete
            </button>
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function Modal({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
      {children}
    </div>
  )
}
