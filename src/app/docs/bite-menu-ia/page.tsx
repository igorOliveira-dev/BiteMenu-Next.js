import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Bite Menu IA - Bite Menu",
  description: "Conheça o Bite Menu IA, o assistente que altera o seu cardápio digital a partir de um pedido em texto.",

  alternates: {
    canonical: "https://www.bitemenu.com.br/docs/bite-menu-ia",
  },

  openGraph: {
    title: "Bite Menu IA - Bite Menu",
    description: "O assistente de inteligência artificial do Bite Menu.",
    url: "https://www.bitemenu.com.br/docs/bite-menu-ia",
    siteName: "Bite Menu",
    type: "website",
  },
};

const page = () => {
  return (
    <div className="max-w-[1080px] flex flex-col scroll-mt-[90px]">
      <h1 className="default-h1">Bite Menu IA</h1>

      <section className="mt-4 scroll-mt-[90px]" id="o-que-e">
        <h2 className="docs-title">O que é o Bite Menu IA?</h2>
        <p className="docs-paragraph">
          O <strong>Bite Menu IA</strong> é o assistente de inteligência artificial do Bite Menu, incluso no{" "}
          <Link href="/docs/planos#business" className="underline text-blue-500 hover:text-blue-700">
            Plano Business
          </Link>
          . Você escreve o que quer mudar e ele prepara a alteração para você, sem precisar procurar a opção em nenhuma
          tela.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="onde-fica">
        <h2 className="docs-title">Onde fica?</h2>
        <p className="docs-paragraph">
          No dashboard, na aba "Cardápio", logo acima do botão "Configurar cardápio". No celular, o botão fica flutuando
          junto com o "Configurar cardápio". Ao clicar, a janela do assistente abre no meio da tela.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="o-que-ele-faz">
        <h2 className="docs-title">O que ele consegue fazer</h2>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Cadastrar produtos e categorias, inclusive colando o seu cardápio inteiro em texto</li>
          <li>Editar nome, descrição, preço e preço promocional dos produtos</li>
          <li>Criar e editar variações (como tamanhos) e grupos de opções (como adicionais) dos produtos</li>
          <li>Ocultar ou exibir categorias, produtos e grupos de opções</li>
          <li>Alterar o estoque dos produtos</li>
          <li>Alterar horários, taxa de entrega, bairros, pedido mínimo, formas de pagamento, serviços e chave PIX</li>
          <li>Alterar título, descrição e cores do cardápio</li>
        </ul>
        <p className="docs-paragraph">Alguns exemplos de pedidos:</p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>"Fecha aos domingos e abre às 18h no sábado"</li>
          <li>"Muda a taxa de entrega para R$ 7"</li>
          <li>"Coloca o grupo Molhos, com barbecue e maionese grátis, em todos os lanches"</li>
          <li>"Oculta a categoria Bebidas"</li>
          <li>"Coloca um preço promocional de 20% em todos os itens"</li>
          <li>Colar o seu cardápio em texto e pedir para cadastrar tudo</li>
        </ul>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="confirmacao-e-preview">
        <h2 className="docs-title">Confirmação e preview</h2>
        <p className="docs-paragraph">
          Nada é salvo sem a sua confirmação. Para cada pedido, o assistente mostra o que vai mudar, com o valor antes e
          depois. Quando a alteração aparece no cardápio do cliente, como produtos novos, cores ou itens ocultados, ele
          mostra também um preview de como o cardápio vai ficar antes de você salvar.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="seguranca">
        <h2 className="docs-title">Segurança</h2>
        <p className="docs-paragraph">
          Por segurança, o Bite Menu IA não exclui nada do seu cardápio: ele só cria, altera e oculta. Opções, variações e
          grupos que você não mencionar continuam como estão. Se quiser tirar algo da vista dos clientes, ele oferece
          ocultar. Ele também só responde sobre o seu cardápio no Bite Menu.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="limite-de-uso">
        <h2 className="docs-title">Limite de uso</h2>
        <p className="docs-paragraph">
          O uso tem um limite por sessão de 5 horas. A porcentagem usada e o horário em que o limite renova aparecem no
          topo da janela do assistente. Quando o limite renova, você pode continuar usando normalmente.
        </p>
      </section>
    </div>
  );
};

export default page;
