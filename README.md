# Tour Bill Management System

Employee tour bill submission aur approval system — Next.js + Supabase + Vercel.

## Features

- **Employee**: Bill submit karo with multiple file uploads (max 1MB each)
- **Manager**: Ek screen par bill + documents dekho, approve/reject karo (single ya bulk)
- **Finance**: Final approval with document view
- **Payout**: Bulk ya single payment mark with transaction reference
- **Admin**: User management, role assignment, manager mapping

## Tech Stack

- Next.js 14 (App Router)
- Supabase (Auth + PostgreSQL + Storage)
- Tailwind CSS
- Vercel (deployment)

---

## Setup Guide

### Step 1: Supabase Project Banao

1. [supabase.com](https://supabase.com) par jao → New Project banao
2. Project name, password set karo, region India select karo

### Step 2: Database Schema Run Karo

1. Supabase Dashboard → **SQL Editor** → New Query
2. `supabase-schema.sql` file ka sara content paste karo
3. **Run** karo

### Step 3: Environment Variables Set Karo

`.env.local` file mein apni Supabase details daalo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Ye values milti hain: Supabase Dashboard → **Project Settings** → **API**

### Step 4: Pehla Admin User Banao

1. Supabase Dashboard → **Authentication** → **Users** → **Add user**
2. Email aur password set karo
3. **SQL Editor** mein run karo:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
```

### Step 5: Local Run Karo

```bash
npm install
npm run dev
```

Browser mein kholo: http://localhost:3000

### Step 6: Vercel Par Deploy Karo

1. GitHub par repo push karo:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/tour-bill-system.git
git push -u origin main
```

2. [vercel.com](https://vercel.com) par jao → **New Project** → GitHub repo import karo

3. **Environment Variables** add karo (same as .env.local):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Deploy** karo!

---

## User Roles

| Role | Kya kar sakta hai |
|------|-------------------|
| **employee** | Claim submit karna, apni claims dekhna |
| **manager** | Apne team ki claims approve/reject karna |
| **finance** | Manager-approved claims final approve/reject + payout |
| **admin** | Sab kuch + user management |

## Workflow

```
Employee → Submit Claim (files upload)
    ↓
Manager → View bills on single screen → Approve / Reject
    ↓
Finance → Final check → Approve / Reject
    ↓
Finance → Mark as Paid (with payment reference)
```

## File Upload Rules

- Max file size: **1MB per file**
- Supported formats: **JPG, PNG, PDF**
- Multiple files allowed per claim
- Files stored securely in Supabase Storage (private bucket)
- Signed URLs generated for viewing (expire in 1 hour)
