import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Single shared client instance
export const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
