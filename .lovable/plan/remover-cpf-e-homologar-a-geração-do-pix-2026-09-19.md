# Remover CPF e homologar a geração do PIX

## Alterações
- Retirar o campo CPF e sua validação do formulário de compra.
- Alterar a reserva para não exigir nem gravar CPF, preservando preço promocional, indicação, atomicidade e prazo de 180 segundos.
- Alterar a geração do PIX para não consultar, validar ou enviar CPF ao Mercado Pago.
- Manter compatibilidade com compradores e pedidos antigos que possuem CPF cadastrado.

## Homologação
- Validar o fluxo completo em celular e computador: escolher número, informar os dados restantes, reservar e abrir o checkout.
- Criar uma reserva real de baixo valor e solicitar uma cobrança real ao Mercado Pago, confirmando visualmente que o QR PIX e o código copia e cola aparecem com o contador de 180 segundos.
- Não pagar a cobrança de homologação; cancelar a reserva de teste e confirmar que o número volta a ficar disponível.
- Verificar registros, erros da aplicação e estado final do pedido antes de concluir.

## Limite da validação
A homologação confirmará a criação real da cobrança e do QR PIX. A liquidação bancária, o webhook de aprovação e o comprovante exigiriam efetuar o pagamento e não fazem parte deste pedido.
