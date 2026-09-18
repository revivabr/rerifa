# Estabilização definitiva do PIX e das reservas

## Objetivo
Eliminar perdas por cobranças concorrentes, reservas presas e pagamentos feitos depois da liberação dos números. O prazo comercial continua em 180 segundos, com um único pedido e uma única cobrança PIX.

## Diagnóstico confirmado
- A criação do PIX pode receber duas chamadas simultâneas; a chave idempotente evita duplicidade, mas o bloqueio temporário do Mercado Pago ainda precisa ser coordenado antes da chamada externa.
- Hoje a expiração automática depende da tela do comprador ou de uma nova visita à campanha; não há processamento autônomo no servidor.
- O banco já impede confirmar um pagamento quando os números foram liberados ou reassociados, mas falta tratar financeiramente e registrar esse pagamento tardio.
- O webhook consulta o Mercado Pago antes de confirmar, porém ainda não valida a assinatura enviada pelo provedor.
- No estado atual há 50 pedidos pagos sem inconsistência de números e nenhum número vencido ainda reservado.

## Implementação

### 1. Tornar a criação do PIX atômica
- Adicionar ao pedido estados técnicos de geração (`not_started`, `processing`, `ready`, `failed`) e horários de tentativa, sem expor esses campos publicamente.
- Criar uma operação protegida no banco que conceda a apenas uma chamada o direito de criar a cobrança; chamadas concorrentes aguardam e recuperam a cobrança já criada.
- Manter a mesma chave idempotente por pedido e a busca por `external_reference` para recuperar cobranças após bloqueio, timeout ou resposta perdida.
- Persistir cobrança e início da janela de 180 segundos de forma consistente; se a persistência falhar após criação externa, a próxima tentativa recupera a mesma cobrança.

### 2. Automatizar expiração sem depender da tela
- Criar uma rota interna protegida por segredo para processar pedidos vencidos em pequenos lotes.
- Configurar execução automática a cada minuto no backend.
- Para cada pedido vencido: consultar primeiro o estado real no Mercado Pago; confirmar se já foi pago, cancelar se ainda estiver pendente e somente então liberar os números.
- Registrar tentativas e repetir falhas transitórias com limite e atraso, sem bloquear os demais pedidos.

### 3. Tratar pagamentos no limite e pagamentos tardios
- Preservar a validade técnica necessária para o banco processar o PIX, mas impedir que um pagamento tardio vire venda sem números.
- Se o pagamento for aprovado antes da liberação, confirmar o pedido e vender os números de forma atômica.
- Se a aprovação chegar depois que os números já foram liberados, registrar a ocorrência como reconciliação pendente e executar estorno integral idempotente; nunca marcar o pedido como pago sem números.
- Exibir esse caso no painel administrativo com situação clara para acompanhamento.

### 4. Fortalecer webhook e rastreabilidade
- Validar a assinatura oficial do Mercado Pago antes de qualquer alteração financeira.
- Registrar eventos recebidos e processados com identificador único para suportar repetições do webhook sem duplicar confirmação ou estorno.
- Guardar códigos técnicos e mensagens sanitizadas de falha para diagnóstico, sem expor dados privados ao comprador.

### 5. Melhorar a recuperação no checkout
- Enquanto outra chamada estiver criando o PIX, mostrar “Gerando pagamento” e consultar novamente por poucos segundos, em vez de apresentar erro imediato.
- Se houver falha recuperável, oferecer nova tentativa no mesmo pedido; nunca criar outra cobrança ou outra reserva.
- Manter contador, vencimento e mensagens derivados do horário salvo pelo servidor.

## Homologação
- Duas chamadas simultâneas para o mesmo pedido geram exatamente uma cobrança e ambas recebem o mesmo QR.
- Bloqueio temporário, timeout e resposta perdida recuperam a cobrança por `external_reference`.
- Ao fechar a aba, o servidor encerra a reserva após 180 segundos, cancela a cobrança pendente e libera todos os números.
- Pagamento aprovado no limite é confirmado uma única vez; webhook duplicado não duplica efeitos.
- Pagamento tardio nunca resulta em pedido pago sem números e entra em estorno/reconciliação.
- Testes em celular e computador, compilação, inspeção dos registros e uma compra real de baixo valor no domínio oficial.

## Observação operacional
A correção de código reduz o risco, mas a homologação financeira final exige publicação e uma compra real de baixo valor. O teste deve conferir criação, leitura do QR, aprovação no Mercado Pago, webhook, venda dos números e comprovante.
