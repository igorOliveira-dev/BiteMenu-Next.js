import React from "react";

export const metadata = {
  title: "Vendas - Bite Menu",
  description:
    "Entenda como funciona a aba Vendas do Bite Menu e veja como acompanhar o histórico e o desempenho das vendas do seu estabelecimento.",

  alternates: {
    canonical: "https://www.bitemenu.com.br/docs/vendas",
  },

  openGraph: {
    title: "Vendas - Bite Menu",
    description:
      "Entenda como funciona a aba Vendas do Bite Menu e veja como acompanhar o histórico e o desempenho das vendas do seu estabelecimento.",
    url: "https://www.bitemenu.com.br/docs/vendas",
    siteName: "Bite Menu",
    type: "website",
  },
};

const page = () => {
  return (
    <div className="max-w-[1080px] flex flex-col scroll-mt-[90px]">
      <h1 className="default-h1 docs-title">Vendas</h1>

      <section className="mt-4 scroll-mt-[90px]" id="como-as-vendas-funcionam">
        <h2 className="docs-title">Como as vendas funcionam?</h2>
        <p className="docs-paragraph">
          No Bite Menu, a aba <strong>Vendas</strong> foi criada para ajudar você a acompanhar com mais clareza o resultado
          das vendas realizadas pelo seu estabelecimento através do cardápio digital.
        </p>
        <p className="docs-paragraph">
          Sempre que um pedido é concluído no fluxo de atendimento e marcado como <strong>finalizado</strong>, ele pode ser
          registrado na aba <strong>Vendas</strong>. Dessa forma, você passa a ter um histórico mais organizado das vendas já
          concluídas, separado dos pedidos que ainda estão em andamento.
        </p>
        <p className="docs-paragraph">
          Isso permite que o Bite Menu não seja apenas uma ferramenta para mostrar produtos e receber pedidos, mas também um
          apoio para acompanhar o desempenho do seu negócio ao longo do tempo.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="o-que-e-a-aba-vendas">
        <h2 className="docs-title">O que é a aba Vendas?</h2>
        <p className="docs-paragraph">
          A aba <strong>Vendas</strong> do dashboard é o espaço onde você pode visualizar o histórico das vendas já
          concluídas no seu estabelecimento.
        </p>
        <p className="docs-paragraph">
          Enquanto a aba <strong>Pedidos</strong> ajuda no recebimento e no acompanhamento das solicitações feitas pelos
          clientes, a aba <strong>Vendas</strong> concentra aquilo que realmente já entrou para o histórico de vendas do seu
          negócio.
        </p>
        <p className="docs-paragraph">
          Essa separação facilita a organização da operação e ajuda você a entender melhor o volume de vendas realizadas,
          consultar registros anteriores e acompanhar a evolução do estabelecimento com mais praticidade.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="como-uma-venda-e-registrada">
        <h2 className="docs-title">Como uma venda é registrada?</h2>
        <p className="docs-paragraph">
          O registro de uma venda está ligado ao fluxo dos pedidos realizados no cardápio digital. Em geral, o processo
          funciona da seguinte forma:
        </p>
        <ol className="docs-paragraph list-decimal pl-6">
          <li>O cliente acessa o cardápio digital e monta o pedido</li>
          <li>
            O pedido é enviado e aparece na aba <strong>Pedidos</strong>
          </li>
          <li>O estabelecimento acompanha e atende esse pedido</li>
          <li>
            Quando o pedido é concluído, ele pode ser marcado como <strong>finalizado</strong>
          </li>
          <li>
            Após isso, ele passa a compor o histórico da aba <strong>Vendas</strong>
          </li>
        </ol>
        <p className="docs-paragraph">
          Isso ajuda a manter uma organização mais lógica entre o que ainda está sendo atendido e o que já foi efetivamente
          vendido.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="informacoes-registradas">
        <h2 className="docs-title">Quais informações ficam registradas em uma venda?</h2>
        <p className="docs-paragraph">
          Cada venda registrada no Bite Menu pode reunir informações importantes para consulta e análise posterior. Entre os
          principais dados que podem aparecer, estão:
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Itens vendidos</li>
          <li>Quantidade de cada item</li>
          <li>Valor total da venda</li>
          <li>Forma de pagamento escolhida</li>
          <li>Tipo de serviço selecionado, como entrega, retirada ou consumo local</li>
          <li>Dados do cliente, quando aplicável</li>
          <li>Data e horário da venda</li>
        </ul>
        <p className="docs-paragraph">
          Essas informações ajudam o estabelecimento a revisar vendas anteriores, entender melhor o comportamento dos pedidos
          e manter um histórico mais confiável da operação.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="visualizacao-das-vendas">
        <h2 className="docs-title">Visualização das vendas no dashboard</h2>
        <p className="docs-paragraph">
          Na aba <strong>Vendas</strong>, os registros ficam organizados para facilitar a consulta no dia a dia. Isso ajuda o
          estabelecimento a localizar vendas anteriores, conferir valores e acompanhar o histórico do negócio de forma mais
          prática.
        </p>
        <p className="docs-paragraph">
          Em vez de depender apenas de mensagens antigas no WhatsApp ou anotações manuais, o Bite Menu centraliza essas
          informações em um ambiente mais estruturado dentro do dashboard.
        </p>
        <p className="docs-paragraph">
          Essa organização pode ser especialmente útil para estabelecimentos que recebem muitos pedidos e precisam de mais
          clareza sobre aquilo que já foi vendido.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="ferramentas-da-aba-vendas">
        <h2 className="docs-title">Ferramentas presentes na aba Vendas</h2>
        <p className="docs-paragraph">
          A aba <strong>Vendas</strong> foi criada para facilitar o acompanhamento do desempenho comercial do
          estabelecimento. Entre os recursos que podem estar disponíveis nessa área, estão:
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Listagem das vendas concluídas</li>
          <li>Visualização detalhada de cada venda</li>
          <li>Consulta de itens, quantidades e valores</li>
          <li>Organização cronológica do histórico de vendas</li>
          <li>Filtragem de vendas por nome, telefone, itens</li>
          <li>Ordenação por preço e por data</li>
        </ul>
        <p className="docs-paragraph">
          Esses recursos ajudam a transformar os dados do dia a dia em informações mais úteis para gestão e tomada de
          decisão.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="detalhes-de-cada-venda">
        <h2 className="docs-title">Detalhes de cada venda</h2>
        <p className="docs-paragraph">
          Ao abrir uma venda específica, você pode visualizar com mais atenção as informações relacionadas àquela
          finalização. Isso facilita a conferência dos dados e ajuda a manter um histórico bem organizado.
        </p>
        <p className="docs-paragraph">Entre os detalhes mais importantes que podem aparecer, estão:</p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Nome do cliente</li>
          <li>Itens vendidos</li>
          <li>Quantidade de cada item</li>
          <li>Observações, quando houver</li>
          <li>Forma de pagamento</li>
          <li>Serviço selecionado</li>
          <li>Valor total</li>
          <li>Data e horário do registro</li>
        </ul>
        <p className="docs-paragraph">
          Essa visualização mais completa ajuda a consultar o histórico com segurança e encontrar rapidamente as informações
          necessárias.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="vantagens-da-aba-vendas">
        <h2 className="docs-title">Vantagens de usar a aba Vendas</h2>
        <p className="docs-paragraph">
          Utilizar a aba <strong>Vendas</strong> no Bite Menu pode trazer diversos benefícios para a rotina do
          estabelecimento, principalmente para quem deseja acompanhar melhor os resultados do negócio.
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Mais organização sobre o que já foi vendido</li>
          <li>Histórico de vendas centralizado no dashboard</li>
          <li>Mais clareza sobre valores e registros anteriores</li>
          <li>Facilidade para acompanhar o desempenho do estabelecimento</li>
          <li>Menor dependência de controles manuais</li>
          <li>Base mais estruturada para futuras análises</li>
        </ul>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="boas-praticas-para-acompanhar-vendas">
        <h2 className="docs-title">Boas práticas para acompanhar vendas</h2>
        <p className="docs-paragraph">
          Para aproveitar melhor a aba de vendas e manter um histórico mais confiável no Bite Menu, vale a pena seguir
          algumas boas práticas:
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Finalize corretamente os pedidos que já foram concluídos</li>
          <li>Revise os registros com frequência</li>
          <li>Confira valores e formas de pagamento com atenção</li>
          <li>Mantenha os produtos e preços sempre atualizados no cardápio</li>
          <li>Acompanhe o histórico para entender melhor a rotina do seu negócio</li>
        </ul>
        <p className="docs-paragraph">
          Esses cuidados ajudam a manter a operação mais organizada e tornam o acompanhamento das vendas muito mais útil no
          dia a dia.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="dashboard-de-vendas">
        <h2 className="docs-title">Dashboard de vendas</h2>
        <p className="docs-paragraph">
          O dashboard de vendas traz dados mais avançados acompanhado de gráficos das suas vendas, ele é uma funcionalidade
          exclusiva para assinantes do <strong>Bite Menu Pro</strong>
        </p>
        <p className="docs-paragraph">Entre as funcionalidades do Dashboard de vendas, estão:</p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Filtragem por datas específicas</li>
          <li>Valor total por períodos</li>
          <li>Quantidade de vendas por períodos</li>
          <li>Tickets médios</li>
          <li>Gráfico de vendas x valor das vendas</li>
          <li>Visualização de métodos de pagamento mais frequentes</li>
          <li>Visualização de serviços mais frequentes</li>
          <li>Lista de produtos mais vendidos</li>
        </ul>
        <p className="docs-paragraph">
          Com essas funcionalidades, o Bite Menu passa a ser uma ferramenta de análise para suas vendas, com informações
          precisas que vem diretamente do seu sistema de pedidos.
        </p>
      </section>
    </div>
  );
};

export default page;
