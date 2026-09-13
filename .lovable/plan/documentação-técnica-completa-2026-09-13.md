# Documentação técnica completa

## Objetivo
Organizar uma documentação profissional e sustentável do sistema de rifas, separando arquitetura, banco de dados e identidade visual, com um README principal que funcione como porta de entrada.

## Entregáveis
- `README.md`: visão geral do produto, recursos, tecnologias, configuração, execução, validação, publicação e índice da documentação.
- `docs/ARQUITETURA.md`: visão arquitetural, estrutura do código, rotas, módulos, autenticação, fluxos público e administrativo, integrações, pagamentos, comprovantes, promoções, sorteio, ranking e observabilidade.
- `docs/BANCO-DE-DADOS.md`: modelo de dados, relacionamentos, estados, funções/RPCs, gatilhos, políticas de acesso, permissões, storage, migrações e fluxos transacionais.
- `docs/DESIGN-SYSTEM.md`: identidade visual, tokens, paleta, tipografia, componentes, responsividade, animações, acessibilidade e regras para evolução consistente.

## Execução
1. Consolidar o inventário do código e das migrações existentes, sem documentar recursos não comprovados.
2. Escrever os três documentos especializados com diagramas Mermaid, tabelas e referências aos pontos relevantes do projeto.
3. Reestruturar o README para apresentar o sistema e encaminhar cada assunto ao documento correspondente.
4. Revisar links, comandos, terminologia, consistência entre documentos e estado final da aplicação.

## Critérios de qualidade
- Conteúdo em português, completo e orientado tanto à manutenção quanto à operação.
- Segredos, identificadores internos e dados pessoais não serão expostos.
- A documentação refletirá o código e o banco atuais, incluindo as promoções por quantidade.
- Links relativos e comandos de desenvolvimento serão conferidos.
