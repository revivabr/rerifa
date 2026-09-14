# Restaurar pagamento PIX real

## Objetivo
Restabelecer a integração de produção do Mercado Pago para gerar cobranças PIX reais e confirmar automaticamente os números pagos.

## Alterações
- Manter o Access Token somente no cofre seguro do servidor.
- Fixar a URL oficial `https://rifa.revivabrasil.com.br` para notificações do Mercado Pago.
- Expor o webhook em uma rota pública estável, mantendo compatibilidade com a URL anterior.
- Validar a cobrança consultando o Mercado Pago e confirmar o pedido no banco apenas quando o status for `approved`.
- Melhorar o tratamento de falhas para que o comprador veja uma mensagem clara sem perder silenciosamente a reserva.

## Validação
- Confirmar que o servidor reconhece a credencial sem revelar seu valor.
- Testar a chegada e o tratamento seguro de uma notificação.
- Verificar compilação, rotas e atualização automática de pedido/números.
