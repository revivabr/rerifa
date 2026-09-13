# Design System — Rifa Solidária

## 1. Direção visual

A identidade da plataforma combina confiança institucional, acolhimento e celebração. O visual deve comunicar que a participação tem propósito social sem perder clareza comercial no momento de escolher números e pagar.

**Atributos da marca:** solidária, segura, elegante, otimista e humana.

**Assinatura:** “SORTE É SER GENEROSO”.

**Princípios:**

1. Verde profundo sustenta a confiança e a identidade da Reviva Brasil.
2. Dourado indica prêmio, destaque e celebração, sem dominar a interface.
3. Bege muito claro aproxima a experiência do material institucional e valoriza as logos.
4. Branco preserva legibilidade em áreas densas, como grade e checkout.
5. Movimento aparece em momentos importantes, nunca como ruído constante.

## 2. Fontes de verdade

- Tokens globais e animações: `src/styles.css`.
- Variáveis semânticas: bloco `:root` e `@theme inline`.
- Componentes base: `src/components/ui/`.
- Elementos de marca: `src/assets/`.
- Cabeçalho e rodapé: `src/components/Header.tsx` e `src/components/Footer.tsx`.

Novas telas devem usar tokens semânticos (`primary`, `background`, `muted`, `border`) em vez de criar cores isoladas.

## 3. Paleta

### 3.1 Cores de marca

| Token | Valor | Uso recomendado |
| --- | --- | --- |
| `primary` | `#1A3C23` | Ações principais, títulos, rodapé, superfícies institucionais |
| `primary-glow` | `#2D5F3A` | Variação de gradiente e estados de destaque |
| `gold` | `#C5A059` | Prêmio, promoções, bordas especiais |
| `gold-glow` | `#D4AF37` | Realce animado e números sorteados |
| `accent` | `#B8A382` | Apoio neutro quente |
| `sand` | `#FDFDFB` | Fundo institucional quase branco |
| `secondary` | `#F8FAF8` | Campos, cartões leves e áreas de apoio |
| `success` | `#059669` | Pagamento confirmado, disponibilidade e vitória |

### 3.2 Tokens semânticos

| Papel | Definição | Aplicação |
| --- | --- | --- |
| `background` | branco | Fundo padrão |
| `foreground` | verde quase preto | Texto principal |
| `card` | branco | Cartões repetidos e ferramentas |
| `muted` | verde neutro muito claro | Fundos secundários |
| `muted-foreground` | cinza esverdeado | Texto auxiliar |
| `border` / `input` | cinza-verde claro | Divisores e contornos |
| `destructive` | vermelho | Cancelamento e erro |
| `warning` | âmbar | Avisos operacionais |
| `ring` | verde profundo | Foco visível |

### 3.3 Proporção de uso

- 60–70%: branco e superfícies claras.
- 20–30%: verde institucional.
- Até 10%: dourado, sucesso e cores de estado.

Evite telas dominadas por gradientes ou múltiplas cores saturadas. O dourado é um acento, não um fundo padrão para conteúdo longo.

## 4. Tipografia

### 4.1 Famílias

| Papel | Família | Pesos usuais |
| --- | --- | --- |
| Títulos | Outfit | 600, 700, 800 |
| Corpo e controles | Inter | 400, 500, 600, 700 |

As fontes são carregadas no `<head>` pela rota raiz; não devem ser importadas por URL no CSS.

### 4.2 Hierarquia

- **H1 público:** 36–60 px conforme o contexto, peso 800/900, linha curta.
- **H1 interno:** 30–36 px, peso 800/900.
- **H2:** 24–36 px, peso 700/800.
- **H3:** 18–24 px, peso 700.
- **Corpo:** 14–16 px, entrelinha confortável.
- **Legenda:** 11–13 px, sem sacrificar contraste.
- **Eyebrow:** 10–12 px, caixa alta e espaçamento entre letras apenas em rótulos curtos.
- **Valores:** algarismos tabulares quando mudam dinamicamente.

Não reduzir textos essenciais abaixo de 12 px em dispositivos móveis. Evite blocos extensos em caixa alta.

## 5. Espaçamento e composição

### 5.1 Contêineres

- Conteúdo amplo: `max-w-7xl`.
- Conteúdo editorial: `max-w-4xl`.
- Checkout e confirmação: `max-w-xl`.
- Margens laterais: 16 px no celular, 24–32 px em telas maiores.

### 5.2 Ritmo

- Espaçamento interno compacto: 8–12 px.
- Espaçamento de controle: 12–16 px.
- Blocos relacionados: 24–32 px.
- Seções: 48–80 px.

### 5.3 Bordas e cantos

O token-base é `1rem` (16 px).

