# Avaliações na lista de Descobrir (preparado, ainda sem sistema de avaliação)

## Situação
Ainda não há avaliação de estabelecimentos. A ordenação de `/descobrir` (`src/lib/discover.js`, Tarefa 4 de
`tasks/descobrir/descobrir-todo.md`) já considera nota, mas enquanto ninguém tem avaliação todos empatam e a ordem fica igual à
de hoje. Quando o sistema de avaliação existir, basta preencher dois campos por cardápio. A ordenação não muda.

## Contrato esperado
Cada cardápio que chega em `sortMenus` pode ter:
- `rating_avg`: média de 1 a 5 (ou `null`)
- `rating_count`: quantas avaliações (ou `0`/`null`)

Sem esses campos, o cardápio conta como "sem avaliação".

## Ordem da lista
1. **Região** (só para quem tem endereço): mesma cidade → mesmo estado → resto.
2. **Nota**, dentro de cada grupo: maior `score` primeiro.
3. **Distância** (com coordenada do cliente), senão **nome** em ordem alfabética.

O filtro de distância (`km`) é aplicado antes, e não muda a ordem.

## Score (média bayesiana)
Uma loja com uma única avaliação 5 não pode passar na frente de uma com 200 avaliações 4,8:

```
score = (rating_count * rating_avg + M * C) / (rating_count + M)
```

- `C` = nota "neutra" = 3,5 (troque pela média geral real quando houver dados)
- `M` = 5 (peso: quantas avaliações a loja precisa ter para a própria média começar a valer)
- Sem avaliação: com `rating_count = 0` a fórmula dá exatamente `C`. A loja nova fica atrás das bem avaliadas e à
  frente das mal avaliadas, sem ser punida por ainda não ter nota. Os sem nota empatam entre si e seguem a ordem por
  distância/nome (é o que acontece com todas hoje).

`C` e `M` ficam como constantes no topo de `src/lib/discover.js`.

## O que fazer quando o sistema de avaliação for criado
1. Tabela de avaliações (ex.: `menu_reviews(menu_id, customer_id, rating, created_at)`) com RLS: SQL manual, como os
   outros em `tasks/`.
2. Disponibilizar `rating_avg` e `rating_count` por cardápio: uma view
   (`select menu_id, avg(rating), count(*) from menu_reviews group by 1`) ou colunas em `menus` atualizadas por trigger.
3. Na rota `src/app/api/descobrir/route.js`, incluir esses dois campos na consulta. **Nada mais muda.**
4. Opcional: mostrar a nota no card da lista.
