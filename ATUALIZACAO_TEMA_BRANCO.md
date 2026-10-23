# BIF — Tema claro executivo | 23/10/2026

## O que foi atualizado

O tema **Claro** recebeu uma revisão visual global, aplicada pelo seletor de temas já existente e compartilhada entre as telas do portal que carregam `tema-bif.css`.

- **Plano de fundo:** cinza muito claro e neutro, sem predominância bege/amarela.
- **Superfícies:** cards, formulários, tabelas e modais brancos, com separação e profundidade discretas.
- **Hierarquia de textos:** títulos azul-marinho, conteúdo cinza-azulado e informações auxiliares em tons mais suaves.
- **Navegação:** cabeçalhos e filtros claros, divisórias delicadas e maior nitidez visual.
- **Interação:** ações principais em azul-marinho, ações secundárias neutras, estados ativos definidos e foco acessível.
- **Cores de status:** verde, azul, amarelo e vermelho usados exclusivamente para indicar significado.
- **Identidade:** dourado mais contido, reservado para detalhes e pontos de atenção.
- **Alternância:** o tema escuro foi preservado; a escolha continua armazenada no navegador.

## Arquivos alterados

- `tema-bif.css`: nova camada **Tema Claro 9 — Interface Executiva**, com tokens e estilos compartilhados.
- `tema-bif.js`: atualização da cor da interface do navegador para o novo fundo claro.
- Páginas `.html` integradas ao tema: atualização dos parâmetros de versão dos arquivos CSS/JS para evitar que o navegador mantenha o visual anterior em cache.

## Como conferir

1. Abrir `index.html` em ambiente onde o portal já costuma ser executado.
2. Selecionar **Claro** no alternador de tema.
3. Verificar página inicial, painel, tarefas e os demais módulos.
4. Alternar para **Escuro** e confirmar que as configurações originais permanecem disponíveis.

**Observação:** telas avulsas que não carregam o gerenciador global de temas permanecem com seus estilos próprios. Não houve alteração de rotinas de negócio ou integrações.
