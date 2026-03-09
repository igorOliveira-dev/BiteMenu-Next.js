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
        <p className="mb-2">
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
          . Preencha os campos necessários:
        </p>
        <ul className="list-disc list-inside mb-2">
          <li>
            <strong>Nome:</strong> Utilizado para identifcar o proprietário do cardápio.
          </li>
          <li>
            <strong>Telefone:</strong> O telefone deve ser fornecido para que seus clientes enviem a confirmação do pedido
            via WhatsApp. Certifique-se de fornecer o número utilizado para pedidos no seu estabelecimento, para que os
            clientes não enviem pedidos para um número diferente.
          </li>
          <li>
            <strong>Email:</strong> Necessário para login e recuperação de senha e diversas outras ações relacionadas a
            conta. Certifique-se de usar um email válido, pois ele pode ser usado para enviar notificações e atualizações
            sobre o seu cardápio.
          </li>
          <li>
            <strong>Senha:</strong> Escolha uma senha forte para proteger sua conta. Você precisará dessa senha para acessar
            o painel de controle do Bite Menu e gerenciar seu cardápio digital. Certifique-se de lembrar sua senha ou use um
            gerenciador de senhas para armazená-la com segurança.
          </li>
        </ul>
        <p className="mb-2">Após preencher essas informações, clique no botão "Registrar" e a sua conta será criada.</p>
      </section>
      <section className="mt-4" id="preenchimento-do-formulario">
        <h2 className="font-semibold">Preenchimento do formulário</h2>
        <p className="mb-2">
          Após criar sua conta, você será redirecionado para um formulário rápido para informar dados importantes do seu
          estabelecimento. Nenhum desses dados é obrigatório, mas recomendamos que você preencha o máximo possível para
          oferecer uma melhor experiência aos seus clientes. Esses dados serão exibidos no seu cardápio digital, então quanto
          mais completo, melhor!
        </p>
        <p className="mb-2">Os dados que podem ser preenchidos no formulário são os seguintes:</p>
        <ul className="list-disc list-inside mb-2">
          <li>
            <strong>Nome do estabelecimento:</strong>
          </li>
          <li>
            <strong>Serviços oferecidos:</strong>
          </li>
          <li>
            <strong>Logo do estabelecimento:</strong>
          </li>
          <li>
            <strong>Banner do estabelecimento:</strong>
          </li>
          <li>
            <strong>Cores do cardápio:</strong>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default page;
