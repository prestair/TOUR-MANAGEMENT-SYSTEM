export type UserRole = 'employee' | 'manager' | 'finance' | 'admin'

export type ClaimStatus =
  | 'submitted'
  | 'on_hold'
  | 'manager_approved'
  | 'manager_rejected'
  | 'finance_approved'
  | 'finance_rejected'
  | 'paid'

// User model (Supabase profiles table)
export interface LocalUser {
  id: string
  username: string
  password: string
  full_name: string
  role: UserRole
  department: string
  employee_code: string
  manager_id: string | null       // legacy single manager (kept for compatibility)
  manager_ids?: string[]          // multi-manager (from user_managers table)
  created_at: string
}

// Session stored in cookie (password excluded)
export interface SessionUser {
  id: string
  username: string
  full_name: string
  role: UserRole
  department: string
  employee_code: string
}

// Claim model (Supabase claims table)
export interface Claim {
  id: string
  claim_number: string
  submitted_by: string
  submitted_by_id: string
  sender_name: string
  tour_purpose: string
  tour_from_date: string
  tour_to_date: string
  site_name: string
  total_amount: number
  approved_amount: number | null
  status: ClaimStatus
  remarks: string
  manager_remarks: string
  manager_approved_at: string | null
  finance_remarks: string
  finance_approved_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  // Joined
  co_workers?: CoWorker[]
  attachments?: Attachment[]
}

export interface CoWorker {
  id?: string
  claim_id?: string
  name: string
  father_name: string
}

export interface Attachment {
  id?: string
  claim_id?: string
  name: string
  type: string
  size: number
  base64: string
}

// Legacy Profile (dashboard layout ke liye)
export interface Profile {
  id: string
  full_name: string
  email: string
  username: string | null
  role: UserRole
  department: string | null
  manager_id: string | null
  employee_code: string | null
  created_at: string
}
