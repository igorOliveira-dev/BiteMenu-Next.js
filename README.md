# Bite Menu

**Cardápio digital para restaurantes, integrado com WhatsApp.**

O Bite Menu é um SaaS que permite a qualquer estabelecimento criar um cardápio digital profissional em minutos — sem precisar de conhecimento técnico. O cliente acessa pelo link ou QR code, faz o pedido, e o restaurante recebe diretamente no WhatsApp.

Hoje, **mais de 300 estabelecimentos** já usam o Bite Menu no dia a dia.

🌐 [bitemenu.com.br](https://www.bitemenu.com.br)

---

## Como funciona

1. O dono do estabelecimento cria uma conta e monta o cardápio (categorias, produtos, imagens, preços)
2. O Bite Menu gera um link exclusivo e um QR code para o cardápio
3. O cliente acessa pelo celular, navega pelo cardápio e faz o pedido
4. O pedido é enviado automaticamente para o WhatsApp do restaurante

Sem instalação de app. Funciona em qualquer navegador mobile.

---

## Funcionalidades

- Criação de cardápio com categorias, produtos, imagens e preços
- Personalização de cores, logo e banner
- Link exclusivo e QR code por estabelecimento
- Recebimento de pedidos via WhatsApp
- Painel de pedidos e controle de vendas
- Atualização instantânea do cardápio
- Zonas de entrega (planos pagos)
- Analytics de vendas (plano Pro)

---

## Planos

| Plano | Preço        | Produtos | Categorias |
| ----- | ------------ | -------- | ---------- |
| Free  | Grátis       | 20       | 4          |
| Plus  | R$ 24,90/mês | 50       | 10         |
| Pro   | R$ 44,90/mês | 200      | 20         |

Sem taxas por transação. O pagamento acontece diretamente entre o cliente e o estabelecimento.

Para ver mais detalhes dos planos, acesse: [Documentação de planos](https://www.bitemenu.com.br/docs/planos)

---

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [Supabase](https://supabase.com/) — banco de dados, autenticação e storage
- [Stripe](https://stripe.com/) — assinaturas e pagamentos
- [Tailwind CSS](https://tailwindcss.com/)
- PWA via `next-pwa`
