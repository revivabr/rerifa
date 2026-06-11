# Reviva Brasil — Rifa Solidária

Aplicação de rifa online da Associação Reviva Brasil, integrada a um Supabase **externo** (sua própria conta).

## 1. Configurar Supabase externo

1. Crie/abra seu projeto em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, cole e execute o arquivo `db/migrations/001_init.sql`.
3. Em **Storage**, crie um bucket público chamado `campaign-assets` (banners, prêmios, regulamentos).
4. Em **Authentication → Providers**, habilite **Email/Password** e desabilite confirmação por e-mail (opcional, para facilitar o primeiro admin).
5. Crie um usuário em **Authentication → Users** (Add user → email + senha).
6. Volte ao **SQL Editor** e cadastre esse usuário como admin:
   ```sql
   insert into public.admin_users(auth_user_id, name, email, role)
   values ('<UUID-DO-USUARIO-EM-AUTH>', 'Seu Nome', 'voce@email.com', 'super_admin');
   ```

## 2. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 3. Rodar

```bash
bun install
bun run dev
```

Acesse `/admin/login` com o e-mail e senha cadastrados.

## 4. Integração PIX (futuro)

Hoje a camada de pagamento é **mock** — gera QR code e código copia-cola fictícios. O admin confirma o pagamento manualmente.
Para plugar Efí / Mercado Pago / OpenPix / Asaas, implemente:
- `createPixPayment(order)` — gerar cobrança real
- `/api/public/webhook/pix` — receber confirmação e chamar `confirm_order_payment(order_id)` com `service_role`

As variáveis `PIX_PROVIDER_API_KEY` e `PIX_PROVIDER_WEBHOOK_SECRET` já estão previstas no `.env.example`.
