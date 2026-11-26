-- Step 1: Purana user delete karo (agar hai)
DELETE FROM auth.users WHERE email = 'admin@company.com';

-- Step 2: Naya admin user banao with confirmed email
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@company.com',
  crypt('admin@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Administrator"}',
  'authenticated',
  'authenticated'
);

-- Step 3: Profile mein username aur role set karo
UPDATE public.profiles 
SET 
  username = 'admin',
  role = 'admin',
  full_name = 'Administrator'
WHERE email = 'admin@company.com';

-- Step 4: Verify karo
SELECT u.email, p.username, p.role, p.full_name 
FROM auth.users u 
JOIN public.profiles p ON p.id = u.id 
WHERE u.email = 'admin@company.com';
