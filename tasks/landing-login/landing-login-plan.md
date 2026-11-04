# Plano: botão de login no navbar da landing e fechamento da identidade visual

## Visão geral
No navbar da landing (`LandingPageV2`), o botão "Criar cardápio grátis" é substituído por um botão "Entrar". Também
são corrigidos os pontos que ainda estão fora da nova identidade visual. Só muda a aparência das partes globais do site:
cores, fontes e layout escolhidos pelo estabelecimento no cardápio continuam como estão.

**Fora do escopo:** lógica de login (Supabase), cadastro, checkout e ValidaPay; cores e layout do cardápio
escolhidos pelo dono; `LandingPageV1.jsx` (não é mais usada na home).

## Referências
- `tasks/identidade-visual/identidade-visual-resumo.md`: paleta, papel de cada cor e regras dos botões.
- `tasks/identidade-visual/plan.md`: regras de troca e o que fica de fora de propósito (cores do dono, cardápio público).
- `tasks/login-usuario/login-usuario-plan.md`: o `/login` atende dono e cliente, com `?tipo=` e `?next=`.

## Como está hoje (lido no código)
- Navbar em `src/app/landingPage/LandingPageV2.jsx:184-203`:
  - visitante: "Descobrir" e "Criar cardápio grátis" (`cta-button small`, vai para `/register`);
  - dono logado: "Acessar cardápio" (`/dashboard`);
  - cliente logado: `CustomerMenu`, e a página redireciona para `/descobrir`.
- "Criar cardápio grátis" continua no hero (linha 229) e no CTA final (linha 516), então o cadastro de dono não perde
  a entrada.
- Outros botões "Entrar" do site: em `/descobrir` (ícone `FaUser` e texto, sem fundo) e no cardápio
  (`MenuAccountButton`, vidro escuro sobre a foto). O botão de enviar do `/login` é `bg-verde` (commit `8f30cb9`).
- Busca por `blue-*`, `#155dfc`, `glow-red` e `#060606` em `src` (sem contar a V1): só aparece
  `CartDrawer.jsx:1689`, o `!focus:ring-blue-400` do campo de telefone. Os outros campos do carrinho não têm anel de
  foco.
- Telas criadas depois da identidade (Descobrir, Conta, `CustomerMenu`, `AddressFields`, `OnlinePayment`) já usam
  `brand-*`. O `text-red-500` do `OnlinePayment` é erro ou débito e fica assim, pela regra do vermelho de erro.
- O resumo da identidade ainda lista como pendente a troca da home para a `LandingPageV2`, mas ela já está no commit
  `fcba95f`.

## Decisões
- **O "Entrar" do navbar leva para `/login`, sem `?tipo=`**: a landing atende dono e cliente, e o `/login` já
  identifica o tipo da conta depois do login.
- **Estilo do "Entrar":** pílula verde cheia (`rounded-full bg-verde text-white`) com o ícone `FaUser`, igual ao
  botão "Entrar" do `/login`. Assim o verde continua sendo a cor de entrar e registrar, e o vermelho fica só nos CTAs
  "Criar cardápio grátis" da página. *(Aberto: ver Perguntas.)*
- **Dono logado continua vendo "Acessar cardápio"**: o pedido fala do botão de criar cardápio, que só aparece para
  quem não está logado. O cliente logado também não muda.
- **Foco do telefone no carrinho:** `!focus:ring-blue-400` passa a ser `!focus:ring-current`. O anel segue a cor do
  texto que o dono escolheu, em vez de usar azul fixo ou o vermelho da marca, que não combinariam com o cardápio dele.
  Nada mais muda no cardápio público.
- Sem componente novo: as mudanças ficam só em `className` e texto.

## Tarefas
Detalhes em `tasks/landing-login/landing-login-todo.md`.

- [x] Task 1: Botão "Entrar" no navbar da landing
- [x] Task 2: Anel de foco do telefone no carrinho sem azul
- [x] Task 3: Atualizar os `.md` da identidade visual e de `tasks/`
- [ ] **Checkpoint: build, telas e revisão sua**

## Riscos
| Risco | Impacto | Mitigação |
|---|---|---|
| Menos cadastros, porque o CTA de criar sai do topo | Médio | O CTA continua no hero, logo abaixo, e no fim da página |
| Navbar apertado em 320–390px | Baixo | O "Entrar" é mais curto que o botão atual; conferir em 320px e 390px |
| Mexer sem querer na lógica de `isLogged` / `isCustomer` | Médio | O diff deve mostrar só o ramo do visitante |
| `ring-current` com pouco contraste em algum fundo do dono | Baixo | A cor é a mesma do texto do cardápio, que já é legível sobre esse fundo |

## Perguntas em aberto
- **Cor do "Entrar":** foi escolhido verde cheio. Outra opção é deixar com contorno (`brand-line-button`), igual a
  "Ver cardápio de exemplo".
- **Dono logado:** "Acessar cardápio" continua no navbar? O plano considera que sim.
