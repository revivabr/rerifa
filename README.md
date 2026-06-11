# Reviva Brasil — Rifa Solidária

Aplicação de rifa online da Associação Reviva Brasil, desenvolvida com foco em solidariedade, transparência e facilidade de uso.

## 🚀 Tecnologias

- **Frontend:** React 19, TypeScript, TanStack Start (Router + Server Functions).
- **Estilização:** Tailwind CSS 4, Shadcn UI, Lucide Icons.
- **Backend/Banco:** Supabase (Auth, PostgreSQL, Storage, Realtime).
- **Pagamento:** Integração PIX (Mock/Manual com estrutura para Efí/Mercado Pago).

---

## 🏗️ Estrutura do Projeto

### Pastas Principais
- `src/routes/`: Definição de rotas (TanStack Router). Inclui áreas públicas e administrativas.
- `src/components/`: Componentes reutilizáveis (UI) e específicos do Admin.
- `src/integrations/supabase/`: Configuração e tipos gerados do banco de dados.
- `src/hooks/`: Hooks customizados para lógica de negócio e queries.
- `supabase/migrations/`: Histórico de alterações estruturais do banco.
- `docs/migrations/`: Arquivos de migração consolidados para setup inicial.

---

## 🛠️ Configuração e Instalação

### 1. Requisitos
- Node.js (ou Bun - recomendado)
- Conta no Supabase

### 2. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com as seguintes chaves:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

### 3. Instalação
```bash
bun install
```

### 4. Setup do Banco de Dados
1. Execute o script `docs/migrations/001_initial_schema.sql` no SQL Editor do seu Supabase.
2. Aplique as migrações subsequentes localizadas em `docs/migrations/` em ordem cronológica se necessário.
3. Crie os buckets de storage: `banners` (público) e `banners-reviva` (público).

---

## 🔐 Painel Administrativo

O painel está disponível em `/admin`.

### Acesso Inicial
- **Usuário:** `admin@revivabrasil.com.br`
- **Senha:** `Reviv@123`
*(Recomendado alterar a senha após o primeiro acesso via painel Supabase)*

### Funcionalidades do Admin
- **Dashboard:** Visão geral de vendas e campanhas.
- **Gestão de Campanhas:** Criar, editar, pausar e finalizar rifas.
- **Sorteio:** Realização de sorteios com registro de ganhadores.
- **Auditoria:** Logs de ações críticas realizadas por administradores.

---

## 💸 Fluxo de Pagamento (PIX)

Atualmente, o sistema opera com **PIX Manual**:
1. O usuário escolhe os números e preenche seus dados.
2. O sistema gera um código PIX (mock).
3. O administrador valida o recebimento e confirma o pagamento no painel admin.
4. O sistema libera os números automaticamente após a confirmação.

*Para integrar com APIs reais, configure os webhooks apontando para as server functions do TanStack Start.*

---

## 📄 Licença

Este projeto é de uso exclusivo da **Associação Reviva Brasil**.

---

*Documentação gerada automaticamente em junho de 2026.*
