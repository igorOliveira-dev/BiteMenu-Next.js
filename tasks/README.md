# tasks/

Planos, tarefas e SQL manual do Supabase, separados por funcionalidade. O SQL daqui é rodado à mão no SQL Editor
(regra do `CLAUDE.md`: integrações com o Supabase não são alteradas direto pelo código).

| Pasta | O que tem |
|---|---|
| `descobrir/` | Tela Descobrir, endereço e histórico do cliente no banco: plano, tarefas, avaliações, registro de mudanças e SQL (`descobrir.sql`, `profile-address.sql`, `orders-customer.sql`) |
| `login-usuario/` | Conta de cliente separada da de dono: plano, tarefas e SQL (`account-type.sql`, `account-type-menu-guard.sql`, `profile-cep.sql`) |
| `identidade-visual/` | Nova identidade visual (em andamento): `plan.md`, `todo.md` e o resumo |
| `seguranca/` | Auditoria, funções e policies de segurança (`security-0` a `security-2`, nessa ordem) |
| `sql/` | SQL avulso de funcionalidades sem plano aqui: exclusão de conta, lembrete de boleto, NFS-e, resumo de pedidos, remarketing |
| `archive/` | Planos concluídos |
| `brand-bite-menu/` | Imagens da marca (logo e banners); fica na raiz por não ser `.md` nem `.sql` |

Só `.md` e `.sql` vão para as pastas de funcionalidade; outros arquivos e pastas ficam na raiz de `tasks/`.
Plano novo: criar uma pasta para a funcionalidade, com `<nome>-plan.md`, `<nome>-todo.md` e os `.sql` dela.
