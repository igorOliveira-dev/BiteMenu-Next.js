import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Pix online - Bite Menu",
  description:
    "Receba os pedidos do seu cardápio digital já pagos por Pix, com o dinheiro direto na sua conta de recebimentos.",

  alternates: {
    canonical: "https://www.bitemenu.com.br/docs/pix-online",
  },

  openGraph: {
    title: "Pix online - Bite Menu",
    description: "Pagamento por Pix direto no cardápio digital do Bite Menu.",
    url: "https://www.bitemenu.com.br/docs/pix-online",
    siteName: "Bite Menu",
    type: "website",
  },
};

const link = "underline text-brand-red hover:opacity-80";

const page = () => {
  return (
    <div className="max-w-[1080px] flex flex-col scroll-mt-[90px]">
      <h1 className="default-h1">Pix online</h1>

      <section className="mt-4 scroll-mt-[90px]" id="o-que-e">
        <h2 className="docs-title">O que é o Pix online?</h2>
        <p className="docs-paragraph">
          Com o <strong>Pix online</strong>, o cliente paga o pedido por Pix no próprio cardápio, na hora de finalizar a
          compra. O pedido chega na aba "Pedidos" <strong>já pago</strong>, e você não precisa conferir comprovante.
        </p>
        <p className="docs-paragraph">
          O dinheiro cai numa <strong>conta de recebimentos</strong> em nome da sua empresa, criada na{" "}
          <strong>ValidaPay</strong>, a processadora de pagamentos parceira do Bite Menu. Você acompanha o saldo e faz os
          saques pelo próprio painel do Bite Menu.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="quem-pode-usar">
        <h2 className="docs-title">Quem pode usar?</h2>
        <ul className="docs-paragraph list-disc pl-6">
          <li>
            Estabelecimentos nos planos{" "}
            <Link href="/docs/planos#pro" className={link}>
              Pro
            </Link>{" "}
            e{" "}
            <Link href="/docs/planos#business" className={link}>
              Business
            </Link>
            . Nos outros planos, a opção aparece, mas não pode ser ativada.
          </li>
          <li>
            Empresas com <strong>CNPJ</strong> (MEI, ME ou outras). A conta de recebimentos não pode ser aberta só com
            CPF.
          </li>
        </ul>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="como-ativar">
        <h2 className="docs-title">Como ativar</h2>
        <ol className="docs-paragraph list-decimal pl-6">
          <li>No dashboard, abra a aba "Cardápio" e clique em "Configurar cardápio".</li>
          <li>Abra a seção "Pagamentos". No bloco "Pix online", clique em "Cadastrar pagamento online".</li>
          <li>
            Preencha os dados da empresa e do sócio responsável e envie. O CEP preenche o endereço sozinho, e CNPJ, CPF e
            telefone já são formatados enquanto você digita.
          </li>
          <li>
            O cadastro passa pela análise da ValidaPay. Quando for pedido, use o botão "Enviar documentos" que aparece no
            bloco. Clique em "Atualizar status" para acompanhar.
          </li>
          <li>
            Com a conta aprovada, marque <strong>"Pix online"</strong> nas formas de pagamento e salve.
          </li>
        </ol>
        <p className="docs-paragraph">
          O Pix online substitui o PIX com chave: marcar um desmarca o outro, para o cliente não ver duas opções de Pix.
          Ele vale para pedidos de entrega e retirada. Em pedidos de mesa e de balcão, o Pix online não é oferecido.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="como-o-cliente-paga">
        <h2 className="docs-title">Como o cliente paga</h2>
        <ol className="docs-paragraph list-decimal pl-6">
          <li>O cliente monta o pedido e escolhe "PIX" como forma de pagamento.</li>
          <li>Aparece o QR Code e o código Pix copia e cola, com o valor do pedido.</li>
          <li>
            Assim que o pagamento é confirmado, a tela avisa o cliente e o pedido entra na aba "Pedidos" como{" "}
            <strong>"Pix online (pago)"</strong>.
          </li>
          <li>Como nos outros pedidos, o cliente envia a mensagem de confirmação pelo WhatsApp.</li>
        </ol>
        <p className="docs-paragraph">
          Se o cliente sair da tela e voltar com o mesmo carrinho, o mesmo Pix é mostrado de novo. Se ele mudar o pedido,
          o Pix anterior é cancelado antes de um novo ser gerado. Assim ele não paga duas vezes pelo mesmo pedido.
        </p>
        <p className="docs-paragraph">
          O pedido só aparece no painel depois de pago. Pix gerado e não pago não vira pedido.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="taxas">
        <h2 className="docs-title">Taxas</h2>
        <ul className="docs-paragraph list-disc pl-6">
          <li>
            <strong>Taxa do Bite Menu:</strong> 5% do valor pago pelo cliente (incluindo a taxa de entrega), descontada
            automaticamente em cada pagamento.
          </li>
          <li>
            <strong>Tarifa da ValidaPay:</strong> cobrada pela ValidaPay em cada pagamento recebido e, quando houver, em
            cada saque. O valor aparece no extrato da sua conta de recebimentos.
          </li>
        </ul>
        <p className="docs-paragraph">
          Nos pedidos pagos por Pix online, a aba "Pedidos" mostra quanto você recebe já sem os 5%. O valor do pedido, o
          ticket impresso e os relatórios continuam com o valor total pago pelo cliente.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="conta-de-recebimentos">
        <h2 className="docs-title">Conta de recebimentos e saques</h2>
        <p className="docs-paragraph">
          No bloco "Pix online", o botão <strong>"Minha conta de recebimentos"</strong> mostra os dados da conta, o saldo
          disponível, o histórico de saques e o extrato.
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>
            <strong>Saque:</strong> informe o valor e uma chave Pix <strong>do mesmo CNPJ</strong> da conta. Saques para
            chaves de outro titular são recusados. Existe um limite de saque por dia, mostrado nos dados da conta.
          </li>
          <li>
            <strong>Extrato:</strong> cada pagamento recebido mostra o cliente, a data do pedido, o valor pago, a taxa de
            5%, a tarifa e o valor líquido. Dá para filtrar por período de até 1 mês.
          </li>
          <li>
            <strong>Relatório:</strong> o botão "Baixar relatório" gera uma planilha (CSV) com as movimentações do
            período, que abre no Excel e no Google Planilhas.
          </li>
        </ul>
        <p className="docs-paragraph">
          Se você mudar para um plano sem o Pix online, ele deixa de aparecer no cardápio, mas o saldo continua disponível
          para saque pelo painel.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="duvidas">
        <h2 className="docs-title">Dúvidas comuns</h2>
        <p className="docs-paragraph">
          <strong>O dinheiro passa pelo Bite Menu?</strong> Não. O pagamento cai direto na conta de recebimentos em nome da
          sua empresa, na ValidaPay. O Bite Menu recebe apenas a taxa de 5%.
        </p>
        <p className="docs-paragraph">
          <strong>Preciso devolver um pagamento. Como faço?</strong> Por enquanto, a devolução não é feita pelo painel.
          Fale com o{" "}
          <Link href="/support" className={link}>
            suporte
          </Link>{" "}
          informando o pedido.
        </p>
        <p className="docs-paragraph">
          <strong>Posso usar o PIX com chave e o Pix online ao mesmo tempo?</strong> Não. Você escolhe um dos dois nas
          formas de pagamento.
        </p>
      </section>
    </div>
  );
};

export default page;
