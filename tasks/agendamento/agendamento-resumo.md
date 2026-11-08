# Agendamento (Business)
- Carrinho (Business, entrega/retirada): campo opcional "Agendar para" -> `orders.scheduled_for`; vai na mensagem do WhatsApp.
- Painel: aba **Agenda** (calendário do mês + lista do dia), lê `orders` com `scheduled_for`.
- SQL: `agendamento.sql` (rodar antes do deploy).
- Fora: Pix online (a rota whitelista campos do pedido; mexe em pagamento), pedido de mesa/balcão, bloqueio de horários/capacidade.
