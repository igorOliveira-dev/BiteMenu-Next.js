import React from "react";

export const metadata = {
  title: "Cardápio Digital: o que é, como funciona e como criar o seu | Bite Menu",
  description:
    "Descubra o que é um cardápio digital, como funciona e como criar o seu para vender mais no WhatsApp. Guia completo para restaurantes e delivery.",

  alternates: {
    canonical: "https://www.bitemenu.com.br/docs/cardapio-digital",
  },

  openGraph: {
    title: "Cardápio Digital - Bite Menu",
    description:
      "Descubra o que é um cardápio digital, como funciona e como criar o seu para vender mais no WhatsApp. Guia completo para restaurantes e delivery.",
    url: "https://www.bitemenu.com.br/docs/cardapio-digital",
    siteName: "Bite Menu",
    type: "website",
  },
};

const page = () => {
  return (
    <div className="max-w-[1080px] flex flex-col scroll-mt-[90px]">
      <h1 className="default-h1">Cardápio Digital</h1>

      <section className="mt-4 scroll-mt-[90px]" id="o-que-e-o-cardapio-digital">
        <h2 className="docs-title">O que é o cardápio digital?</h2>
        <p className="docs-paragraph">
          O <strong>cardápio digital do Bite Menu</strong> é a página online do seu estabelecimento, onde seus clientes podem
          visualizar categorias, produtos, preços, descrições, imagens e montar um pedido de forma simples e rápida,
          diretamente pelo celular ou computador.
        </p>
        <p className="docs-paragraph">
          Em vez de depender de cardápios físicos, arquivos em PDF ou mensagens manuais para mostrar seus produtos, o
          cardápio digital centraliza tudo em um só lugar, com uma experiência mais organizada, bonita e fácil de atualizar.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="como-o-cliente-acessa">
        <h2 className="docs-title">Como o cliente acessa?</h2>
        <p className="docs-paragraph">
          Cada cardápio criado no Bite Menu possui um link próprio, que pode ser compartilhado em redes sociais, WhatsApp,
          Instagram, Google, bio do perfil ou até transformado em QR Code para uso no balcão, nas mesas ou em materiais
          impressos.
        </p>
        <p className="docs-paragraph">
          Esse link é formado a partir do <strong>slug</strong> do seu cardápio, que funciona como o identificador da sua
          página. Por exemplo: <strong>bitemenu.com.br/menu/seu-estabelecimento</strong>.
        </p>
        <p className="docs-paragraph">
          Quando o cliente acessa esse link, ele vê o seu cardápio digital pronto para navegação e pedido, sem precisar
          baixar aplicativo ou criar conta.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="o-que-aparece-no-cardapio">
        <h2 className="docs-title">O que aparece no cardápio?</h2>
        <p className="docs-paragraph">
          O cardápio digital é montado com base nas informações cadastradas e configuradas por você no painel do Bite Menu.
          Dependendo do que foi preenchido, o cliente poderá visualizar:
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Nome do estabelecimento</li>
          <li>Logo e banner</li>
          <li>Descrição do negócio</li>
          <li>Endereço</li>
          <li>Categorias de produtos</li>
          <li>Itens com nome, descrição, preço, imagem e adicionais</li>
          <li>Itens em destaque, quando disponíveis no plano</li>
          <li>Preços promocionais, quando disponíveis no plano</li>
          <li>Serviços disponíveis, como entrega, retirada ou consumo local</li>
          <li>Formas de pagamento aceitas</li>
          <li>Horários de funcionamento</li>
        </ul>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="como-funciona-o-pedido">
        <h2 className="docs-title">Como funciona o pedido?</h2>
        <p className="docs-paragraph">
          O cliente navega pelo cardápio, escolhe os itens desejados e adiciona tudo ao pedido. Depois disso, ele pode
          revisar os produtos selecionados, informar os dados necessários e escolher o serviço desejado, como entrega,
          retirada ou consumo local, dependendo do que estiver habilitado no seu cardápio.
        </p>
        <p className="docs-paragraph">
          Ao finalizar, o pedido é organizado em uma mensagem pronta para envio via WhatsApp e as informações também são
          armazenadas na aba "Pedidos" do seu dashboard, facilitando a comunicação entre o cliente e o estabelecimento. Dessa
          forma, o Bite Menu ajuda a tornar o processo de pedido mais rápido, claro e profissional.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="personalizacao-do-cardapio">
        <h2 className="docs-title">Personalização do cardápio</h2>
        <p className="docs-paragraph">
          O cardápio digital pode ser personalizado para combinar com a identidade visual do seu estabelecimento. Isso ajuda
          a transmitir mais profissionalismo e fortalece a sua marca diante dos clientes.
        </p>
        <p className="docs-paragraph">Entre os elementos que podem ser personalizados, estão:</p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Nome do estabelecimento</li>
          <li>Endereço</li>
          <li>Descrição</li>
          <li>Logo</li>
          <li>Banner</li>
          <li>Cores do cardápio</li>
          <li>Slug do link</li>
          <li>Itens em destaque (plano Plus ou Pro)</li>
        </ul>
        <p className="docs-paragraph">
          Essas configurações podem ser alteradas a qualquer momento no painel de controle, permitindo atualizar o visual do
          cardápio sempre que necessário.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="organizacao-dos-itens">
        <h2 className="docs-title">Organização dos itens</h2>
        <p className="docs-paragraph">
          Os produtos do seu cardápio digital são organizados em <strong>categorias</strong>. Isso facilita a navegação dos
          clientes e deixa a visualização mais clara, principalmente em estabelecimentos com muitos produtos.
        </p>
        <p className="docs-paragraph">
          Você pode criar categorias como, por exemplo, lanches, bebidas, porções, sobremesas ou qualquer outra divisão que
          faça sentido para o seu negócio. Dentro de cada categoria, é possível cadastrar os itens com suas respectivas
          informações.
        </p>
        <p className="docs-paragraph">
          Um cardápio bem organizado ajuda o cliente a encontrar o que procura mais rápido e pode aumentar as chances de
          conversão em pedido.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="itens-em-destaque-e-promocoes">
        <h2 className="docs-title">Itens em destaque e promoções</h2>
        <p className="docs-paragraph">
          Dependendo do plano contratado, você pode utilizar recursos extras para dar mais visibilidade a determinados
          produtos no seu cardápio digital.
        </p>
        <p className="docs-paragraph">
          Os <strong>itens em destaque</strong> aparecem em uma posição privilegiada no início do cardápio, ajudando a chamar
          a atenção do cliente para produtos estratégicos, lançamentos ou itens com maior potencial de venda.
        </p>
        <p className="docs-paragraph">
          Já os <strong>preços promocionais</strong> permitem evidenciar ofertas e descontos, tornando o cardápio mais
          atrativo e incentivando a decisão de compra.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="horarios-e-disponibilidade">
        <h2 className="docs-title">Horários e disponibilidade</h2>
        <p className="docs-paragraph">
          O Bite Menu permite configurar os horários de funcionamento do estabelecimento para cada dia da semana. Isso é
          importante para que o cliente saiba quando pode realizar pedidos e para evitar solicitações fora do horário de
          atendimento.
        </p>
        <p className="docs-paragraph">
          Além disso, as configurações do cardápio ajudam a deixar a experiência mais alinhada com a operação real do seu
          negócio, incluindo serviços disponíveis, taxa de entrega e formas de pagamento aceitas.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="vantagens-do-cardapio-digital">
        <h2 className="docs-title">Vantagens do cardápio digital</h2>
        <p className="docs-paragraph">
          Usar um cardápio digital traz benefícios tanto para o estabelecimento quanto para os clientes. Entre as principais
          vantagens, estão:
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Facilidade para atualizar preços, descrições e produtos</li>
          <li>Melhor organização visual do cardápio</li>
          <li>Mais praticidade para os clientes fazerem pedidos</li>
          <li>Link fácil de compartilhar em qualquer canal</li>
          <li>Experiência mais profissional para o estabelecimento</li>
          <li>Redução da dependência de cardápios físicos</li>
          <li>Maior destaque para promoções e produtos estratégicos</li>
          <li>Chances altas do seu cardápio aparecer nas pesquisas do Google</li>
        </ul>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="boas-praticas">
        <h2 className="docs-title">Boas práticas para ter um bom cardápio digital</h2>
        <p className="docs-paragraph">
          Para aproveitar melhor o seu cardápio digital, vale a pena seguir algumas boas práticas no momento de configurar e
          cadastrar seus produtos:
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Use nomes claros e fáceis de entender</li>
          <li>Escreva descrições objetivas e úteis</li>
          <li>Mantenha os preços sempre atualizados</li>
          <li>Utilize imagens de boa qualidade</li>
          <li>Organize bem as categorias</li>
          <li>Escolha cores que combinem com sua marca</li>
          <li>Revise periodicamente os itens e configurações</li>
          <li>Use o máximo de funcionalidades disponíveis</li>
        </ul>
        <p className="docs-paragraph">
          Pequenos ajustes como esses podem melhorar bastante a experiência do cliente e deixar seu cardápio mais eficiente.
        </p>
      </section>
    </div>
  );
};

export default page;