| Contexto | Raio |
| --- | --- |
| Botões e campos | 8–16 px |
| Cartões comuns | 12–16 px |
| Painéis de destaque | 24–32 px |
| Chips circulares | `rounded-full` |

Não aninhar múltiplos cartões decorativos sem necessidade. Em páginas públicas, painéis maiores podem usar cantos mais generosos; tabelas administrativas devem permanecer compactas.

## 6. Elevação e superfícies

### Utilitários globais

- `shadow-premium`: elevação suave para cartões importantes.
- `shadow-glass`: elevação discreta de superfícies translúcidas.
- `glass-morphism`: branco translúcido, blur de 12 px e borda clara.
- `bg-gradient-premium`: verde profundo até verde médio.
- `bg-gradient-subtle`: transição branca para leve verde.
- `bg-mesh`: textura radial muito sutil em verde e dourado.

Use sombra somente para indicar hierarquia. Listas longas, tabelas e seções inteiras não precisam parecer flutuantes.

## 7. Componentes fundamentais

### 7.1 Botões

O componente oficial é `src/components/ui/button.tsx`.

| Variante | Uso |
| --- | --- |
| `default` | Ação principal e confirmação |
| `secondary` | Ação de apoio |
| `outline` | Ação alternativa sem competir com a principal |
| `ghost` | Navegação ou ação discreta |
| `destructive` | Cancelar, excluir ou ação irreversível |
| `link` | Navegação textual |

Regras:

- Área mínima de toque de 44 × 44 px.
- Ícone antes do texto para indicar ação; ícone isolado exige `aria-label` ou tooltip.
- Um único CTA dominante por bloco.
- Estado desabilitado deve bloquear interação e reduzir opacidade.
- Pressão usa escala breve; evitar movimentos contínuos em ações comuns.

### 7.2 Campos e formulários

- Label sempre associado ao controle.
- Texto de ajuda abaixo do campo, não dentro do valor.
- Erro próximo ao campo e toast apenas para resumo.
- Valores monetários seguem `pt-BR`.
- Datas são exibidas no padrão brasileiro e persistidas como timestamps.
- Upload apresenta prévia 16:9 e ação clara de remoção.

### 7.3 Cartões

Cartões são reservados para unidades reais: campanha, prêmio, resumo, modal e ferramenta. Seções editoriais não devem virar uma sucessão de caixas sem função.

Estrutura recomendada:

1. Rótulo ou ícone contextual.
2. Título objetivo.
3. Conteúdo principal.
4. Metadados.
5. Ação no final.

### 7.4 Diálogos e sheets

- `Dialog` para confirmação, compra, vencedor e melhor vendedor.
- `Sheet` para navegação móvel.
- Foco, escape e retorno ao gatilho ficam a cargo das primitivas Radix.
- Modais festivos permanecem estáveis; apenas a borda e elementos externos podem animar.

### 7.5 Tabelas

- Cabeçalho contrastante e alinhamento consistente.
- Valores monetários e quantidades alinhados à direita.
- Números podem usar badges compactas.
- Envolver em `overflow-x-auto` no celular.
- Para ações por linha, preservar rótulos ou tooltips claros.

## 8. Padrões de domínio

### 8.1 Grade de números

- Dimensão estável com `aspect-square`.
- Grade adapta de 5/6 colunas no celular até 12 ou mais em telas largas.
- Formatação com zeros à esquerda acompanha o total da campanha.
- Estados devem combinar cor, borda e contraste, nunca somente cor.

| Estado | Aparência esperada |
| --- | --- |
| Disponível | Superfície clara, texto legível, interação disponível |
| Selecionado | Verde institucional com contraste alto |
| Reservado | Estado intermediário visualmente indisponível |
| Vendido | Inativo para compra; forte no contexto do sorteador |
| Vencedor | Verde de sucesso, escala e realce celebrativo |

### 8.2 Promoções

- Mostrar a oferta perto da seleção.
- Destacar a faixa somente quando a quantidade exata for atingida.
- Exibir valor regular riscado, valor final e economia.
- Dourado identifica vantagem; verde continua sendo a cor da ação.

### 8.3 Checkout

- Valor final é o elemento mais forte.
- QR Code mantém área quadrada estável.
- Contador usa algarismos tabulares.
- Abaixo de 60 segundos, o aviso assume cor destrutiva.
- Código copia e cola deve ter botão de cópia separado.
- Cancelamento precisa explicar que os números serão liberados.

### 8.4 Bilhete

- Formato fixo de 720 px para renderização consistente.
- Banner 16:9, marca, mensagem de gratidão e dados essenciais.
- Números com forte contraste e largura mínima estável.
- Código curto deriva do pedido apenas para referência visual; não substitui o UUID.
- PNG renderizado em 2× para leitura em celulares.

