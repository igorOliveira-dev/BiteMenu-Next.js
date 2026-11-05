# Plano: nova identidade visual no painel e no resto do site

## Visão geral
Levar para todo o site o visual da `LandingPageV2`, definido no alinhamento visual da Duda: paleta "granada e brasa",
Plus Jakarta Sans, blocos arredondados e linhas finas, sem glow e sem azul de software. Só muda a aparência: nenhuma
lógica, texto ou fluxo é alterado.

Primeiro troca a base global, que já muda quase tudo de uma vez. Depois vem o shell do painel, seguido de um ponto de
revisão, e só então o ajuste tela por tela.

**Fora do escopo:** reescrita de textos (direção de escrita), fotos, Instagram, e-mails transacionais, layout das telas,
lógica de Supabase e ValidaPay.

## Referências
- **`APRESENTAÇÃO · ALINHAMENTO VISUAL.pdf`:** cores (p. 17), contrastes e modo escuro (p. 20), tipografia (p. 22).
  A prévia do site (p. 33) não traz imagens no PDF, então a referência visual é a landing V2.
- **`src/app/landingPage/LandingPageV2.jsx` e o fim de `globals.css`:** tokens `brand-*` e classes que já existem.
- **`tasks/archive/dashboard-redesign-plan.md`:** único `.md` sobre design. A regra "cores não mudam" era daquele trabalho
  e deixa de valer aqui. Continuam valendo a sidebar recolhível e o `<main>` com `flex-1 min-w-0`. O README e o CLAUDE.md
  não têm regras de design.

## Como está hoje (lido no código)
- `.brand-scope` só é usado na landing e redefine 4 variáveis no próprio elemento. Portais em `body` (7 arquivos) e os
  providers do root (Alert, Confirm, CookieBanner) ficariam de fora se cada tela fosse apenas envolvida nessa classe.
- O painel usa muito os tokens antigos: cerca de 277 `bg-translucid` e `bg-[var(--translucid)]`, 267 bordas com
  `--translucid`, 59 `--gray` e 28 `--low-gray`. Trocar os valores desses tokens alcança quase tudo.
- O cardápio público usa as cores do dono via `style`. Dos tokens globais, quase só usa `border-translucid` (4 usos) e
  `--shadow` (3 usos), então o risco da troca é baixo.
- Ação principal em azul: `bg-blue-*`, `ring-blue-*` e `#155dfc` em `getstart`. Por arquivo: Orders 16, docs/planos 14,
  register 13, MenuItems 13.
- O logo do header está em `LogoMarca-sem-fundo.png`. O `BrandLogo` da landing usa `public/brand/logo-sino.png`.
- O manifest do PWA usa `#060606` como cor de fundo e de tema.

## Decisões
- **Trocar os valores dos tokens globais em vez de envolver cada tela.** `:root` e `[data-theme]` recebem os valores da
  marca, e isso alcança portais e providers. É a menor mudança possível e reaproveita o que já existe.
- **`--translucid` continua sendo um valor só**, usado em fundo e borda: 10% de grafite no claro e 10% de creme no escuro.
- **`.bg-translucid` passa a ser `--brand-surface`**, o que deixa os painéis brancos sobre o creme, como na landing.
  `bg-[var(--translucid)]` continua como tom suave para elementos aninhados.
- **Fonte:** Jakarta no `body`. O cardápio público mantém Arial com `body:has(.public-menu)`, regra que também cobre o
  `CartDrawer` em portal. A prévia dentro do painel mantém Arial com uma classe no wrapper.
- **Cardápio público:** muda só o logo do rodapé (decisão sua).
- **Tipografia e paleta:** opção 1 (sem itálico) e paleta A, como já está na landing V2.
- **Modo escuro continua:** fundo `#1C1716`, texto vermelho `#F0605A`, botão `#D42020`. Vermelho em texto pequeno usa
  `text-brand-red`, que se adapta ao tema, nunca `text-bite`.
- **Sem componente genérico novo.** A única extração é `BrandLogo`, hoje dentro da landing e necessário em várias telas.

