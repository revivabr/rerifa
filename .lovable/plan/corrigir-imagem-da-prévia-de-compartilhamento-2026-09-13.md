# Corrigir imagem da prévia de compartilhamento

## Objetivo
Fazer o cartão exibido pelo WhatsApp e demais redes usar exatamente o banner cadastrado na campanha.

## Implementação
- Criar uma URL pública e estável que entregue o banner da campanha mesmo quando ele estiver armazenado de forma privada.
- Apontar `og:image` e `twitter:image` da página de cada campanha para essa URL.
- Manter o envio direto da imagem pelo compartilhamento nativo quando o celular oferecer essa opção.
- Validar os metadados renderizados e a abertura da imagem em tela pequena.

## Detalhes técnicos
- O texto compartilhado continuará apontando para `https://rifa.revivabrasil.com.br/campanha/{slug}`.
- A prévia social será gerada pela própria página da campanha, sem usar a arte institucional da página inicial.
- O endpoint de imagem será somente leitura, validará o slug e retornará apenas o banner de campanhas públicas.
