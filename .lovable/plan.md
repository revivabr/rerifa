# Corrigir expiração do PIX e falhas na reserva

## Objetivo
Evitar mensagens repetidas quando o PIX expira e garantir que o botão de reserva nunca fique travado após uma falha.

## Alterações
- No checkout expirado, fazer apenas uma tentativa automática de confirmação/cancelamento por carregamento da tela.
- Quando o provedor ainda estiver processando ou estiver indisponível, manter os números protegidos e mostrar uma única mensagem calma, sem repetição imediata.
- Na reserva, tratar falhas de validação, servidor e conexão com `try/catch/finally`, sempre restaurando o botão e exibindo uma mensagem compreensível.
- Impedir a seleção de mais de 100 números na tela, alinhando-a ao limite já aplicado no servidor.
- Registrar as duas correções no roadmap.

## Validação
- Conferir que a expiração não dispara chamadas/toasts em sequência.
- Simular falha na reserva e confirmar que o botão volta ao estado normal com aviso visível.
- Verificar o limite de 100 números e o fluxo normal de reserva.
- Confirmar o build e resolver os dois alertas do monitoramento como corrigidos.

## Detalhes técnicos
- Preservar a regra segura: números não serão liberados sem estado terminal confirmado pelo Mercado Pago.
- Não alterar prazo, preço, promoções ou regras financeiras.
