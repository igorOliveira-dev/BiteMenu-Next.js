import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Planos - Bite Menu",
  description: "Guias completos, perguntas frequentes e instruções para usar o Bite Menu e criar seu cardápio digital.",

  alternates: {
    canonical: "https://www.bitemenu.com.br/docs/planos",
  },

  openGraph: {
    title: "Planos - Bite Menu",
    description: "Aprenda a usar o Bite Menu com nossos guias e FAQs.",
    url: "https://www.bitemenu.com.br/docs/planos",
    siteName: "Bite Menu",
    type: "website",
  },
};

const page = () => {
  return (
    <div className="max-w-[1080px] flex flex-col scroll-mt-[90px]">
      <h1 className="default-h1">Planos</h1>

      <section className="mt-4 scroll-mt-[90px]" id="como-funcionam-os-planos">
        <h2 className="docs-title">Como funcionam os planos?</h2>
        <p className="docs-paragraph">
          Os <strong>planos do Bite Menu</strong> são projetados para atender às necessidades de diferentes tipos de
          estabelecimento, oferecendo recursos e funcionalidades mais avançados à medida que você sobe de plano. Cada plano
          inclui um conjunto específico de recursos, como número de itens no cardápio, personalização, dashboards, entre
          outros. Você pode escolher o plano que melhor se encaixa no seu negócio e atualizar ou cancelar a qualquer momento.
        </p>

        <p className="docs-paragraph">
          Para saber mais sobre os recursos específicos de cada plano, continue lendo as seções abaixo.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="assinatura-de-planos">
        <h2 className="docs-title">Assinatura de Planos</h2>
        <p className="docs-paragraph">
          Você pode assinar qualquer um dos planos do Bite Menu a qualquer momento. Aceitamos pagamento apenas através de
          cartão de crédito, garantindo um processo de assinatura rápido e seguro. Não oferecemos opções de pagamento por
          boleto, transferência bancária ou PIX no momento.
        </p>
        <p className="docs-paragraph">
          A partir da assinatura do plano, você terá acesso imediato aos recursos e funcionalidades correspondentes ao plano
          escolhido. O pagamento é processado mensalmente, e você pode cancelar ou alterar seu plano a qualquer momento
          através da sua conta no Bite Menu.
        </p>
        <p className="docs-paragraph">
          Para fazer a assinatura, você deve acessar a{" "}
          <a href="https://www.bitemenu.com.br/pricing" className="underline text-blue-500 hover:text-blue-700">
            página de planos
          </a>{" "}
          e selecionar o plano desejado.
        </p>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="free">
        <h2 className="docs-title">Plano Free</h2>
        <p className="docs-paragraph">
          O <strong>Plano Free</strong> é feito para estabelecimentos que estão começando e querem experimentar o Bite Menu
          sem compromisso. Ele inclui recursos básicos para criar e gerenciar seu cardápio digital, com as seguintes
          limitações:
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Limite de 20 itens no cardápio</li>
          <li>Limite de 4 categorias no cardápio</li>
          <li>Não inclui diversas funcionalidades do Plus e do Pro</li>
        </ul>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="plus">
        <h2 className="docs-title">Plano Plus</h2>
        <p className="docs-paragraph">
          O <strong>Plano Plus</strong> é ideal para estabelecimentos que desejam expandir suas funcionalidades e oferecer
          uma experiência mais rica aos clientes. Ele inclui todos os recursos do plano básico, além de:
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Limite de 50 itens no cardápio</li>
          <li>Limite de 10 categorias no cardápio</li>
          <li>Função de preços promocionais, onde é possível definir descontos e ofertas em seus produtos</li>
          <li>Lista de produtos em destaque, os produtos selecionados aparecerão em destaque no começo do cardápio</li>
        </ul>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="pro">
        <h2 className="docs-title">Plano Pro</h2>
        <p className="docs-paragraph">
          O <strong>Plano Pro</strong> é o plano mais completo, destinado a estabelecimentos que buscam maximizar sua
          presença digital e otimizar suas operações. Ele inclui todos os recursos dos planos anteriores, além de:
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Limite de 200 itens no cardápio</li>
          <li>Limite de 20 categorias no cardápio</li>
          <li>Dashboard de vendas para análise de desempenho</li>
          <li>Acesso ao aplicativo Bite Menu para não precisar acessar o site</li>
          <li>Prioridade no suporte</li>
        </ul>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="troca-de-plano">
        <h2 className="docs-title">Troca de Plano</h2>
        <p className="docs-paragraph">
          O passo a passo abaixo é referente à troca de plano, ou seja, para quem já é assinante de um plano e deseja alterar
          para outro. Se você ainda não é assinante, basta acessar a{" "}
          <a href="https://www.bitemenu.com.br/pricing" className="underline text-blue-500 hover:text-blue-700">
            página de planos
          </a>{" "}
          e escolher o plano que melhor se encaixa no seu negócio.
        </p>
        <p className="docs-paragraph">
          Você pode alterar seu plano a qualquer momento através da sua conta no Bite Menu. Para fazer a troca, siga os
          passos abaixo:
        </p>
        <ol className="docs-paragraph list-decimal pl-6">
          <li>
            Acesse seu{" "}
            <a href="https://www.bitemenu.com.br/dashboard" className="underline text-blue-500 hover:text-blue-700">
              dashboard do Bite Menu
            </a>
          </li>
          <li>Vá para a aba "Conta"</li>
          <li>Acesse "Detalhes do plano"</li>
          <li>Cancele o plano atual</li>
          <li>
            Acesse a{" "}
            <a href="https://www.bitemenu.com.br/pricing" className="underline text-blue-500 hover:text-blue-700">
              página de planos
            </a>
          </li>
          <li>Escolha o novo plano e realize a assinatura</li>
        </ol>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="cancelamento">
        <h2 className="docs-title">Cancelamento</h2>
        <p className="docs-paragraph">
          Você pode cancelar seu plano a qualquer momento através da sua conta no Bite Menu. Para fazer o cancelamento, siga
          os passos abaixo:
        </p>
        <ol className="docs-paragraph list-decimal pl-6">
          <li>
            Acesse seu{" "}
            <a href="https://www.bitemenu.com.br/dashboard" className="underline text-blue-500 hover:text-blue-700">
              dashboard do Bite Menu
            </a>
          </li>
          <li>Vá para a aba "Conta"</li>
          <li>Acesse "Detalhes do plano"</li>
          <li>Cancele o plano atual</li>
        </ol>
      </section>

      <section className="mt-4 scroll-mt-[90px]" id="seguranca">
        <h2 className="docs-title">Segurança</h2>
        <p className="docs-paragraph">
          A segurança dos dados dos nossos clientes é uma prioridade. Utilizamos medidas de proteção avançadas para garantir
          que suas informações estejam sempre seguras.
        </p>
        <p className="docs-paragraph">
          Armazenamos em nosso banco de dados apenas as informações necessárias para identificar sua conta e verificar o
          estado do seu plano.
        </p>
        <p className="docs-paragraph">Não armazenamos informações de pagamento ou dados pessoais desnecessários.</p>
        <p className="docs-paragraph">
          Para garantir a segurança das transações, utilizamos os serviços da Stripe, um processador de pagamentos confiável
          e seguro, que lida com todas as informações de pagamento de forma segura.
        </p>
      </section>
    </div>
  );
};

export default page;
