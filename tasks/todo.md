# Todo: barra lateral direita recolhível

Sem testes automatizados no projeto: verificação = `npm run build` (lint quebrado no Next 16) + checagem manual
com a skill `run-bitemenu` (screenshots desktop 1440px e 1024px, temas claro e escuro).

## Fase 1: Recolher

### Task 1: Recolher/expandir a barra direita + lembrar o estado
**Descrição:** Em `Menu.jsx`, estado `collapsed` com `localStorage` (`dashboard-rightbar-collapsed`, leitura em
`useEffect`, try/catch), igual à esquerda. Botão chevron no topo do `<aside>` no mesmo estilo da esquerda
(`aria-expanded`, `aria-label`, `title`). Largura `w-[calc(30dvw-36px)]` ↔ `w-16` com transição; preview do
cardápio acompanha a largura. Recolhida, por enquanto, só esconde o conteúdo das seções.

**Critérios de aceite:**
- [x] Clicar no chevron alterna larga ↔ estreita; o preview ocupa o espaço liberado sem sobrepor a barra
- [x] Recarregar mantém o estado; sem warning de hidratação
- [x] Mobile (< lg) idêntico ao atual (só classes `lg:`; não fotografado)

**Verificação:**
- [x] `npm run build` passa
- [x] Manual: screenshot em 1280px nos dois estados, com a sidebar esquerda recolhida e expandida (1024px fica pro checkpoint)

**Dependências:** nenhuma
**Arquivos:** `src/app/dashboard/tabs/Menu.jsx`
**Tamanho:** S

### Task 2: Conteúdo recolhido — compartilhar e configurações
**Descrição:** Recolhida: botão só com `FaQrcode` (mesmo verde, abre `QrCodeModal`) no topo, e no fim (`mt-auto`)
botão só com `FiSettings` indo pra `configMenu`. Mesma classe de item da esquerda (quadrado, `rounded-lg`,
centralizado), `title`/`aria-label` com o nome.

**Critérios de aceite:**
- [x] Recolhida: ícone de compartilhar abre o modal de QR; ícone de configurações abre a aba de configuração
- [x] Passar o mouse mostra o nome; navegação por Tab com foco visível (regra global `:focus-visible`)
- [x] Expandida: igual a hoje

**Verificação:**
- [x] `npm run build` passa
- [x] Manual: clicar nos dois ícones recolhida, claro e escuro

**Dependências:** Task 1
**Arquivos:** `src/app/dashboard/tabs/Menu.jsx`
**Tamanho:** XS

### Checkpoint: Fase 1
- [ ] Build limpo; barra recolhe/expande e lembra o estado
- [ ] Revisão com você antes das cores

## Fase 2: Cores

### Task 3: Quadrados de cor com popover
**Descrição:** Recolhida: entre compartilhar e configurações, os 3 quadrados (`h-8 w-8 rounded-lg`, os mesmos de hoje),
sem rótulo nem "Sugerir cores". Clicar abre um popover à esquerda (`absolute right-full mr-2`, `bg-translucid`
+ borda + sombra como o aside) com o `HexColorPicker` + `HexColorInput` existentes. Reaproveita `openColorIdx`
e o clique-fora do `colorListRef`. `overflow-visible` no aside quando recolhida.

**Critérios de aceite:**
- [ ] Clicar num quadrado abre o seletor ao lado, sem cortar; trocar a cor atualiza o preview na hora
- [ ] Clicar fora ou no mesmo quadrado fecha; clicar em outro troca
- [ ] Expandir a barra com um popover aberto não quebra nada (fecha ou vira o seletor inline)

**Verificação:**
- [ ] `npm run build` passa
- [ ] Manual: as 3 cores recolhida em 1440px e numa tela baixa (~700px de altura), claro e escuro; salvar alterações funciona

**Dependências:** Checkpoint Fase 1
**Arquivos:** `src/app/dashboard/tabs/Menu.jsx`
**Tamanho:** S

### Checkpoint: Completo
- [ ] `npm run build` limpo
- [ ] Combinações das duas barras (recolhida/expandida) em 1440px e 1024px, claro e escuro
- [ ] `git diff` sem cores novas
- [ ] `graphify update .`
- [ ] Pronto pra revisão
