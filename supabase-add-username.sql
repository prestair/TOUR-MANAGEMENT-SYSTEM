-- profiles table mein username column add karo
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- existing admin user ka username set karo
-- apna email yahan replace karo
UPDATE public.profiles 
SET username = 'admin' 
WHERE email = 'admin@company.com';

-- username required banao future ke liye (optional)
-- ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
