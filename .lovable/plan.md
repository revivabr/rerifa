# Padronizar todos os compartilhamentos das campanhas

## Objetivo
Usar uma única mensagem em todos os compartilhamentos, seguindo exatamente a estrutura e as quebras de linha fornecidas, com os dados de cada campanha preenchidos automaticamente.

## Implementação
- Centralizar o modelo em uma única função reutilizada pela página inicial, página da campanha, WhatsApp, Instagram, e-mail, copiar texto e compartilhamento nativo.
- Montar o texto com nome da campanha, descrição curta, valor unitário, promoções ativas, economia, data do sorteio e endereço oficial da campanha.
- Preservar os parágrafos e linhas em branco do modelo, sem adicionar marcações como asteriscos ao nome.
- Ordenar as promoções por quantidade e separar cada oferta por uma linha em branco.
- Fazer o compartilhamento do bilhete após o pagamento usar a mesma mensagem, mantendo o bilhete como imagem anexada quando o aparelho permitir.
- Alinhar os textos da prévia social da página pública com a mesma mensagem da campanha, mantendo o banner cadastrado como imagem.

## Regra para campanhas futuras
- O exemplo “Vôo do Bem” será dinâmico: novas campanhas receberão o mesmo formato com seus próprios dados cadastrados.
- A introdução virá da descrição curta, preservando suas quebras de linha.
- Valor, economia e data serão formatados automaticamente em português do Brasil.
- O link sempre usará `https://rifa.revivabrasil.com.br/campanha/{slug}`.

## Validação
- Comparar o texto produzido para “Vôo do Bem” com o modelo enviado, incluindo espaços e quebras de linha.
- Testar copiar, WhatsApp, e-mail, Instagram, compartilhamento nativo e compartilhamento do bilhete.
- Conferir a prévia da mensagem nas páginas inicial e da campanha, além dos metadados da página pública.