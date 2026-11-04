# Plano: registro e login de usuário comum

## Visão geral
Separar o cadastro e o login do usuário comum (cliente) do cadastro e login do dono de estabelecimento. Primeiro passo:
abas dentro do container de registro que já existe, para alternar entre "Estabelecimento" e "Cliente".

Tarefas em `tasks/login-usuario/login-usuario-todo.md`.

## Como está hoje (lido no código)
- `src/app/register/page.jsx`: um formulário só. Cria o usuário no auth e a linha em `profiles` (nome, telefone,
  aceite de privacidade, origem) e redireciona para `/getstart`.
- `src/app/login/page.jsx:57`: sempre redireciona para `/getstart`.
- **`profiles.role` já está ocupado.** Guarda o plano (`free`, `plus`, `pro`, `business`) e marca o `admin`. O webhook e
  o cancelamento do ValidaPay escrevem nele (`api/validapay/webhook/route.js:125`). O tipo de conta **não pode** ir no `role`.

## Decisões
- **Coluna nova `profiles.account_type`** (`'owner'` | `'customer'`), com padrão `'owner'`. As contas existentes
  continuam donas, sem migrar nada. Mudança no Supabase: **SQL manual**, o arquivo fica em `tasks/login-usuario/account-type.sql`.
- **Abas no container que já existe** em `/register`: `useState("owner" | "customer")` e dois botões no topo. O
  formulário de estabelecimento continua igual.
- **O formulário de cliente reaproveita o `handleSignUp`**, com dois ramos: grava `account_type: 'customer'` e, no fim,
  redireciona para outro lugar em vez de `/getstart`.
- A aba pode abrir pela URL (`/register?tipo=cliente`), para o cardápio linkar direto depois.

## Lista de tarefas
- [ ] Tarefa 1: SQL da coluna `account_type` (manual)
- [x] Tarefa 2: Abas no registro
- [x] Tarefa 3: Cadastro de cliente funcionando
- [ ] Checkpoint 1
- [x] Tarefa 4: Login respeita o tipo de conta (toca autenticação: diff aprovado antes)
- [ ] Checkpoint 2
- [x] Tarefa 5: Banco recusa cardápio de conta cliente (SQL escrito; rodar manualmente: `tasks/login-usuario/account-type-menu-guard.sql`)

### Fase 2: área do cliente
- [x] Tarefa 6: Círculo da conta na navbar (Perfil, Histórico de pedidos, Sair)
- [x] Tarefa 7: Página `/conta` com barra lateral (Perfil, Dados pessoais, Histórico de pedidos)
- [x] Tarefa 8: CEP no cadastro de cliente (SQL manual: `tasks/login-usuario/profile-cep.sql`)
- [x] Tarefa 9: Dados pessoais já preenchidos com os dados do cadastro
- [x] Tarefa 10: Botão de conta nos cardápios públicos (`/menu/[slug]`)
- [x] Tarefa 11: Link para o estabelecimento no histórico (abre em nova guia)
- [x] Tarefa 12: Conteúdo centralizado em telas grandes (`/conta` e dashboard)

### SQL pendente (rodar no Supabase, nesta ordem, antes de publicar)
- [ ] `tasks/login-usuario/account-type.sql`: coluna `profiles.account_type` + grant de insert
- [ ] `tasks/login-usuario/account-type-menu-guard.sql`: trigger que impede cliente de criar cardápio
- [ ] `tasks/login-usuario/profile-cep.sql`: coluna `profiles.cep` + grants (sem ela, o cadastro de cliente falha)

## Decisões da fase 2
- **Navbar:** `CustomerMenu` reaproveita o `ActionMenu` (ganhou `children` para trocar os 3 pontinhos por um avatar).
  Só aparece para `account_type = 'customer'`; dono e visitante veem o botão de antes.
- **`/conta`:** mesmo visual do dashboard (lateral no desktop, barra fixa embaixo no celular). A seção abre por
  `?aba=perfil|dados|pedidos`. O Perfil é a aba `Account` do painel, sem Plano e Equipe para cliente.
- **Histórico e Dados pessoais ficam no aparelho (localStorage):** histórico = `bite_menu_receipts_v1` (até 4 por
  cardápio); dados = `customerInfo`, a mesma chave que o carrinho usa para preencher o pedido. Os pedidos novos guardam
  `menuSlug`; os antigos buscam o slug em `menus` pelo id.
- **Dados pessoais:** aparelho primeiro; o que faltar vem do cadastro (nome, telefone, CEP), e o CEP completa o endereço
  pelo ViaCEP.
- **Cardápio público:** `MenuAccountButton` entra uma vez em `menu/[slug]/page.jsx` (vale para os 3 layouts), no topo da
  página e sem ficar fixo, para não cobrir a barra de categorias. Visitante vê "Entrar"
  (`/login?tipo=cliente&next=/menu/<slug>`), e login e cadastro repassam `?tipo=` e `?next=` entre si.
- **Sair** recarrega a página atual em vez de mandar para `/`.
- **Centralização:** no dashboard, cada aba sem painel à direita fica numa caixa `mx-auto` com a largura máxima que já
  usava. Cardápio e Pedidos não mudam; Cozinha e Entrega não foram conferidas.

## Riscos
| Risco | Impacto | Como evitar |
|---|---|---|
| Usar `role` para o tipo e o ValidaPay sobrescrever | Alto | Coluna separada, `account_type` |
| Policy RLS de insert em `profiles` bloquear a coluna nova | Médio | Conferir as policies antes da Tarefa 3 |
| Cliente chegar no `/getstart` e criar cardápio | Médio | Tarefa 4 barra |
| Telefone único: um dono que também quer ser cliente não consegue | Médio | Pergunta 3 |
| Histórico e dados pessoais só no aparelho: trocou de celular, perdeu | Médio | Gravar o id do cliente em `orders` (SQL + RLS) |
| RLS de `menus` pode não deixar o cliente ler `slug` | Baixo | Pedidos antigos ficam sem link; os novos não dependem disso |
| Publicar sem `profile-cep.sql` | Alto | O cadastro de cliente falha; rodar o SQL antes do deploy |

## Perguntas em aberto
1. ~~Para onde vai o cliente?~~ **Decidido:** volta para `?next=` (só caminho interno); sem ele, vai para `/`.
2. **Quais campos o cliente preenche?** Sugestão: os mesmos (nome, telefone, email, senha). O telefone ajuda nos pedidos.
3. **A mesma pessoa pode ser dona e cliente?** Com uma conta só por email/telefone, não pode. Sugestão: aceitar essa
   limitação por enquanto.
