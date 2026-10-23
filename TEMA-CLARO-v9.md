# Tema claro v9 — "Papel & Navy" (23/10/2026)

## Direção visual
- Fundo papel neutro-quente (#f5f5f2), cartões brancos com borda fina e sombra curta.
- Tinta azul-marinho (#172a42); ações primárias em navy sólido; dourado só como acento (kickers, barras, logo).
- Semânticas (verde/vermelho/âmbar/azul) escurecidas para contraste AA, com fundos suaves.

## O que mudou
- `tema-bif.css` reescrito do zero (substitui 8 revisões empilhadas, incl. uma paleta navy marcada como "clara").
- `tema-bif.js`: mesma API (`BIFTheme.get/set/toggle/apply`) + `BIFTheme.refresh()`.
  Varredura automática no tema claro: blocos escuros fixos viram cartão claro, véus de modal escurecem
  de leve, gradientes escuros somem, bordas brancas invisíveis viram neutras, texto ilegível ganha
  contraste mantendo o matiz. Proteja um elemento com `data-keep-dark` ou `data-keep-light-text`.
- Removido o bloco "TEMA CLARO BIF" duplicado em 28 páginas: ele sobrepunha o tema global e vazava
  regras para o tema ESCURO (`.btn.primary`, `.btn-green`, `.option.on`…) — botões ilegíveis no escuro
  (ex.: "Gerar tarefas do mês", "Importar texto colado") voltaram ao normal.
- Ajustes próprios dos módulos (Painel, Kanban, Equipes, Acesso, Plano, Calculadora…) mantidos,
  com a paleta bege remapeada para os novos tokens.
- Passaram a respeitar o tema: Certificados, Controle CIAP, Monitor da Reforma, KPI Números,
  Pedido de Emissão de Nota.
- Cache-busting: `?v=20261023-light9`.

## Fora do tema (de propósito)
Capas de fechamento (relatórios para PDF), Renomeador, Gerador de assinatura, Cronograma,
Saneamento Del Fiol, formulários Gurin e Implantação — já têm visual próprio claro/de impressão.
