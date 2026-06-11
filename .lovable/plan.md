# Plano de Melhoria Visual e Estruturação do Banco

## 1. Melhoria Visual (Home "Mais Alegre")
- **Hero Section**: Substituir o tom institucional por um visual vibrante de "Show de Prêmios". Usar a arte enviada pelo usuário como destaque.
- **Destaque da Campanha**: Se houver uma campanha ativa, exibi-la imediatamente com um card de "Ticket" estilizado e botão de ação direta para os números.
- **Cores**: Intensificar o uso do Dourado (#D9A441) e Verdes vibrantes para passar a sensação de sorteio e oportunidade.
- **Acesso Admin**: Manter o botão de admin no footer ou header de forma minimalista (apenas um ícone discreto), conforme solicitado.

## 2. Estruturação do Banco de Dados
- **Problema**: Para rodar o SQL de migração automaticamente, é necessária a string de conexão (DATABASE_URL) ou a senha do banco de dados, que não estão no `.env.example`.
- **Solução**: Solicitar ao usuário a senha do banco ou que ele execute o script `db/migrations/001_init.sql` diretamente no Editor SQL do Supabase. 
- **Verificação**: Fornecer um script de teste para validar se as tabelas foram criadas corretamente após a execução manual.

## 3. Alterações Técnicas
- **src/routes/index.tsx**: Refatoração completa da Home.
- **src/components/Header.tsx**: Ajuste na discrição do botão admin.
- **src/styles.css**: Adição de classes utilitárias para o novo visual (gradientes "raffle", animações de brilho).
- **db/migrations/001_init.sql**: Garantir que as credenciais do admin (`admin@revivabrasil.com.br` / `reviva123`) estejam incluídas na migração.

---

### Detalhes Técnicos para o Usuário
O banco de dados do Supabase exige autenticação direta para criar tabelas (DDL). Como as chaves de API (`anon` e `service_role`) são para o API Gateway e não para o banco de dados diretamente, você precisa:
1. Copiar o conteúdo de `db/migrations/001_init.sql`.
2. Colar no **SQL Editor** do seu painel Supabase e clicar em **Run**.
3. Isso criará todas as tabelas, funções de reserva e o seu usuário admin.
