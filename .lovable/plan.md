# Unificar prazo do PIX em 180 segundos

## Objetivo
Usar o mesmo prazo de 180 segundos para a validade da cobrança PIX, a reserva dos números e a contagem exibida ao comprador.

## Alterações
- Atualizar a janela de reserva no banco de 90 para 180 segundos.
- Manter a cobrança PIX com validade de 180 segundos.
- Liberar automaticamente os números quando os 180 segundos terminarem sem pagamento aprovado, inclusive se a tela for fechada.
- Atualizar comentários e documentação operacional para refletir o prazo único.

## Validação
- Confirmar que uma nova cobrança e sua reserva recebem o mesmo horário de vencimento.
- Verificar que pedidos vencidos são cancelados e os números voltam a ficar disponíveis.
- Conferir a contagem regressiva e a compilação do aplicativo.
