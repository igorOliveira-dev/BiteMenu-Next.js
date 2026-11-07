# Resumo: landing page gerada por IA (para continuar depois)

Plano: `landing-ia-plan.md` · Tarefas: `landing-ia-todo.md` · SQL: `landing-ia.sql`

## Onde parou (2026-11-07)
- Tarefas 1–4 **implementadas**, `npm run build` ok, **commitadas na `dev`** (commit "feat: landing page do
  estabelecimento gerada por IA"). Código pronto: o que falta é teste e decisão (ver "Próximos passos").
- SQL `landing-ia.sql` **já aplicado** no Supabase (a rota lê `landing_html` sem erro).
- **Não testado com conta admin:** a IA estava indisponível. Falta o teste manual (ver "Próximos passos").
- Liberado **só para `admin`**. O plano Enterprise ainda vai ser criado.

## Decisões do dono
- Só admin por enquanto; liberar para o Enterprise quando o plano existir.
- **Cada ajuste mexe só no que foi pedido** (pediu botões → muda só os botões).
- Modelo da IA: **decidir depois** (hoje `claude-haiku-5-5`).
- URL pública: `/site/[slug]`. Interface: aba própria "Landing page" no dashboard.

## Arquivos
| Arquivo | O que faz |
|---|---|
| `src/lib/landing.js` (novo) | `LANDING_ROLES = ["admin"]`, limite de 300 KB, CSP, `cleanLandingHtml` (strip de script/on*/form/iframe/javascript:), `withBadge` (selo "Feito com Bite Menu"), `applyLandingEdits` (trocas exatas, tudo ou nada). Sem imports de servidor: a aba também usa. |
| `src/app/site/[slug]/route.js` (novo) | Página pública: HTML cru com CSP `sandbox` (origem isolada, sem JS, sem form). Sem landing ou dono fora de `LANDING_ROLES` → 307 para `/menu/[slug]`; slug inexistente → 404. |
| `src/app/api/assistant/landing/route.js` (novo) | IA da landing. POST `{ messages, html }` → `{ reply, html?, usage }`. Ferramentas `write_landing` (página inteira: só criar/refazer) e `edit_landing` (`[{ find, replace }]`: ajuste). Constante `LANDING_MODEL`. `maxDuration = 300`. Contexto: dados do cardápio, até 20 produtos (destaques/foto primeiro), WhatsApp do dono, HTML atual. |
| `src/lib/aiUsage.js` (novo) | `getUsage`, `addUsage`, `usageInfo` movidos sem mudança de `api/assistant/route.js`. As duas IAs gastam do mesmo saldo `ai_usage`. |
| `src/app/dashboard/tabs/Landing.jsx` (novo) | Chat + prévia `<iframe sandbox="" srcDoc>` + Publicar / Descartar mudanças / Ver página / Remover landing. Publica com `updateMenuById` (client do dono + RLS). Conversa e rascunho ficam ao trocar de aba; somem ao recarregar. |
| `src/app/dashboard/Dashboard.jsx` | Item "Landing page" (ícone `FaGlobe`) no menu lateral só para `LANDING_ROLES`, e render da aba. |
| `src/app/api/assistant/route.js` | Só passou a importar o uso de `@/lib/aiUsage`. |
| `src/proxy.js` | `/site/` no mesmo rate limit do `/menu/` (bucket `menu`) e no `matcher`. |
| `tasks/README.md` | Linha da pasta `landing-ia/`. |

## Já verificado
- Asserts de `cleanLandingHtml`, `applyLandingEdits` e `withBadge` (ver "Self-check" abaixo): ok.
- Servidor de produção local: `/site/<inexistente>` → 404; `/site/teste` (sem landing) → 307 para `/menu/teste`;
  `POST /api/assistant/landing` sem login → 401.

## Próximos passos
1. **Teste sem IA** (pode fazer já): gravar uma landing de teste no cardápio admin e conferir.
   ```sql
   update public.menus
   set landing_html = $html$<!doctype html>
   <html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
   <title>Teste landing</title>
   <style>body{font-family:system-ui;margin:0;padding:40px;background:#111;color:#fff}.btn{display:inline-block;padding:12px 24px;border-radius:999px;background:#e85d2a;color:#fff;text-decoration:none}</style>
   </head><body>
   <h1>Landing de teste</h1>
   <a class="btn" href="/menu/SEU_SLUG">Ver cardápio</a>
   <script>alert('script rodou')</script>
   <img src="x" onerror="alert('onerror rodou')">
   <form action="https://exemplo.com"><input placeholder="não deve aparecer"><button>Enviar</button></form>
   </body></html>$html$
   where slug = 'SEU_SLUG';
   ```
   - [ ] `/site/SEU_SLUG`: título, botão e selo aparecem; **nenhum alerta, nenhum formulário**
   - [ ] DevTools > Network: header `Content-Security-Policy` começa com `sandbox`
   - [ ] Botão leva para `/menu/SEU_SLUG`
   - [ ] Aba "Landing page" mostra a prévia (o form aparece ali, mas não envia nem roda nada); "Ver página" e
         "Remover landing" funcionam; depois de remover, `/site/SEU_SLUG` redireciona para o cardápio
2. **Teste com IA** (quando ela voltar):
   - [ ] "Crie uma landing moderna para meu restaurante": página completa, com logo/banner/produtos reais
   - [ ] "Deixa os botões verdes": só os botões mudam (comparar o HTML antes/depois)
   - [ ] Pedido vago ("deixa mais bonito"): a IA pergunta antes de mexer
   - [ ] Anotar tokens gastos (o % de uso da aba) na criação e num ajuste: subsídio para escolher o modelo
   - [ ] Abrir a aba no celular (chat em cima, prévia embaixo)
   - Se der "O assistente está indisponível agora": no log do servidor, `[landing] erro na API da Anthropic`
     = chave/créditos; `[landing] erro ao ler ai_usage` = tabela. Se o Bite Menu IA do cardápio também falha, é a
     API da Anthropic, não o código novo.
3. **Decidir o modelo:** hoje é `claude-haiku-5-5` (o mesmo do Bite Menu IA). Trocar só `LANDING_MODEL` em
   `src/app/api/assistant/landing/route.js` (`claude-sonnet-5-5` é melhor em design e mais caro).
4. **Commitar** as correções que os testes pedirem.
5. **Quando o Enterprise existir:** acrescentar `"enterprise"` em `LANDING_ROLES` (`src/lib/landing.js`) e revisar a
   mensagem do 403 em `api/assistant/landing/route.js`. Criar o plano em si (ValidaPay, preços, ~59 listas de plano em
   37 arquivos) é um plano próprio.

## Riscos conhecidos
- Criar a página inteira pode passar de `max_tokens` (16000) no Haiku → o dono vê "ficou grande demais".
- `edit_landing` depende de a IA copiar o trecho exato do HTML; se errar, nada muda e o dono reformula.
- O strip é por regex (comentário `shortcut:`); a segurança real é o CSP `sandbox`. Se um dia a landing aceitar JS,
  trocar por DOMPurify.
- `npm run lint` não roda (o projeto não tem `eslint.config.*`; já era assim). `graphify update .` não rodou
  (o comando não está no PATH).

## Self-check (o projeto não tem testes; rodar à mão)
Copiar `src/lib/landing.js` para `/tmp/landing.mjs`, salvar o código abaixo como `/tmp/landing.test.mjs` e rodar
`node /tmp/landing.test.mjs` (deve imprimir `ok`):
```js
import assert from "node:assert/strict";
import { cleanLandingHtml as c, applyLandingEdits as a, withBadge } from "./landing.mjs";
const dirty = `<p>oi</p><script>alert(1)</script><SCRIPT src=x></SCRIPT><img src=x onerror="alert(1)"><a href="javascript:alert(1)">x</a><form action=/x><input></form><iframe src=y></iframe><div onclick=foo()>d</div>`;
const out = c(dirty);
for (const bad of [/<script/i, /onerror/i, /onclick/i, /javascript:/i, /<form/i, /<iframe/i, /<input/i]) assert.doesNotMatch(out, bad);
assert.match(out, /<p>oi<\/p>/); assert.match(out, /<div>d<\/div>/);
assert.equal(c('<a href="/menu/x" class="btn">Pedir</a>'), '<a href="/menu/x" class="btn">Pedir</a>');
const h = "<style>.btn{color:red}</style><a class=btn>A</a><h1>T</h1>";
assert.equal(a(h, [{ find: ".btn{color:red}", replace: ".btn{color:green}" }]), "<style>.btn{color:green}</style><a class=btn>A</a><h1>T</h1>");
assert.equal(a(h, [{ find: "nao existe", replace: "x" }]), null);
assert.equal(a("<b>x</b><b>x</b>", [{ find: "<b>x</b>", replace: "y" }]), null);
assert.equal(a(h, [{ find: "<h1>T</h1>", replace: "<h1>U</h1>" }, { find: "zzz", replace: "" }]), null); // tudo ou nada
assert.equal(a(h, []), null);
assert.equal(withBadge("<body>a</body>").endsWith("Bite Menu</a></body>"), true);
console.log("ok");
```
