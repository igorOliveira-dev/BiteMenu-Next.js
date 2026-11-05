# Todo: botão de login no navbar da landing e fechamento da identidade visual

Decisões em `tasks/landing-login/landing-login-plan.md`.

Verificação comum (o projeto não tem testes automatizados e o lint está quebrado no Next 16):
- `npm run build` passa
- Telas em 1440px e 390px, nos temas claro e escuro
- `git diff` só tem `className`, texto do botão e `href`; nada de auth, Supabase ou ValidaPay
- `graphify update .` no fim

### Task 1: Botão "Entrar" no navbar da landing
**Descrição:** Em `LandingPageV2.jsx`, no navbar e só para o visitante, trocar "Criar cardápio grátis" (`/register`)
por um link "Entrar" para `/login`: pílula `bg-verde text-white` com `FaUser`. O dono logado continua com "Acessar
cardápio" (`/dashboard`) e o cliente logado com `CustomerMenu`. O hero e o CTA final não mudam.

**Critérios de aceite:**
- [x] Visitante vê "Entrar" no navbar, e o link abre `/login`
- [x] Dono logado vê "Acessar cardápio"; cliente logado vê o círculo da conta
- [ ] Navbar sem quebra nem overflow em 320px, 390px e 1440px, nos dois temas

**Verificação:** abrir `/` deslogado, logado como dono e logado como cliente.

**Dependências:** nenhuma
**Arquivos:** `src/app/landingPage/LandingPageV2.jsx`
**Tamanho:** XS

### Task 2: Anel de foco do telefone no carrinho sem azul
**Descrição:** Em `CartDrawer.jsx:1689`, trocar `!focus:ring-blue-400` por `!focus:ring-current`. Nenhuma outra
classe ou cor do cardápio público muda.

**Critérios de aceite:**
- [x] `grep -rnE 'blue-[0-9]|#155dfc|glow-red|#060606' src` sem resultados fora da `LandingPageV1`
- [ ] Ao focar o campo de telefone, o anel fica visível em um cardápio claro e em um escuro
- [ ] Resto do carrinho igual: cores do dono, fonte e layout

**Verificação:** abrir um cardápio claro e um escuro, abrir o carrinho e focar o telefone.

**Dependências:** nenhuma
**Arquivos:** `src/app/menu/[slug]/components/CartDrawer.jsx`
**Tamanho:** XS

### Task 3: Atualizar os `.md`
**Descrição:** No `identidade-visual-resumo.md`, tirar das pendências a troca para a `LandingPageV2`, já feita em
`fcba95f`, e o azul do `CartDrawer`, que deixa de existir. Registrar o "Entrar" no navbar, onde o verde é a cor de
entrar e registrar. No `tasks/README.md`, adicionar a linha da pasta `landing-login/`.

**Critérios de aceite:**
- [x] O resumo reflete o código atual
- [x] `tasks/README.md` lista a pasta nova

**Dependências:** Tasks 1 e 2
**Arquivos:** `tasks/identidade-visual/identidade-visual-resumo.md`, `tasks/README.md`
**Tamanho:** XS

### Checkpoint
- [x] `npm run build` limpo
- [ ] Telas da Task 1 e 2 conferidas nos dois temas
- [ ] `graphify update .` (comando `graphify` não está no PATH desta máquina)
- [ ] Sua revisão antes do commit
