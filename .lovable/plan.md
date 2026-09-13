# Promoções por quantidade nas campanhas

## Objetivo
Permitir que cada campanha tenha várias ofertas por quantidade, como **3 números por R$ 50,00**, mantendo o valor normal de **R$ 19,00 por número** fora das quantidades promocionais cadastradas.

A promoção será aplicada somente quando a quantidade selecionada for exatamente igual a uma faixa. A meta financeira continuará sendo calculada por quantidade total × valor normal da cota.

## O que será construído

### 1. Cadastro das promoções
- Adicionar à criação e à edição de campanhas uma área “Promoções por quantidade”.
- Permitir incluir, alterar e remover várias faixas com:
  - quantidade exata de números;
  - preço total promocional;
  - visualização da economia gerada.
- Impedir quantidades repetidas, valores inválidos ou promoções que não ofereçam desconto real.
- Cadastrar na campanha existente **Vôo do Bem** a oferta de **3 números por R$ 50,00**.

### 2. Regra segura de preço
- Criar uma estrutura própria para armazenar as promoções de cada campanha.
- Centralizar o cálculo no banco de dados, dentro da reserva dos números.
- Para uma seleção que corresponda exatamente a uma faixa ativa, gravar o preço promocional no pedido.
- Para qualquer outra quantidade, usar quantidade × valor normal.
- Salvar também no pedido o valor normal anterior e a promoção aplicada, preservando o histórico mesmo se a campanha for editada depois.

### 3. Experiência na página pública
- Exibir as ofertas disponíveis próximas ao valor da cota e à seleção dos números.
- Destacar visualmente quando uma quantidade promocional for alcançada.
- Atualizar o resumo inferior e o formulário do comprador em tempo real:
  - valor normal riscado;
  - valor promocional em destaque;
  - economia obtida.
- Se a pessoa selecionar outra quantidade, remover o desconto e voltar ao cálculo normal, conforme a regra de quantidade exata.

### 4. Checkout e Mercado Pago
- Mostrar no checkout o valor normal riscado, o valor promocional e a economia quando houver promoção.
- Gerar a cobrança do Mercado Pago exclusivamente com o valor promocional já validado e gravado no pedido.
- Manter pedidos sem promoção funcionando como hoje.
- Preservar o valor efetivamente pago nos comprovantes, relatórios, ranking e total arrecadado.

### 5. Validação
- Testar a campanha Vôo do Bem com 1, 2, 3 e 4 números, confirmando que apenas 3 custam R$ 50,00.
- Testar várias faixas na mesma campanha e campanhas sem promoção.
- Confirmar que chamada direta não permite alterar o preço calculado.
- Verificar criação, edição, seleção, reserva, checkout, geração do PIX e telas administrativas em celular e computador.

## Detalhes técnicos
- Nova tabela de promoções ligada à campanha, com quantidade, preço total, estado ativo e restrição de uma faixa por quantidade.
- Regras de acesso: leitura pública somente das ofertas; criação, edição e remoção apenas por administradores.
- Novos campos de auditoria no pedido para valor normal e promoção aplicada.
- Atualização atômica da função de reserva para consultar a faixa exata e calcular o total no servidor.
- O frontend repetirá o cálculo apenas para pré-visualização; o valor definitivo continuará sendo determinado pelo banco de dados.
