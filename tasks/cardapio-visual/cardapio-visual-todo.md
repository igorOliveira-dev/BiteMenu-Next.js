# Todo: identidade visual nos elementos do cardápio público

Regras de troca em `tasks/cardapio-visual/cardapio-visual-plan.md`.

Verificação em toda task:
- `npm run build` passa
- `git diff` só tem `className`: nenhuma mudança em `style`, cor do dono, texto ou lógica
- Conferir em 320px, 390px e 1440px, com um cardápio de fundo claro e um de fundo escuro
- A organização do layout fica igual (comparar antes e depois)

### Task 1: Fonte do cardápio e da prévia
**Descrição:** Apagar a regra de Arial em `globals.css:213-222` (`body:has(.public-menu)`, `.menu-font` e o
`.menu-font .fixed`/`.panel-font`, que deixa de ter efeito). O `bg-translucid` do cardápio não muda.
**Critérios de aceite:**
- [ ] Cardápio, carrinho em portal e prévia do painel em Jakarta
- [ ] Nome da loja, item e preço sem overflow em 320px
**Arquivos:** `src/app/globals.css` · **Tamanho:** XS · **Dependências:** nenhuma

### Task 2: Layout 1
**Descrição:** Aplicar a tabela de troca em `ClientMenu.jsx`: cabeçalho, busca, abas, destaques, cards de item,
botão do carrinho flutuante, modal de horários, modal do item (variações, − e +, adicionar) e o zoom da imagem.
**Critérios de aceite:**
- [ ] Mesma organização de antes; só formas, linhas e peso de fonte mudam
- [ ] Cores do dono intactas (o `style` só foi tocado para o fundo semitransparente e para o − / +, sempre com cores derivadas do dono)
- [x] Sem `bg-red-*`, `bg-green-*`, `shadow-[` ou `hover:scale-110` no arquivo
**Arquivos:** `src/app/menu/[slug]/ClientMenu.jsx` · **Tamanho:** S · **Dependências:** Task 1

### Checkpoint 1
- [x] Build limpo
- [ ] Layout 1 claro e escuro, no celular e no desktop
- [ ] **Sua aprovação antes das Tasks 3 a 5**

### Task 3: Layout 2
**Descrição:** A mesma troca da Task 2 em `ClientMenu2.jsx`; o logo redondo passa de `border-4` para `border-2`.
**Critérios de aceite:** os mesmos da Task 2.
**Arquivos:** `src/app/menu/[slug]/ClientMenu2.jsx` · **Tamanho:** S · **Dependências:** Checkpoint 1

### Task 4: Layout 3
**Descrição:** A mesma troca da Task 2 em `ClientMenu3.jsx`.
**Critérios de aceite:** os mesmos da Task 2.
**Arquivos:** `src/app/menu/[slug]/ClientMenu3.jsx` · **Tamanho:** S · **Dependências:** Checkpoint 1

### Task 5: Carrinho e checkout
**Descrição:** Aplicar a tabela em `CartDrawer.jsx`: botões em pílula, inputs e modal arredondados, remover item com
contorno (vermelho só no hover) e a lista de endereço com linha fina no lugar de `shadow-lg`. A lógica de pedido e de
Pix não muda.
**Critérios de aceite:**
- [ ] Pedido pelo WhatsApp e pelo painel até a tela final, sem diferença de comportamento
- [ ] Pix (QR e copia-e-cola) com a mesma aparência de cores
- [ ] `git diff` só com `className`
**Arquivos:** `src/app/menu/[slug]/components/CartDrawer.jsx` · **Tamanho:** M · **Dependências:** Checkpoint 1

### Task 6: Modais menores e `.md`
**Descrição:** Aplicar os raios em `MyOrdersModal.jsx` e `VariationPicker.jsx`. No resumo da identidade visual,
trocar a linha "Cardápio público: mantém fonte e cores atuais" pela regra nova.
**Arquivos:** `src/app/menu/[slug]/components/MyOrdersModal.jsx`,
`src/app/menu/[slug]/components/VariationPicker.jsx`, `tasks/identidade-visual/identidade-visual-resumo.md`,
`tasks/README.md` · **Tamanho:** S · **Dependências:** Tasks 2 a 5

### Checkpoint 2
- [x] Build limpo
- [ ] Os 3 layouts com o carrinho aberto, claro e escuro, no celular e no desktop
- [ ] Prévia do painel igual ao cardápio real
- [ ] Sua revisão antes do commit
