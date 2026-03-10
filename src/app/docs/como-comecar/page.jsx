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
      <h1 className="default-h1 docs-title">Como começar</h1>

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

      <section className="mt-4 scroll-mt-[90px]" id="criacao-de-conta">
        <h2 className="docs-title">Criação de conta</h2>
        <p className="docs-paragraph">
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
        <ul className="list-disc list-inside docs-paragraph">
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
        <p className="docs-paragraph">
          Após preencher essas informações, clique no botão "Registrar" e a sua conta será criada.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="preenchimento-do-formulario">
        <h2 className="docs-title">Preenchimento do formulário</h2>
        <p className="docs-paragraph">
          Após criar sua conta, você será redirecionado para um formulário rápido para informar dados importantes do seu
          estabelecimento. Esses dados serão exibidos no seu cardápio digital, então quanto mais completo, melhor!
        </p>
        <p className="docs-paragraph">Os dados que podem ser preenchidos no formulário são os seguintes:</p>
        <ul className="list-disc list-inside docs-paragraph">
          <li>
            <strong>Nome do estabelecimento:</strong> O nome do seu estabelecimento é a primeira coisa que os clientes verão
            ao acessar seu cardápio digital. Certifique-se de usar o nome oficial do seu estabelecimento para que os clientes
            possam reconhecê-lo facilmente. Se o nome do seu estabelecimento for muito longo, considere usar uma versão
            abreviada ou um apelido que seja facilmente identificável.
          </li>
          <li>
            <strong>Serviços oferecidos:</strong> Selecione os serviços que o seu estabalecimento oferece, como entrega,
            retirada, consumo local ou atendimento presencial. O cliente poderá selecionar o serviço desejado ao fazer seu
            pedido no cardápio digital, então é importante que você informe corretamente quais serviços estão disponíveis no
            seu estabelecimento.
          </li>
          <li>
            <strong>Logo do estabelecimento:</strong> A logo do estabelecimento é um elemento visual importante para a
            identidade do seu cardápio digital. Certifique-se de usar uma imagem que represente bem o seu estabelecimento no
            formato quadrado. A logo será exibida no topo do cardápio digital, ao lado do nome do estabelecimento.
          </li>
          <li>
            <strong>Banner do estabelecimento:</strong> O banner do estabelecimento é uma imagem grande que aparecerá no topo
            do cardápio digital, acima da logo e do nome do estabelecimento. Use uma imagem que seja atraente e represente
            bem o seu estabelecimento. O banner é uma ótima oportunidade para mostrar a atmosfera do seu estabelecimento
            mesmo antes dos clientes verem os itens do cardápio.
          </li>
          <li>
            <strong>Cores do cardápio:</strong> Escolha as cores que melhor representam a identidade do seu estabelecimento e
            que criem uma experiência visual agradável para os clientes. As cores serão aplicadas ao cardápio digital para
            manter a consistência visual e reforçar a marca.
          </li>
        </ul>
        <p className="docs-paragraph">
          Lembre-se que todas essas informações podem ser editadas posteriormente no painel de controle do Bite Menu, então
          não se preocupe em preencher tudo perfeitamente na primeira vez. O importante é fornecer informações básicas para
          que seu cardápio digital tenha uma boa aparência e ofereça uma experiência agradável aos clientes.
        </p>
        <p className="docs-paragraph">
          Após terminar de preencher o formulário, clique no botão "Criar meu cardápio" para criar seu cardápio digital. Você
          será redirecionado para o painel de controle do Bite Menu, onde poderá começar a criar os itens do seu cardápio e
          configurar diferentes opções para o seu estabelecimento.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="criacao-de-itens">
        <h2 className="docs-title">Criação de itens</h2>
        <p className="docs-paragraph">
          Agora que seu cardápio digital está criado, você pode começar a adicionar itens ao seu menu.
        </p>
        <p className="docs-paragraph">
          Para isso, acesse o{" "}
          <a
            href="https://www.bitemenu.com.br/dashboard"
            target="_blank"
            className="underline text-blue-500 hover:text-blue-700"
          >
            dashboard do Bite Menu
          </a>{" "}
          e clique no botão "+ categoria" para criar uma nova categoria de itens. Dê um nome para a categoria e clique em
          "Salvar".
        </p>
        <p className="docs-paragraph">
          Depois, clique no botão "+ item" dentro da categoria que você acabou de criar para adicionar um novo item ao seu
          cardápio digital. Preencha os campos necessários, como nome do item, descrição, preço e imagem, e clique em
          "Salvar" para salvar as informações.
        </p>
        <p className="docs-paragraph">
          Repita esse processo para adicionar quantas categorias e itens desejar ao seu cardápio digital. Se chegar ao limite
          de itens ou categorias permitido no seu plano, você pode fazer um{" "}
          <a
            href="https://www.bitemenu.com.br/pricing"
            target="_blank"
            className="underline text-blue-500 hover:text-blue-700"
          >
            upgrade para um plano superior
          </a>{" "}
          para desbloquear mais categorias e itens.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="configuracoes-basicas">
        <h2 className="docs-title">Configurações básicas</h2>
        <p className="docs-paragraph">
          Após criar seu cardápio digital, você pode configurar várias opções para personalizar a experiência do cliente.
          Acesse o{" "}
          <a
            href="https://bitemenu.com.br/dashboard"
            target="_blank"
            className="underline text-blue-500 hover:text-blue-700"
          >
            dashboard do Bite Menu
          </a>{" "}
          e clique no botão "Configurar cardápio" para acessar as configurações do seu cardápio digital. Lá, você pode
          configurar opções como:
        </p>
        <ul className="list-disc list-inside mb-4 docs-paragraph">
          <li>
            <strong>Nome do estabelecimento</strong>
          </li>
          <li>
            <strong>Descrição:</strong> Texto que aparece abaixo do nome do estabelecimento e da logo. Use esse espaço para
            fornecer uma breve descrição do seu estabelecimento, como o tipo de culinária que oferece, o ambiente ou qualquer
            outra informação relevante que possa atrair os clientes.
          </li>
          <li>
            <strong>Endereço:</strong> Informação que aparece abaixo do nome do estabelecimento e da logo, use caso pretenda
            informar o local do seu estabelecimento de uma forma fácil diretamente no cardápio digital.
          </li>
          <li>
            <strong>Slug:</strong> O slug é a parte final da URL do seu cardápio digital. Ele deve ser único e pode conter
            letras, números e hífens. O slug é importante para que os clientes possam acessar seu cardápio digital de forma
            fácil e rápida, então escolha um slug que seja fácil de lembrar e que represente bem o seu estabelecimento.
          </li>
          <li>
            <strong>Cores:</strong> Você pode alterar as cores do seu cardápio, isso inclui a cor do fundo, cor do título e
            cor dos detalhes do cardápio.
          </li>
          <li>
            <strong>Serviços disponíveis:</strong> Aqui você altera os serviços que seu estabelecimento oferece, como
            entrega, retirada, consumo local ou atendimento presencial. O cliente poderá selecionar o serviço desejado ao
            fazer seu pedido no cardápio digital.
          </li>
          <li>
            <strong>Taxa de entrega:</strong> Você pode definir uma taxa fixa de entrega para ser adicionada ao valor total
            do pedido quando o cliente selecionar a opção de entrega. Essa taxa será exibida no resumo do pedido antes do
            cliente finalizar a compra.
          </li>
          <li>
            <strong>Formas de pagamento:</strong> Você pode definir quais formas de pagamento seu estabelecimento aceita,
            como dinheiro, cartão de crédito, cartão de débito ou PIX. Essas opções serão exibidas para os clientes no
            momento de finalizar o pedido, para que eles possam escolher a forma de pagamento que preferirem.
          </li>
          <li>
            <strong>Chave PIX:</strong> Você pode fornecer a chave PIX do seu estabelecimento para que ela apareça no final
            do pedido quando o cliente selecionar a opção de pagamento via PIX. Isso facilita para os clientes que preferem
            usar PIX, pois eles terão a chave PIX do seu estabelecimento facilmente acessível no momento de finalizar o
            pedido.
          </li>
          <li>
            <strong>Horários de funcionamento: </strong> Você pode definir os horários de funcionamento do seu
            estabelecimento para cada dia da semana, assim os clientes só poderão realizar os pedidos nos horários que o
            estabelecimento está aberto.
          </li>
        </ul>
      </section>
    </div>
  );
};

export default page;
