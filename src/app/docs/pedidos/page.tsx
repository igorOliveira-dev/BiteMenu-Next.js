import React from "react";

export const metadata = {
  title: "Pedidos - Bite Menu",
  description:
    "Entenda como funcionam os pedidos no Bite Menu e conheça os recursos disponíveis na aba Pedidos do dashboard.",

  alternates: {
    canonical: "https://www.bitemenu.com.br/docs/pedidos",
  },

  openGraph: {
    title: "Pedidos - Bite Menu",
    description:
      "Entenda como funcionam os pedidos no Bite Menu e conheça os recursos disponíveis na aba Pedidos do dashboard.",
    url: "https://www.bitemenu.com.br/docs/pedidos",
    siteName: "Bite Menu",
    type: "website",
  },
};

const page = () => {
  return (
    <div className="max-w-[1080px] flex flex-col scroll-mt-[90px]">
      <h1 className="default-h1 docs-title">Pedidos</h1>

      <section className="mt-4 scroll-mt-[90px]" id="como-os-pedidos-funcionam">
        <h2 className="docs-title">Como os pedidos funcionam?</h2>
        <p className="docs-paragraph">
          O fluxo de pedidos no Bite Menu começa no cardápio digital. O cliente acessa o link do seu cardápio, escolhe os
          produtos desejados, define o tipo de serviço disponível, informa os dados necessários e finaliza o pedido.
        </p>
        <p className="docs-paragraph">
          Depois disso, o Bite Menu organiza essas informações e registra o pedido na aba <strong>Pedidos</strong> do seu
          dashboard. Além disso, o pedido também pode ser enviado ao estabelecimento por WhatsApp, tornando o processo mais
          rápido e fácil para ambas as partes.
        </p>
        <p className="docs-paragraph">
          Dessa forma, o cardápio digital não serve apenas para mostrar os produtos, mas também para estruturar melhor o
          recebimento dos pedidos e tornar o atendimento mais profissional.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="o-que-e-a-aba-pedidos">
        <h2 className="docs-title">O que é a aba Pedidos?</h2>
        <p className="docs-paragraph">
          A aba <strong>Pedidos</strong> do dashboard do Bite Menu é o espaço onde você pode acompanhar os pedidos realizados
          pelos clientes através do seu cardápio digital.
        </p>
        <p className="docs-paragraph">
          Sempre que um cliente monta um pedido no cardápio e finaliza o processo, as informações ficam organizadas nessa
          área para facilitar o atendimento do estabelecimento.
        </p>
        <p className="docs-paragraph">
          Isso ajuda você a ter mais controle sobre os pedidos recebidos, visualizar os dados com mais clareza e acompanhar o
          andamento do atendimento de forma mais prática.
        </p>
        <p className="docs-paragraph">
          Além disso, assim que o pedido é marcado como "finalizado" na aba Pedidos, ele é automaticamente registrado na aba{" "}
          <strong>Vendas</strong>, permitindo que você acompanhe o histórico de vendas e tenha uma visão mais completa do
          desempenho do seu negócio.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="informacoes-registradas">
        <h2 className="docs-title">Quais informações ficam registradas no pedido?</h2>
        <p className="docs-paragraph">
          Cada pedido pode reunir diferentes informações preenchidas pelo cliente durante a finalização da compra. Isso ajuda
          o estabelecimento a entender exatamente o que foi solicitado e como deve prosseguir com o atendimento.
        </p>
        <p className="docs-paragraph">Entre as principais informações que podem aparecer em um pedido, estão:</p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Itens escolhidos pelo cliente</li>
          <li>Quantidade de cada item</li>
          <li>Adicionais e observações, quando disponíveis</li>
          <li>Valor total do pedido</li>
          <li>Tipo de serviço selecionado, como entrega, retirada ou consumo local</li>
          <li>Forma de pagamento escolhida</li>
          <li>Dados de contato do cliente</li>
          <li>Endereço, no caso de pedidos para entrega</li>
          <li>Data e horário em que o pedido foi realizado</li>
        </ul>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="visualizacao-dos-pedidos">
        <h2 className="docs-title">Visualização dos pedidos no dashboard</h2>
        <p className="docs-paragraph">
          Na aba <strong>Pedidos</strong>, você pode visualizar os pedidos recebidos de forma organizada, facilitando a
          leitura das informações e o acompanhamento do atendimento.
        </p>
        <p className="docs-paragraph">
          Essa visualização permite identificar rapidamente quem fez o pedido, quais itens foram escolhidos e qual é a
          situação atual da solicitação.
        </p>
        <p className="docs-paragraph">
          Em vez de depender apenas de mensagens soltas no WhatsApp, o Bite Menu centraliza os pedidos em um ambiente mais
          estruturado, o que pode ajudar bastante na rotina do estabelecimento.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="ferramentas-da-aba">
        <h2 className="docs-title">Ferramentas presentes na aba Pedidos</h2>
        <p className="docs-paragraph">
          A aba <strong>Pedidos</strong> foi criada para facilitar o acompanhamento e a organização das solicitações feitas
          pelo cardápio digital. Entre as ferramentas e recursos que podem estar disponíveis nessa área, estão:
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Listagem dos pedidos recebidos</li>
          <li>Visualização detalhada de cada pedido</li>
          <li>Consulta dos itens e valores do pedido</li>
          <li>Edição de dados em cada pedido</li>
          <li>Acompanhamento do status do pagamento (pago ou pendente)</li>
          <li>Organização cronológica dos pedidos</li>
          <li>Filtragem de pedidos por data, cliente, itens etc.</li>
          <li>Configuração de recebimento de pedidos, para habilitar ou desabilitar os pedidos por WhatsApp e pelo site</li>
        </ul>
        <p className="docs-paragraph">
          Esses recursos tornam a rotina do estabelecimento mais clara e ajudam a transformar o cardápio digital em uma
          ferramenta mais completa para vendas e atendimento.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="detalhes-de-cada-pedido">
        <h2 className="docs-title">Detalhes de cada pedido</h2>
        <p className="docs-paragraph">
          Ao abrir um pedido específico, você pode analisar com mais cuidado todas as informações enviadas pelo cliente. Isso
          é útil para confirmar os itens, conferir dados importantes e reduzir erros no atendimento.
        </p>
        <p className="docs-paragraph">Entre os detalhes mais importantes, normalmente estão:</p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Nome do cliente</li>
          <li>Telefone para contato</li>
          <li>Endereço de entrega, quando aplicável</li>
          <li>Itens do pedido</li>
          <li>Observações adicionais</li>
          <li>Forma de pagamento</li>
          <li>Serviço selecionado</li>
          <li>Valor de cada item</li>
          <li>Valor total</li>
        </ul>
        <p className="docs-paragraph">
          Essa visualização detalhada ajuda o estabelecimento a atender com mais segurança e agilidade, além de ser possível
          editar os dados do pedido quando necessário.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="pedido-e-whatsapp">
        <h2 className="docs-title">Integração com o WhatsApp</h2>
        <p className="docs-paragraph">
          Um dos principais diferenciais do Bite Menu é facilitar o envio do pedido para o WhatsApp do estabelecimento. Isso
          permite que o cliente finalize a escolha dos produtos no cardápio digital e, em seguida, envie a solicitação já
          organizada.
        </p>
        <p className="docs-paragraph">
          Ao mesmo tempo, o registro do pedido no dashboard ajuda o estabelecimento a ter uma visão mais estruturada das
          solicitações recebidas, sem depender apenas da conversa no aplicativo.
        </p>
        <p className="docs-paragraph">
          Essa combinação entre cardápio digital e WhatsApp torna o processo de atendimento mais simples, rápido e
          profissional.
        </p>
        <p className="docs-paragraph">
          O número de WhatsApp para o qual os pedidos são enviados é o mesmo que você configurou na criação da sua conta, mas
          pode ser alterado a qualquer momento nas configurações da sua conta no Bite Menu.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="vantagens-da-aba-pedidos">
        <h2 className="docs-title">Vantagens de usar a aba Pedidos</h2>
        <p className="docs-paragraph">
          Utilizar a aba <strong>Pedidos</strong> no dashboard do Bite Menu pode trazer diversos benefícios para a operação
          do estabelecimento, especialmente quando há vários pedidos sendo feitos ao longo do dia.
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Mais organização no atendimento</li>
          <li>Melhor visualização das informações de cada pedido</li>
          <li>Redução de erros na interpretação das solicitações</li>
          <li>Mais praticidade para acompanhar pedidos em andamento</li>
          <li>Maior controle sobre os pedidos recebidos pelo cardápio digital</li>
          <li>Integração prática com o fluxo de atendimento via WhatsApp</li>
        </ul>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="boas-praticas-para-pedidos">
        <h2 className="docs-title">Boas práticas para gerenciar pedidos</h2>
        <p className="docs-paragraph">
          Para aproveitar melhor a aba de pedidos e oferecer uma experiência mais eficiente aos seus clientes, vale a pena
          seguir algumas boas práticas:
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Revise frequentemente os pedidos recebidos</li>
          <li>Confira os dados do cliente antes de iniciar o atendimento</li>
          <li>Verifique os itens e observações com atenção</li>
          <li>Mantenha as formas de pagamento e serviços corretamente configurados</li>
          <li>Atualize os horários de funcionamento do estabelecimento</li>
          <li>Mantenha o cardápio sempre organizado e com preços corretos</li>
        </ul>
        <p className="docs-paragraph">
          Esses cuidados ajudam a evitar erros e contribuem para um processo de venda mais rápido e profissional.
        </p>
      </section>
    </div>
  );
};

export default page;
