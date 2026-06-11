CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  'd5a0fee7-39ae-4ba9-b577-7547cd15aa9f',
  'authenticated',
  'authenticated',
  'admin@revivabrasil.com.br',
  crypt('Reviv@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@revivabrasil.com.br');

INSERT INTO public.admin_users (id, auth_user_id, email, name, role)
VALUES ('d5a0fee7-39ae-4ba9-b577-7547cd15aa9f', 'd5a0fee7-39ae-4ba9-b577-7547cd15aa9f', 'admin@revivabrasil.com.br', 'Admin Reviva', 'super_admin')
ON CONFLICT (email) DO UPDATE SET auth_user_id = EXCLUDED.auth_user_id, id = EXCLUDED.id;