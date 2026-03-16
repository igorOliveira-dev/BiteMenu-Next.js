import Link from "next/link";

export const metadata = {
  title: "Documentação - Bite Menu",
  description: "Guias completos, perguntas frequentes e instruções para usar o Bite Menu e criar seu cardápio digital.",

  alternates: {
    canonical: "https://www.bitemenu.com.br/docs",
  },

  openGraph: {
    title: "Documentação - Bite Menu",
    description: "Aprenda a usar o Bite Menu com nossos guias e FAQs.",
    url: "https://www.bitemenu.com.br/docs",
    siteName: "Bite Menu",
    type: "website",
  },
};

const page = () => {
  return (
    <div className="max-w-[1080px] flex flex-col scroll-mt-[90px]">
      <h1 className="default-h1 docs-title">
        Bite Menu - <span className="hidden xxs:inline">Documentação</span>
        <span className="inline xxs:hidden">Docs</span>
      </h1>

      <section className="mt-4 scroll-mt-[90px]" id="introducao">
        <h2 className="docs-title">O que é o Bite Menu?</h2>
        <p className="docs-paragraph">
          O <strong>Bite Menu</strong> é uma plataforma para criar <strong>cardápios digitais profissionais</strong> de forma
          rápida e simples. Com ele, restaurantes, bares, lanchonetes, cafeterias e outros estabelecimentos podem
          disponibilizar seus produtos online através de um link ou QR Code, facilitando o acesso dos clientes ao cardápio.
        </p>

        <p className="docs-paragraph">
          O sistema permite adicionar produtos, categorias, descrições, imagens e preços, organizando tudo em um cardápio
          digital moderno que pode ser acessado diretamente pelo celular dos clientes.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="para-quem-e">
        <h2 className="docs-title">Para quem é o Bite Menu?</h2>
        <p className="docs-paragraph">
          O Bite Menu foi desenvolvido para estabelecimentos que desejam ter um cardápio digital simples, rápido e fácil de
          atualizar, sem precisar de conhecimentos técnicos.
        </p>
        <p className="docs-paragraph">Ele é ideal para:</p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Restaurantes</li>
          <li>Lanchonetes</li>
          <li>Pizzarias</li>
          <li>Bares</li>
          <li>Cafeterias</li>
          <li>Qualquer negócio que queira apresentar seus produtos online</li>
        </ul>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="como-funciona">
        <h2 className="docs-title">Como funciona?</h2>
        <p className="docs-paragraph">
          Depois de criar sua conta no Bite Menu, você pode montar seu cardápio adicionando categorias e produtos. Cada
          cardápio recebe um <strong>link exclusivo</strong>, que pode ser compartilhado com clientes ou transformado em um
          QR Code para mesas, balcões ou embalagens.
        </p>

        <p className="docs-paragraph">
          Sempre que você atualizar um produto, preço ou descrição, as alterações aparecem automaticamente no cardápio
          digital dos clientes.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="sobre-documentacao">
        <h2 className="docs-title">Sobre esta documentação</h2>
        <p className="docs-paragraph">
          Nesta documentação você encontrará guias, tutoriais passo a passo e respostas para dúvidas frequentes sobre o uso
          do Bite Menu.
        </p>

        <h3 className="docs-title">Navegação na documentação</h3>
        <p className="docs-paragraph">
          <span className="hidden lg:inline">
            Utilize o menu lateral de navegação, à esquerda da tela, para acessar os diferentes guias e páginas da
            documentação.
          </span>
          <span className="inline lg:hidden">
            Utilize o menu lateral, acessível pelo ícone no canto superior direito, para navegar pelos guias da documentação.
          </span>
        </p>

        <h3 className="docs-title">Dúvidas ou sugestões</h3>
        <p className="docs-paragraph">
          Se surgir qualquer dúvida ou se você tiver alguma sugestão para melhorar o Bite Menu,{" "}
          <Link href="/support" className="underline text-blue-500 hover:text-blue-700">
            entre em contato com o suporte
          </Link>
          .
        </p>
      </section>
    </div>
  );
};

export default page;
