# Plano: landing page do estabelecimento gerada por IA

## Visão geral
O dono abre a aba **Landing page** no dashboard, descreve o que quer ("página escura, destaque para as pizzas,
botão de pedir no WhatsApp") e a IA do Bite Menu devolve uma página HTML/CSS pronta, com os dados reais do cardápio
(nome, logo, banner, endereço, horário, produtos com foto). O dono vê o preview ao lado do chat, pede ajustes e
clica em **Publicar**. A página fica pública em **`/site/[slug]`**, e os botões dela levam para `/menu/[slug]`.

Vai ser do novo plano **Enterprise**, mas por enquanto fica liberado **só para `admin`**. Ligar o Enterprise depois
é acrescentar `"enterprise"` em `LANDING_ROLES`, uma linha.

Tarefas em `tasks/landing-ia/landing-ia-todo.md`.

**Fora do escopo:** criar o plano Enterprise (ValidaPay, preços, pricing), domínio próprio, JavaScript na landing,
editar o HTML na mão, upload de imagem pelo chat, histórico de versões, analytics da landing, várias páginas por
estabelecimento.

## Como está hoje (lido no código)
- **IA existente** (`src/app/api/assistant/route.js`): SDK `@anthropic-ai/sdk`, modelo `claude-haiku-5-5`, ferramenta
  `propose_changes`, só propõe e o dashboard grava. Autorização em `authorize()` com `AI_PLAN_ROLES`
  (`src/lib/assistant.js`). Limite por sessão na tabela `ai_usage` (`getUsage`, `addUsage`, `usageInfo`, linhas
  345–378), 180 mil tokens a cada 5 h.
- `src/lib/assistant.js` é importado pelo cliente (`AiAssistant.jsx`), então **não pode** importar `supabaseAdmin`.
- **Rotas de API** já usam `maxDuration = 300` (crons), então dá para gerar uma página inteira sem estourar 60 s.
- **Dados do cardápio:** `getMenuBySlug` (`src/app/menu/[slug]/getMenuData.js`) lista as colunas de `menus` uma a
  uma e busca `phone` e `role` do dono com service role (linha 87).
- **Abas do dashboard:** `navItems` em `src/app/dashboard/Dashboard.jsx:229`, arquivos em `src/app/dashboard/tabs/`.
- **Nenhum sanitizador de HTML instalado** (sem DOMPurify/sanitize-html).
- **Plano Enterprise não existe**: `PRICE_IDS`/`TIER` em `src/lib/validapay.js` só têm plus/pro/business.

## Decisões
- **Guardar: 1 coluna `menus.landing_html text`**, `null` = sem landing. Só a versão publicada vai para o banco; o
  rascunho fica no estado da aba até o dono clicar em Publicar. Limite de tamanho no próprio SQL (300 KB).
  SQL manual em `tasks/landing-ia/landing-ia.sql` (regra do `CLAUDE.md`).
- **Publicar** grava pelo client do dono, como o resto do cardápio (policy de update de `menus` já existente).
  O dono conseguir gravar HTML direto pela API do Supabase não é problema: a barreira de segurança é a renderização.
- **Renderizar: route handler `src/app/site/[slug]/route.js`** que devolve o HTML cru (não página React), com
  `Content-Security-Policy`:
  `sandbox allow-popups allow-popups-to-escape-sandbox; default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src https: data:; form-action 'none'; base-uri 'none'; frame-ancestors 'self'`.
  - `sandbox` faz a página rodar em **origem única**: mesmo que passe algum script, ele não lê cookie/sessão do
    `bitemenu`. Sem `allow-scripts`, nenhum JS roda. `form-action 'none'` impede formulário de phishing.
  - Antes de enviar, um strip simples remove `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, atributos
    `on*=` e `javascript:` (defesa extra; quem segura é o CSP). Comentário `shortcut:` no strip.
  - Sem landing, ou dono fora de `LANDING_ROLES` (caiu de plano) → **redireciona para `/menu/[slug]`**. Nada se perde:
    o HTML fica salvo e volta se o plano voltar.
  - Selo fixo "Feito com Bite Menu" injetado pelo servidor no fim do `<body>` (o dono não remove pelo prompt).
- **Preview no dashboard:** `<iframe sandbox="" srcDoc={html}>`, mesmas restrições, sem passar pelo servidor.
- **IA: rota nova `src/app/api/assistant/landing/route.js`** (POST `{ messages, html }`), separada do assistente do
  cardápio: prompt próprio, resposta grande. Reaproveita o mesmo cliente Anthropic, o mesmo modelo e **o mesmo limite
  de sessão `ai_usage`** (gerar landing gasta do mesmo saldo do Bite Menu IA).
  - `getUsage`/`addUsage`/`usageInfo` saem de `route.js` para `src/lib/aiUsage.js` (servidor), sem mudar
    comportamento; as duas rotas importam dali. É a única extração: rota do Next não pode exportar funções avulsas.
  - **Ajuste mexe só no que foi pedido.** Duas ferramentas:
    - `write_landing({ summary, html })`: página inteira. Só quando ainda não há HTML ou o dono pede para refazer tudo.
    - `edit_landing({ summary, edits: [{ find, replace }] })`: troca trechos exatos do HTML atual. "Muda os botões
      para verde" altera só o CSS/HTML dos botões; o resto do arquivo nem passa pela IA na saída.
    - O servidor aplica os `edits` em ordem; cada `find` precisa aparecer **exatamente 1 vez** no HTML atual. Se algum
      falhar, nada é aplicado e o dono vê "Não consegui aplicar esse ajuste, tente descrever de outro jeito"
      (o HTML não muda pela metade).
    - Prompt: "altere somente o que o dono pediu; não mude textos, cores, ordem ou estilos que ele não citou; prefira
      a menor troca possível". Se o pedido for vago ("deixa mais bonito"), a IA pergunta o que mudar.
    - Texto livre quando a IA precisa perguntar algo.
    - Bônus: ajuste pequeno gasta bem menos token que regerar a página.
  - Contexto enviado: título, descrição, endereço, horário, serviços, cores, `logo_url`, `banner_url`, link
    `/menu/[slug]`, telefone do dono (para link `wa.me`), até 20 produtos (nome, preço, foto, categoria, destacados
    primeiro) e o **HTML atual** (para ajustes). Histórico: últimas 8 mensagens, só texto.
  - Prompt: um arquivo `.html` único, CSS dentro de `<style>`, sem JS, mobile first, só imagens das URLs fornecidas,
    fontes só do Google Fonts, português do Brasil, mesmo escopo restrito do assistente atual.
  - `maxDuration = 300`, `max_tokens` 16000. HTML maior que o limite da coluna é recusado com mensagem.
- **Liberação para o Enterprise fica para depois:** quando o plano for criado, acrescentar `"enterprise"` em
  `LANDING_ROLES` e revisar a mensagem do 403.
- **Permissão: `LANDING_ROLES = ["admin"]` em `src/lib/landing.js`**, usado pela rota de IA, pela rota `/site` e
  pela aba. Para os outros planos a aba não aparece.

## Riscos
| Risco | Impacto | Mitigação |
|---|---|---|
| Dono usa o domínio do Bite Menu para página maliciosa (phishing) | Alto | CSP `sandbox` + `form-action 'none'` + sem JS + selo do Bite Menu; só admin por enquanto |
| Modelo gera página feia ou quebrada | Médio | Modelo numa constante `LANDING_MODEL` da rota; testar 3–4 prompts na Tarefa 3 e decidir depois |
| IA mexe em mais coisas do que o pedido | Médio | Ajuste por `edit_landing` (trechos exatos), não regeração; prompt restritivo; testado nos critérios da Tarefa 3 |
| `find` da IA não bate com o HTML (espaço, aspas) | Médio | Aplicar tudo ou nada; mensagem de erro clara; o dono reformula |
| Gerar a página inteira gasta muito do limite da sessão | Baixo | Só na criação/refazer; produtos limitados a 20 |
| Geração passa do tempo da função | Médio | `maxDuration = 300`; mostrar "gerando…" na aba |
| Imagens externas que a IA inventar | Baixo | Prompt só permite as URLs enviadas; `img-src https:` não quebra se vier outra |
| Extração do `aiUsage` quebrar o assistente atual | Médio | Mover sem mudar código; testar o chat do Bite Menu IA no checkpoint 1 |

## Perguntas em aberto
- Modelo: **decidir depois**. Começa com `claude-haiku-5-5` (o mesmo do assistente) numa constante `LANDING_MODEL`;
  trocar por `claude-sonnet-5-5` é uma linha.
- Mostrar o link da landing no QR code / compartilhamento do cardápio? (fora deste plano)
- Quando o Enterprise existir: além de `LANDING_ROLES`, ele herda tudo do Business? (são ~59 listas em 37 arquivos;
  vira um plano próprio)
