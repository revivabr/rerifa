# Auditoria geral e homologação ponta a ponta

## Objetivo
Validar o sistema completo em condições próximas à produção e corrigir falhas comprovadas sem alterar regras de negócio.

## Escopo
- Fluxo público: início, campanha, promoções, seleção de números, reserva, PIX, expiração, confirmação e comprovante.
- Compartilhamento: imagem, texto, links e metadados sociais.
- Área administrativa: acesso, navegação, campanhas, pedidos, sorteio, ranking e segunda via.
- Integrações: banco, armazenamento, Mercado Pago e notificações automáticas.
- Qualidade: telas pequenas e grandes, acessibilidade básica, rotas, erros visíveis e segurança.

## Execução
- Conferir dados, permissões, estados e rotinas críticas do banco.
- Percorrer as jornadas no navegador, incluindo cenários de sucesso e falha seguros.
- Validar endpoints públicos sem disparar cobrança real nem sorteio definitivo.
- Corrigir problemas reproduzíveis e repetir os testes afetados.
- Registrar no relatório o que foi aprovado, corrigido ou depende de uma compra real.

## Entrega
- Sistema corrigido no que for possível homologar com segurança.
- Relatório final em Markdown com evidências, limitações e checklist para publicação.