### 8.5 Sorteio e ranking

- Verde e dourado formam a base festiva.
- Botão principal usa pulso lento e borda animada, sem rotação do conteúdo.
- Números vendidos aparecem fortes; não vendidos, em cinza claro.
- Modal final permanece parado e legível.
- Confetes e som ocorrem somente após ação explícita ou confirmação importante.

## 9. Animações

| Classe/efeito | Duração | Finalidade |
| --- | --- | --- |
| `hover-premium` | 500 ms | Mudança refinada de estado |
| `stagger-in` / `slide-up` | 1 s | Entrada progressiva de conteúdo |
| `animate-float` | 6 s | Elemento decorativo ocasional |
| `slow-pulse` | 2,4 s | CTA excepcional de ranking/sorteio |
| `animated-border` | 4 s | Borda festiva multicolorida |
| `animated-border-gold` | 3 s | CTA promocional ou principal |

### Redução de movimento

Toda evolução deve incluir uma variante global:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}
```

Confetes, transições de 30 segundos e áudio devem ter alternativa ou ser reduzidos quando essa preferência estiver ativa.

## 10. Responsividade

Breakpoints usados:

| Nome | Largura mínima | Estratégia |
| --- | --- | --- |
| Base | abaixo de 640 px | Coluna única e controles para toque |
| `sm` | 640 px | Espaçamento maior e grades ampliadas |
| `md` | 768 px | Navegação desktop e painéis lado a lado |
| `lg` | 1024 px | Layouts administrativos completos |
| `xl` | 1280 px | Aproveitamento do contêiner máximo |

Regras:

- Construir primeiro para celular.
- Evitar larguras fixas, exceto mídia exportável como o bilhete.
- Tabelas extensas devem rolar horizontalmente.
- Textos e botões não podem estourar a largura.
- Imagens de banner preservam proporção; não cortar informação essencial.
- Navegação móvel deve manter acesso ao login administrativo.

## 11. Acessibilidade

### Requisitos mínimos

- Um único `h1` por página.
- Ordem de títulos sem saltos arbitrários.
- Texto alternativo descritivo em imagens relevantes.
- Imagens decorativas com `alt=""`.
- Foco visível com token `ring`.
- Alvos de toque com pelo menos 44 px.
- Contraste adequado entre texto e superfície.
- Labels em formulários.
- `aria-label` em botões apenas com ícone.
- Navegação completa por teclado em menus e modais.
- Mensagens de estado que não dependam apenas de cor.

### Conteúdo dinâmico

- Toasts comunicam sucesso/erro, mas informações essenciais também devem permanecer na tela.
- Contadores não devem causar deslocamento; usar `tabular-nums`.
- Estados de carregamento precisam de texto ou nome acessível.
- Confetes são decorativos e não podem bloquear controles.

## 12. Voz e conteúdo

### Tom

- Acolhedor e respeitoso.
- Transparente em preço, prazo e destino social.
- Celebrativo depois da ação, nunca manipulativo antes do pagamento.
- Português brasileiro simples.

### Vocabulário consistente

| Preferir | Evitar |
| --- | --- |
| Participar | Apostar |
| Número da sorte / cota | Produto |
| Campanha solidária | Promoção agressiva |
| Valor pago | Taxa obscura |
| Reserva expirada | Erro desconhecido |
| Bilhete comprovante | Recibo técnico |

Mensagens de erro devem explicar o impacto e a próxima ação. Exemplo: “A reserva expirou e os números foram liberados. Escolha novamente para gerar um novo PIX.”

## 13. Identidade e ativos

Ativos principais:

- Logo quadrada colorida no cabeçalho.
- Logo branca horizontal no rodapé.
- Logo colorida no bilhete.
- Logos dos projetos sociais em superfícies bege claras.
- Logo do Mercado Pago discreta no rodapé.
- Banner institucional da Rifa Solidária.

Não aplicar filtros que alterem a versão colorida da marca. Manter espaço livre ao redor das logos e preservar proporção com `object-contain`.

## 14. Checklist para revisão visual

- [ ] Tokens semânticos foram usados no lugar de cores isoladas?
- [ ] Existe uma hierarquia clara de título, conteúdo e ação?
- [ ] Há somente um CTA dominante por contexto?
- [ ] O layout funciona em 375 px e 1280 px?
- [ ] Nenhum texto está cortado, sobreposto ou comprimido?
- [ ] Imagens preservam informações importantes?
- [ ] Estados de foco, desabilitado, carregando e erro estão visíveis?
- [ ] Ícones isolados têm nome acessível?
- [ ] A animação tem propósito e respeita redução de movimento?
- [ ] A nova interface parece parte da Reviva Brasil, não um tema genérico?
