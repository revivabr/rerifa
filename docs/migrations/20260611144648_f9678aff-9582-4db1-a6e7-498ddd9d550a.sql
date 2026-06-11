ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_auth_user_id_fkey;

UPDATE public.admin_users 
SET auth_user_id = 'd5a0fee7-39ae-4ba9-b577-7547cd15aa9f' 
WHERE email = 'admin@revivabrasil.com.br';