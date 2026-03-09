import Link from "next/link";

export const metadata = {
  title: "Como começar - Bite Menu",
  description: "Aprenda a criar seu cardápio digital com o Bite Menu em poucos passos.",

  alternates: {
    canonical: "https://www.bitemenu.com.br/docs/como-comecar",
  },

  openGraph: {
    title: "Como começar - Bite Menu",
    description: "Aprenda a criar seu cardápio digital com o Bite Menu em poucos passos.",
    url: "https://www.bitemenu.com.br/docs/como-comecar",
    siteName: "Bite Menu",
    type: "website",
  },
};

const page = () => {
  return (
    <div className="max-w-[1080px] flex flex-col">
      <h1 className="default-h1">Como começar</h1>

      <nav className="my-2">
        <Link className="underline text-blue-500 hover:text-blue-700" href="#criacao-de-conta">
          Criação de conta
        </Link>
        {" - "}
        <Link className="underline text-blue-500 hover:text-blue-700" href="#preenchimento-do-formulario">
          Preenchimento do formulário
        </Link>
        {" - "}
        <Link className="underline text-blue-500 hover:text-blue-700" href="#criacao-de-itens">
          Criação de itens
        </Link>
        {" - "}
        <Link className="underline text-blue-500 hover:text-blue-700" href="#configuracoes-basicas">
          Configurações básicas
        </Link>
      </nav>

      <section className="mt-4" id="criacao-de-conta">
        <h2 className="font-semibold">Criação de conta</h2>
        <p>
          O primeiro passo para criar seu cardápio digital é criar uma conta no Bite Menu. Acesse o site e clique em "Criar
          conta" ou{" "}
          <a
            href="https://www.bitemenu.com.br/register"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500 hover:text-blue-700"
          >
            clique aqui para criar uma conta
          </a>
          . Preencha os campos necessários, como nome, email e senha, e siga as instruções para concluir o processo de
          registro.
        </p>
      </section>
    </div>
  );
};

export default page;
