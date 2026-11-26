# Supabase Migration Guide

## ✅ Completed Files

### Database Layer
- ✅ `lib/supabase/client.ts` — Supabase client
- ✅ `lib/users.ts` — Users CRUD (async)
- ✅ `lib/claims.ts` — Claims CRUD (async)
- ✅ `lib/types.ts` — Updated types
- ✅ `supabase-migration.sql` — Schema

### Auth Pages
- ✅ `app/login/page.tsx` — Async getUserByUsername()
- ✅ `components/Header.tsx` — Logout (cookie clear)

---

## 🔄 Pending Files (Need to Update)

### Admin & User Management
- `app/dashboard/admin/users/page.tsx` — Replace localStorage with async getUsers()

### Claims Pages
- `app/dashboard/claims/my/page.tsx` — Replace localStorage with getClaimsByUser() / getAllClaims()
- `app/dashboard/claims/new/page.tsx` — Replace localStorage with createClaim()
- `app/dashboard/claims/[id]/page.tsx` — Replace localStorage with getClaimById()
- `app/dashboard/claims/[id]/edit/page.tsx` — Replace localStorage with updateClaimFull()

### Manager Pages
- `app/dashboard/manager/pending/page.tsx` — Replace localStorage with getClaimsByStatus()

### Finance Pages
- `app/dashboard/finance/pending/page.tsx` — Replace localStorage with getClaimsByStatus()
- `app/dashboard/finance/payout/page.tsx` — Replace localStorage with getClaimsByStatus()

### Dashboard
- `app/dashboard/page.tsx` — Replace localStorage with async calls

---

## Migration Steps

### Step 1: Run SQL Script
```bash
# Supabase Dashboard → SQL Editor
# Copy paste: supabase-migration.sql
# Execute
```

### Step 2: Default Admin Password
```sql
-- Supabase SQL Editor mein run karo:
INSERT INTO public.profiles (id, username, password, full_name, role, department, employee_code)
VALUES ('admin-001', 'admin', 'admin@123', 'Administrator', 'admin', 'Administration', 'ADM001')
ON CONFLICT (id) DO UPDATE SET password = 'admin@123';
```

### Step 3: Update All Component Files
Har file mein:
```ts
// BEFORE (localStorage):
useEffect(() => {
  const claims = JSON.parse(localStorage.getItem('tbms_claims') || '[]')
  setClaims(claims)
}, [])

// AFTER (Supabase):
import { getAllClaims } from '@/lib/claims'

useEffect(() => {
  getAllClaims().then(setClaims)
}, [])
```

### Step 4: Test Flow
1. Login → `admin` / `admin@123`
2. Create user → User Management page
3. Submit claim → New Claim page
4. Approve → Manager/Finance pages
5. Payout → Payout page

---

## Notes
- Password plaintext store ho raha hai (simple auth)
- Base64 attachments DB mein (< 1MB)
- RLS policies permissive (production mein tighten karo)
- No Supabase Auth (cookie-based session)
