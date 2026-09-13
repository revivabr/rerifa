# Promoções e compartilhamento de campanhas

## Objetivo
Exibir as ofertas por quantidade já cadastradas na campanha ativa e tornar o compartilhamento idêntico na página inicial e na página da campanha, sempre usando o banner oficial da campanha.

## Alterações
- Incluir no card da campanha ativa uma área compacta com todas as promoções vigentes, mostrando quantidade, preço promocional e economia.
- Reutilizar o mesmo conjunto de botões circulares, ícones, cores, textos e comportamento de compartilhamento nas duas páginas.
- Centralizar a mensagem compartilhada para evitar diferenças entre visualizações.
- Garantir que o compartilhamento nativo receba o banner oficial da campanha e que a página pública anuncie esse mesmo banner nas prévias de WhatsApp e outras redes.
- Remover a imagem genérica da Rifa Solidária dos metadados globais para que ela não substitua a imagem específica da campanha.

## Validação
- Conferir a página inicial e a página da campanha em tela pequena e desktop.
- Testar copiar, WhatsApp, e-mail, Instagram e compartilhamento do dispositivo.
- Confirmar a imagem e o texto usados na página pública e verificar o resultado da compilação.

## Detalhes técnicos
- Manter `ShareButtons` e `buildCampaignShareMessage` como fontes únicas do padrão.
- Usar a URL pública oficial `https://rifa.revivabrasil.com.br/campanha/{slug}`.
- Não alterar regras de preço, cobrança ou cadastro das promoções.
