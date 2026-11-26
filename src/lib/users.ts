import { supabase } from './supabase/client'
import { LocalUser, UserRole } from './types'

export const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-purple-100 text-purple-700',
  finance: 'bg-yellow-100 text-yellow-700',
  employee: 'bg-blue-100 text-blue-700',
}

// ── Read ──────────────────────────────────────────────────────

export async function getUsers(): Promise<LocalUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) { console.error('getUsers:', error); return [] }

  // Attach manager_ids from user_managers table
  const users = data as LocalUser[]
  if (users.length === 0) return users

  const { data: umData } = await supabase
    .from('user_managers')
    .select('user_id, manager_id')

  const umMap: Record<string, string[]> = {}
  for (const row of (umData || [])) {
    if (!umMap[row.user_id]) umMap[row.user_id] = []
    umMap[row.user_id].push(row.manager_id)
  }

  return users.map(u => ({ ...u, manager_ids: umMap[u.id] || [] }))
}

// Get all employee IDs assigned to a manager
export async function getEmployeeIdsByManager(managerId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_managers')
    .select('user_id')
    .eq('manager_id', managerId)
  if (error) return []
  return (data || []).map(r => r.user_id)
}

// Get manager_ids for a single user
export async function getManagerIdsForUser(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_managers')
    .select('manager_id')
    .eq('user_id', userId)
  return (data || []).map(r => r.manager_id)
}

// Replace all managers for a user
export async function setManagersForUser(
  userId: string,
  managerIds: string[]
): Promise<{ error: string | null }> {
  // Delete existing
  const { error: delError } = await supabase
    .from('user_managers')
    .delete()
    .eq('user_id', userId)
  if (delError) return { error: delError.message }

  // Insert new
  if (managerIds.length > 0) {
    const { error: insError } = await supabase
      .from('user_managers')
      .insert(managerIds.map(mid => ({ user_id: userId, manager_id: mid })))
    if (insError) return { error: insError.message }
  }
  return { error: null }
}

export async function getUserById(id: string): Promise<LocalUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as LocalUser
}

export async function getUserByUsername(username: string): Promise<LocalUser | null> {
  console.log('Searching for username:', username)
  
  const { data, error, status, statusText } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username)
    .limit(1)

  console.log('Supabase response:', { data, error, status, statusText })

  if (error) {
    console.error('getUserByUsername error:', error)
    return null
  }
  if (!data || data.length === 0) {
    console.warn('No user found for username:', username)
    return null
  }
  return data[0] as LocalUser
}

// ── Write ─────────────────────────────────────────────────────

export async function addUser(
  userData: Omit<LocalUser, 'id' | 'created_at'>
): Promise<{ user: LocalUser | null; error: string | null }> {
  const id = `user-${Date.now()}`
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id,
      username: userData.username.trim(),
      password: userData.password,
      full_name: userData.full_name.trim() || userData.username.trim(),
      role: userData.role,
      department: userData.department || '',
      employee_code: userData.employee_code || '',
      manager_id: userData.manager_id || null,
    })
    .select()
    .single()
  if (error) return { user: null, error: error.message }

  // Set multi-managers
  if (userData.manager_ids && userData.manager_ids.length > 0) {
    await setManagersForUser(id, userData.manager_ids)
  }

  return { user: data as LocalUser, error: null }
}

export async function updateUser(
  id: string,
  updates: Partial<Omit<LocalUser, 'id' | 'created_at'>>
): Promise<{ error: string | null }> {
  const payload: Record<string, unknown> = {}
  if (updates.username !== undefined) payload.username = updates.username.trim()
  if (updates.full_name !== undefined) payload.full_name = updates.full_name.trim()
  if (updates.role !== undefined) payload.role = updates.role
  if (updates.department !== undefined) payload.department = updates.department
  if (updates.employee_code !== undefined) payload.employee_code = updates.employee_code
  if (updates.manager_id !== undefined) payload.manager_id = updates.manager_id || null
  if (updates.password !== undefined) payload.password = updates.password

  const { error } = await supabase.from('profiles').update(payload).eq('id', id)
  if (error) return { error: error.message }

  // Update multi-managers if provided
  if (updates.manager_ids !== undefined) {
    const { error: mErr } = await setManagersForUser(id, updates.manager_ids)
    if (mErr) return { error: mErr }
  }

  return { error: null }
}

export async function deleteUser(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function usernameExists(
  username: string,
  excludeId?: string
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
  if (!data) return false
  return data.some(u => u.id !== excludeId)
}
