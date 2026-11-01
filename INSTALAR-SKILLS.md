# Instalar as skills do Claude Code

**Claude:** ao ler este arquivo, execute os passos abaixo em ordem. Pule o que já estiver instalado. No fim, mostre o
resultado de cada item e diga o que precisa de ação manual.

Versões de referência (1 de novembro de 2026): Claude Code 2.1.314, `agent-skills` 0.6.11, `ponytail` 4.10.0,
`graphifyy` 0.9.73. Os plugins instalam a versão mais recente disponível.

## 1. Encontrar a CLI do Claude

Use `claude` se o comando existir. Na extensão do VS Code ele pode não estar no PATH, então use o binário da extensão:

```bash
CLAUDE_BIN=$(command -v claude || ls -d ~/.vscode/extensions/anthropic.claude-code-*/resources/native-binary/claude 2>/dev/null | tail -1)
"$CLAUDE_BIN" --version
```

Se nenhum for encontrado, peça ao usuário para rodar os comandos do passo 2 no chat do Claude Code, trocando
`"$CLAUDE_BIN" plugin` por `/plugin`.

## 2. Instalar os plugins

```bash
"$CLAUDE_BIN" plugin marketplace add addyosmani/agent-skills
"$CLAUDE_BIN" plugin install agent-skills@addy-agent-skills

"$CLAUDE_BIN" plugin marketplace add DietrichGebert/ponytail
"$CLAUDE_BIN" plugin install ponytail@ponytail
```

- `agent-skills`: planejamento, spec, build, review, testes, segurança, performance e outras.
- `ponytail`: modo de soluções mínimas e auditoria de código em excesso. **Atenção:** ele fica ativo em toda sessão,
  por um hook de início de sessão.

## 3. Instalar o graphify

Precisa do [uv](https://docs.astral.sh/uv/). Se ele não existir, peça confirmação ao usuário antes de instalar.

```bash
uv tool install graphifyy
graphify install --platform claude
```

Depois, confira se `~/.claude/skills/graphify/SKILL.md` existe e se `~/.claude/CLAUDE.md` contém este trecho. Se não
contiver, adicione:

```markdown
# graphify
- **graphify** (`~/.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.
```

## 4. Preparar `run-bitemenu` (só neste projeto)

A skill fica em `.claude/skills/run-bitemenu/`. **No git só está o `SKILL.md`**: `driver.mjs` e `fake-supabase.mjs` são
ignorados porque `.claude` está no `.gitignore`. Se esses dois arquivos não existirem, avise o usuário que eles precisam
ser copiados da máquina original.

Com os arquivos no lugar, instale o Playwright fora do projeto:

```bash
mkdir -p ~/.cache/run-bitemenu && cd ~/.cache/run-bitemenu && npm init -y >/dev/null && npm i playwright@1.63.0 && npx playwright install chromium-headless-shell
```

## 5. Verificar

```bash
"$CLAUDE_BIN" plugin list
graphify --version
ls ~/.claude/skills/graphify/SKILL.md
```

Peça ao usuário para reiniciar o Claude Code ou recarregar a janela do VS Code. As skills novas só aparecem em uma nova
sessão.

## O que não precisa instalar

- **Incluídas no Claude Code:** `code-review`, `simplify`, `security-review`, `init`, `run`, `loop`, `schedule`,
  `update-config`, `keybindings-help`, `fewer-permission-prompts`, `plugin-authoring`, `claude-api`, `dataviz` e as
  `artifact-*`.
- **Vindas da conta claude.ai:** `anthropic-skills:*` (`docs`, `docx`, `pdf`, `pptx`, `xlsx`, `deep-research`,
  `skill-creator` e outras) são sincronizadas ao entrar com a mesma conta. A disponibilidade pode variar com a conta e o
  aplicativo.

## Fora desta instalação

`gitkraken-hooks` também está ativo, mas não contém skills, só hooks de acompanhamento de sessão. Ele usa um marketplace
local criado por um produto da GitKraken, então só existe em outra máquina com esse produto configurado.
