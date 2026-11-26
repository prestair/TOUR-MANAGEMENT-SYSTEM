import { supabase } from './supabase/client'
import { Claim, CoWorker, Attachment, ClaimStatus } from './types'

// ── Helpers ───────────────────────────────────────────────────

async function attachExtras(claims: Claim[]): Promise<Claim[]> {
  if (claims.length === 0) return []
  const ids = claims.map(c => c.id)

  const [cwRes, attRes] = await Promise.all([
    supabase.from('claim_coworkers').select('*').in('claim_id', ids),
    supabase.from('claim_attachments').select('*').in('claim_id', ids),
  ])

  return claims.map(c => ({
    ...c,
    co_workers: (cwRes.data || []).filter(cw => cw.claim_id === c.id),
    attachments: (attRes.data || []).filter(a => a.claim_id === c.id),
  }))
}

// ── Read ──────────────────────────────────────────────────────

export async function getAllClaims(): Promise<Claim[]> {
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('getAllClaims:', error); return [] }
  return attachExtras(data as Claim[])
}

export async function getClaimsByUser(userId: string): Promise<Claim[]> {
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .eq('submitted_by_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('getClaimsByUser:', error); return [] }
  return attachExtras(data as Claim[])
}

export async function getClaimById(id: string): Promise<Claim | null> {
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  const [full] = await attachExtras([data as Claim])
  return full
}

export async function getClaimsByStatus(statuses: ClaimStatus[]): Promise<Claim[]> {
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .in('status', statuses)
    .order('created_at', { ascending: false })
  if (error) { console.error('getClaimsByStatus:', error); return [] }
  return attachExtras(data as Claim[])
}

// ── Create ────────────────────────────────────────────────────

export async function createClaim(
  claimData: {
    submitted_by: string
    submitted_by_id: string
    sender_name: string
    tour_purpose: string
    tour_from_date: string
    tour_to_date: string
    site_name: string
    total_amount: number
    remarks: string
    co_workers: CoWorker[]
    attachments: Attachment[]
  }
): Promise<{ claim: Claim | null; error: string | null }> {
  const id = `claim-${Date.now()}`
  const claim_number = `TBC-${Date.now().toString().slice(-8)}`

  const { data, error } = await supabase
    .from('claims')
    .insert({
      id,
      claim_number,
      submitted_by: claimData.submitted_by,
      submitted_by_id: claimData.submitted_by_id,
      sender_name: claimData.sender_name,
      tour_purpose: claimData.tour_purpose,
      tour_from_date: claimData.tour_from_date,
      tour_to_date: claimData.tour_to_date,
      site_name: claimData.site_name,
      total_amount: claimData.total_amount,
      remarks: claimData.remarks,
      status: 'submitted',
    })
    .select()
    .single()

  if (error) return { claim: null, error: error.message }

  // Co-workers insert
  const validCoWorkers = claimData.co_workers.filter(cw => cw.name.trim())
  if (validCoWorkers.length > 0) {
    await supabase.from('claim_coworkers').insert(
      validCoWorkers.map(cw => ({ claim_id: id, name: cw.name, father_name: cw.father_name }))
    )
  }

  // Attachments insert
  if (claimData.attachments.length > 0) {
    await supabase.from('claim_attachments').insert(
      claimData.attachments.map(a => ({
        claim_id: id,
        name: a.name,
        type: a.type,
        size: a.size,
        base64: a.base64,
      }))
    )
  }

  const [full] = await attachExtras([data as Claim])
  return { claim: full, error: null }
}

// ── Update ────────────────────────────────────────────────────

export async function updateClaimStatus(
  id: string,
  status: ClaimStatus,
  extra?: {
    approved_amount?: number
    manager_remarks?: string
    finance_remarks?: string
    paid_at?: string
    manager_approved_at?: string
    finance_approved_at?: string
  }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('claims')
    .update({ status, ...extra })
    .eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function updateClaimFull(
  id: string,
  claimData: {
    sender_name: string
    tour_purpose: string
    tour_from_date: string
    tour_to_date: string
    site_name: string
    total_amount: number
    remarks: string
    co_workers: CoWorker[]
    attachments: Attachment[]
  }
): Promise<{ error: string | null }> {
  // Claim update
  const { error } = await supabase
    .from('claims')
    .update({
      sender_name: claimData.sender_name,
      tour_purpose: claimData.tour_purpose,
      tour_from_date: claimData.tour_from_date,
      tour_to_date: claimData.tour_to_date,
      site_name: claimData.site_name,
      total_amount: claimData.total_amount,
      remarks: claimData.remarks,
      status: 'submitted',
    })
    .eq('id', id)
  if (error) return { error: error.message }

  // Co-workers replace
  await supabase.from('claim_coworkers').delete().eq('claim_id', id)
  const validCoWorkers = claimData.co_workers.filter(cw => cw.name.trim())
  if (validCoWorkers.length > 0) {
    await supabase.from('claim_coworkers').insert(
      validCoWorkers.map(cw => ({ claim_id: id, name: cw.name, father_name: cw.father_name }))
    )
  }

  // Attachments replace
  await supabase.from('claim_attachments').delete().eq('claim_id', id)
  if (claimData.attachments.length > 0) {
    await supabase.from('claim_attachments').insert(
      claimData.attachments.map(a => ({
        claim_id: id,
        name: a.name,
        type: a.type,
        size: a.size,
        base64: a.base64,
      }))
    )
  }

  return { error: null }
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteClaim(id: string): Promise<{ error: string | null }> {
  // cascade delete — coworkers + attachments bhi delete ho jaate hain
  const { error } = await supabase.from('claims').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}
