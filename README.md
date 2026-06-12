# Reviva Brasil — Rifa Solidária

Aplicação de rifa online da Associação Reviva Brasil, construída com foco em transparência, gamificação e facilidade de uso.

🌐 **Produção:** https://rifa.revivabrasil.com.br

---

## 🚀 Stack

- **Frontend:** React 19 + TypeScript + TanStack Start (Router + Server Functions) + Vite 7
- **UI:** Tailwind CSS 4, Shadcn UI, Lucide Icons, Framer Motion, canvas-confetti
- **Backend:** Lovable Cloud (Supabase Postgres + Auth + Storage + Realtime)
- **Pagamento:** Mercado Pago PIX (com webhook automático)
- **Deploy:** Cloudflare Workers (via Lovable)

---

## 📁 Estrutura

```
src/
├── routes/                # Rotas TanStack (file-based)
│   ├── index.tsx                       # Home pública
│   ├── campanha.$slug.tsx              # Página da campanha (compra)
│   ├── checkout.$orderId.tsx           # PIX + QR Code
│   ├── confirmacao.$orderId.tsx        # Confirmação + recibo
│   ├── admin.tsx                       # Layout admin (sidebar)
│   ├── admin.login.tsx                 # Login do admin
│   ├── admin.dashboard.tsx             # KPIs gerais
│   ├── admin.campaigns.{index,new,$id} # CRUD de campanhas
│   ├── admin.draw.{index,$id}          # Sorteador gamificado
│   ├── admin.ranking.{index,$id}       # Ranking de vendedores
│   └── api.webhooks.mercadopago.ts     # Webhook PIX
├── components/            # UI compartilhada (Header, Footer, ShareCampaign, etc)
├── lib/api/               # Server Functions (createServerFn)
├── integrations/supabase/ # Cliente Supabase + tipos gerados
└── styles.css             # Design tokens + animações utilitárias
```

---

## 🧩 Funcionalidades

### Público
- Página da campanha com grid de números (vendidos/reservados/disponíveis em tempo real via Realtime).
- Reserva de números por 3 minutos com nome do vendedor opcional.
- Checkout PIX (QR Code + copia-e-cola) e confirmação automática via webhook.
- Compartilhamento via WhatsApp/Instagram/Telegram/Copiar texto.
- Ranking de vendedores agregado (top 5) na própria campanha.

### Admin (`/admin`)
- **Dashboard:** total arrecadado, vendas, compradores, campanhas ativas.
- **Campanhas:** criar, editar (todos os campos incluindo quantidade, datas, meta, valor, PIX, prêmios), pausar, encerrar, ver pedidos com números vendidos por comprador.
- **Sorteador:** seleção de campanha → tela festiva fullscreen, botão "Iniciar Sorteio" com borda animada, 30s de animação iluminando números vendidos a cada 100ms, modal com confete, prêmio e dados do ganhador. Salva resultado em `draws`.
- **Ranking:** seleção de campanha → tabela completa com vendedores (ordem aleatória), seus números vendidos e total. Botão "Melhor Vendedor" com borda animada abre modal gamificado com confete, som de palmas e destaque do top vendedor.

---

## 🗄️ Banco de Dados (Lovable Cloud)

| Tabela | Conteúdo | Acesso público (anon) | Acesso admin |
|--------|----------|----------------------|--------------|
| `campaigns` | Campanhas | SELECT (status visível) | ALL |
| `raffle_numbers` | Números (1..N) por campanha | SELECT | ALL |
| `buyers` | Nome/WhatsApp/email | — | ALL |
| `orders` | Pedidos + valores + status | — (via server fn) | ALL |
| `order_numbers` | Vínculo pedido↔número | — | ALL |
| `campaign_prizes` | Prêmios da campanha | SELECT | ALL |
| `draws` | Resultados de sorteio | SELECT | ALL |
| `admin_users` | Usuários admin | SELECT próprio | — |
| `audit_logs` | Log de ações | — | ALL |
| `payments` | Histórico de pagamentos | — | ALL |

**Princípios:**
- Toda tabela em `public` tem `GRANT` explícito + RLS habilitada.
- Dados de compradores (PII) nunca expostos diretamente ao `anon`.
- Pedidos acessíveis ao comprador apenas via UUID do pedido (capability) através de `getOrderPublic` (server function com service role).
- Operações privilegiadas via `SECURITY DEFINER` functions:
  - `reserve_numbers` — reserva atômica + criação de pedido.
  - `confirm_payment` — webhook marca pedido como pago e libera números como `sold`.
  - `cancel_order` — cancela pedido e libera números.
  - `expire_pending_orders` — limpa reservas expiradas.
  - `get_seller_ranking` — agrega ranking público sem expor PII.
  - `is_admin` — verifica role admin sem recursão RLS.
  - `seed_raffle_numbers` — trigger que popula números ao criar campanha.

---

## 🔐 Autenticação

- **Comprador:** anônimo — identifica-se pelo WhatsApp + nome no checkout.
- **Admin:** login Supabase Auth (email/senha) + checagem em `admin_users` via `useAdminSession`. Layout `admin.tsx` redireciona para `/admin/login` quando não há sessão.

---

## 💳 Fluxo de Pagamento (PIX Mercado Pago)

1. Usuário escolhe números → `reserve_numbers` RPC cria `order` (status `pending`, expira em 3 min).
2. Redireciona para `/checkout/$orderId` → server fn `getOrderPublic` retorna QR Code/copia-e-cola.
3. Mercado Pago envia webhook → `/api/webhooks/mercadopago` valida e chama `confirm_payment` RPC.
4. Números viram `sold` e usuário vê `/confirmacao/$orderId` com recibo compartilhável.

**Secrets esperados:** `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` (já configurados na Lovable Cloud).

---

## 🎲 Sorteador

- Lista campanhas com `status = active` em `/admin/draw`.
- Tela do sorteio replica a tabela de números: vendidos com borda dourada + número em preto (ativos), disponíveis em cinza claro.
- Animação de 30 segundos sorteando aleatoriamente apenas entre números vendidos. Resultado salvo em `draws`.

---

## 🏆 Ranking

- `/admin/ranking` lista campanhas → tabela completa com todos os vendedores, seus números (ordem aleatória), quantidade e valor arrecadado.
- Botão "Melhor Vendedor" com borda animada → modal com confete + som de palmas (WebAudio) + nome, números vendidos e total do top vendedor.

---

## 🛠️ Desenvolvimento

```bash
bun install
bun dev      # Vite dev server (porta 8080)
```

Variáveis em `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).

---

## 🚦 Status de Produção

- ✅ Banco com GRANTs explícitos para todas as 10 tabelas.
- ✅ RLS habilitada em todas as tabelas.
- ✅ Páginas públicas acessíveis sem login.
- ✅ Sorteador integrado lendo números reais da campanha.
- ✅ Ranking público via RPC `get_seller_ranking` (sem expor PII).
- ✅ Webhook PIX validando assinatura antes de marcar pago.
- ⚠️ Linter exibe 14 avisos `WARN` sobre `SECURITY DEFINER` — **intencional**: todas as funções listadas são necessárias para a operação anônima do app (reservar, confirmar, cancelar, agregar ranking, expirar) e foram revisadas para não expor dados sensíveis.

---

## 📝 Licença

Projeto interno da Associação Reviva Brasil.