### Valores derivados (não estão no PDF, ajustar no Checkpoint 1)
| Token | Claro | Escuro |
|---|---|---|
| `--background` | `#fbf5ef` | `#1c1716` |
| `--foreground` | `#2a2220` | `#fbf5ef` |
| `--gray` | `#5f524d` | `#c9bdb7` |
| `--low-gray` | `#e8dfd8` | `#3a302d` |
| `--medium-gray` | `#b8aca5` | `#141010` |
| `--low-translucid` | `#2a22200a` | `#fbf5ef0a` |
| `--translucid` | `#2a22201a` | `#fbf5ef1a` |
| `--high-translucid` | `#2a222052` | `#fbf5ef52` |
| `--shadow` | `#2a222026` | `#00000066` |

### Regras de troca nas telas
| Hoje | Vira |
|---|---|
| Ação principal azul (`bg-blue-600...`) | `cta-button` ou `bg-bite text-white` |
| Link ou destaque azul (`text-blue-*`) | `text-brand-red` |
| Foco azul (`ring-blue-*`, `#155dfc`) | `ring-bite`, `#d42020` |
| Seleção azul (`bg-blue-600/30`) | `bg-bite/15` |
| `border-2` em cards e painéis | `border` |
| Card da página | `rounded-2xl` (`rounded-card` fica só para blocos grandes) |
| Input | `rounded-xl` |
| Botão principal | pílula (via `cta-button`) |
| `glow-red`, sombra escura | sem brilho, linha fina |

Continuam como estão, porque têm função: verde (WhatsApp e sucesso), âmbar (aviso), vermelho (erro e status de pedido),
as cores escolhidas pelo dono, os valores salvos em `consts/colorPallets.jsx` e o CSS de impressão.

## Tarefas
Detalhes em `tasks/identidade-visual/todo.md`.

### Fase 1: Base e shell
- [ ] Task 1: Tokens e fonte globais
- [ ] Task 2: Botões, controles e modais globais
- [ ] Task 3: `BrandLogo` e shell do painel
- [ ] **Checkpoint 1: revisão visual sua antes de mexer nas telas**

### Fase 2: Abas do painel
- [ ] Task 4: Aba Cardápio
- [ ] Task 5: Configurar cardápio
- [ ] Task 6: Pedidos, cozinha e entrega
- [ ] Task 7: Vendas e gráficos
- [ ] Task 8: Mesas, Estoque, Equipe, WhatsApp e Conta
- [ ] Task 9: Planos e avisos de upgrade
- [ ] **Checkpoint 2: painel completo**

### Fase 3: Resto do site
- [ ] Task 10: Login, cadastro e senha
- [ ] Task 11: Onboarding e pesquisa de perfil
- [ ] Task 12: Páginas institucionais
- [ ] Task 13: Páginas legais e de erro
- [ ] Task 14: Documentação
- [ ] Task 15: Admin
- [ ] Task 16: Rodapé do cardápio e manifest do PWA
- [ ] **Checkpoint 3: completo**

## Riscos
| Risco | Impacto | Mitigação |
|---|---|---|
| Painel é a ferramenta diária de quem já paga e a troca global afeta tudo de uma vez | Alto | Checkpoint 1 antes das telas; screenshots de todas as abas |
| `.bg-translucid` opaco cobre algo que dependia da transparência (sobre banner ou imagem) | Médio | Conferir na Task 1; nesses pontos, usar `bg-[var(--translucid)]` |
| Editar telas de auth e planos e alterar lógica sem querer | Alto | Só `className` e cor em `style`; revisar o `git diff` de cada task |
| Prévia no painel diferente do cardápio real | Médio | Prévia mantém Arial e cores do dono; comparar lado a lado na Task 4 |
| Rodapé vermelho sem contraste em cardápio com fundo escuro ou vermelho | Médio | Versão monocromática quando o contraste for ruim (`getContrastTextColor` já existe) |
| Vermelho sem contraste no modo escuro | Médio | Texto com `text-brand-red`; conferir nos dois temas |
| Arquivos enormes (`MenuItems` 3000+ linhas, `Orders` 1900) | Médio | Só classes e cor; uma área por task |
| Jakarta é mais larga que Arial e pode quebrar telas apertadas | Baixo | Screenshots em 390px em toda task |

## Perguntas em aberto
Nenhuma bloqueia o início. A apresentação ainda pede feedback ("Aguardo seu feedback"), então o plano assume que a
paleta A e a Jakarta estão aprovadas, já que é o que a landing V2 usa.

A troca para `LandingPageV2` em `src/app/page.jsx` segue sem commit e não será incluída nos commits deste plano sem
pedido seu.
