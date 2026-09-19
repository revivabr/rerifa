# Roadmap

- [x] Criar estrutura de promoções e histórico de preço no pedido
- [x] Centralizar cálculo protegido na reserva
- [x] Cadastrar 3 números por R$ 50 na campanha Vôo do Bem
- [x] Adicionar cadastro e edição de faixas promocionais
- [x] Exibir ofertas e preço promocional na página pública
- [x] Exibir desconto no checkout
- [x] Validar regra, interface e segurança
- [x] Documentar a arquitetura da aplicação
- [x] Documentar o banco de dados e a segurança
- [x] Documentar o design system e a responsividade
- [x] Reestruturar o README como índice operacional
- [x] Exibir promoções da campanha ativa na página inicial
- [x] Padronizar botões e mensagens de compartilhamento entre home e campanha
- [x] Servir o banner oficial da campanha em URL pública e estável para as prévias sociais
- [x] Unificar cobrança e reserva PIX em 180 segundos e liberar automaticamente os números vencidos
- [x] Restaurar o Mercado Pago real e confirmar automaticamente pedidos aprovados
- [x] Exibir contagem regressiva de 10 segundos após expirar o PIX e retornar à seleção de números

- [x] Restaurar a campanha ativa na página inicial e manter o banner 16:9 sem cortes
- [x] Restringir dados internos expostos nas leituras públicas

- [ ] Auditar e homologar o sistema completo ponta a ponta
- [x] Reorganizar “Campanhas em destaque” em layout vertical e simétrico
- [x] Corrigir o salvamento conjunto de promoções existentes e novas na edição de campanhas
- [x] Preservar parágrafos e quebras de linha cadastrados nas campanhas em destaque
- [x] Liberar reservas PIX vencidas mesmo quando o comprador fecha a tela de pagamento
- [x] Garantir liberação local após 180 segundos e oferecer retorno manual à campanha
- [x] Padronizar a mensagem em todos os compartilhamentos e campanhas futuras
- [x] Corrigir a recusa bancária do PIX com CPF do pagador e reserva em 180 segundos
- [x] Melhorar a confirmação no celular, destacar o comprovante e restaurar os confetes
- [x] Recuperar a cobrança PIX após bloqueio temporário sem gerar duplicidade
- [x] Alinhar a validade do código PIX à reserva de 180 segundos

- [x] Tornar a geração do PIX atômica e recuperável em chamadas concorrentes
- [x] Executar expiração e liberação segura sem depender da tela do comprador (agendada a cada minuto; publicação necessária para ativar a nova rota)
- [x] Estornar e registrar automaticamente pagamentos aprovados após a liberação
- [x] Registrar webhooks idempotentes e mostrar reconciliações no painel
- [ ] Homologar concorrência, expiração, webhook duplicado e pagamento tardio (testes técnicos concluídos; falta compra real após publicação)

- [x] Ajustar a autenticação do webhook ao modelo disponível no Mercado Pago, sem exigir credencial inexistente
- [x] Enviar o CPF do comprador na cobrança PIX para reduzir recusas bancárias
- [x] Validar os dígitos verificadores do CPF antes de reservar números e gerar o PIX
