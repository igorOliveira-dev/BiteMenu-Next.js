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
    <div className="max-w-[1080px] flex flex-col">
      <h1 className="default-h1">
        Bite Menu - <span className="hidden xxs:inline">Documentação</span>
        <span className="inline xxs:hidden">Docs</span>
      </h1>

      <section className="mt-4">
        <h2 className="font-semibold">Bem-vindo à documentação do Bite Menu!</h2>
        <p>
          Aqui você encontrará guias de uso, respostas de FAQs e tudo o que precisa para aproveitar ao máximo o Bite Menu.
          Basta navegar pelo menu lateral e encontrar o que precisa.
        </p>

        <h3 className="font-semibold mt-2">Navegação na documentação</h3>
        <p>
          <span className="hidden lg:inline">
            Para encontrar o que precisa na documentação do Bite Menu, utilize o menu lateral de navegação, à esquerda da sua
            tela!
          </span>
          <span className="inline lg:hidden">
            Para encontrar o que precisa na documentação do Bite Menu, utilize o menu lateral de navegação, que pode ser
            acessado clicando no ícone de menu no canto superior direito da sua tela!
          </span>
        </p>

        <h3 className="font-semibold mt-2">Dúvidas e sugestões</h3>
        <p>
          No Bite Menu valorizamos muito a experiência do cliente e trabalhamos sempre para atender todas as necessidades. Se
          surgir qualquer dúvida ou sugestão,{" "}
          <Link href="/support" className="underline text-blue-500 hover:text-blue-700">
            entre em contato conosco
          </Link>
          !
        </p>
      </section>
    </div>
  );
};

export default page;
