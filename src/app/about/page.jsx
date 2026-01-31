"use client";

import Return from "@/components/Return";
import React from "react";

const page = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="fixed bg-translucid rounded-lg backdrop-blur-sm top-2 left-2 ">
        <Return />
      </div>
      <div className="max-w-3xl flex flex-col gap-6 p-4 pt-12">
        <h1 className="default-h1">Sobre o Bite Menu</h1>

        <section>
          <p>
            O <strong>Bite Menu</strong> nasceu com o propósito de facilitar a criação e gerenciamento de cardápios digitais
            para restaurantes, bares e estabelecimentos de alimentação. Queremos que cada cardápio seja bonito, funcional e
            acessível a todos. Com Bite Menu você pode:
          </p>
        </section>

        <section>
          <h2 className="xs:font-semibold">Criar cardápios digitais de forma simples, intuitiva e gratuita</h2>
          <p>
            Para criar um cardápio digital no Bite Menu, você deve criar sua conta em{" "}
            <a
              href="https://www.bitemenu.com.br/register"
              target="_blank"
              className="underline text-blue-500 hover:text-blue-700"
            >
              bitemenu.com.br/register
            </a>
            , então você será redirecionado a um formulário rápido com perguntas opicionais para deixar o cardápio com a cara
            do seu estabelecimento.
          </p>
          <p>
            Quando o formulário for enviado, você estará no{" "}
            <a
              href="https://www.bitemenu.com.br/dashboard"
              target="_blank"
              className="underline text-blue-500 hover:text-blue-700"
            >
              dashboard do Bite Menu
            </a>
            , lá você pode criar categorias e itens de acordo com o{" "}
            <a
              href="https://www.bitemenu.com.br/pricing"
              target="_blank"
              className="underline text-blue-500 hover:text-blue-700"
            >
              plano da sua conta
            </a>
            , configurar horários de funcionamento, cores, serviços, métodos de pagamentos, e muito mais.
          </p>
        </section>

        <section>
          <h2 className="xs:font-semibold">Adicionar imagens, logotipo e banners personalizados</h2>
          <p>
            No{" "}
            <a
              href="https://www.bitemenu.com.br/dashboard"
              target="_blank"
              className="underline text-blue-500 hover:text-blue-700"
            >
              dashboard do Bite Menu
            </a>
            , você pode adicionar logos, banners e imagens de produtos ao seu cardápio, deixando a experiência do seu cliente
            muito mais personalizada
          </p>
        </section>

        <section>
          <h2 className="xs:font-semibold">Compartilhar seus cardápios online via link</h2>
          <p>
            Quando o seu cardápio estiver pronto para compartilhar, basta clicar no botão "Copiar link" para começar a enviar
            o link do cardápio aos seus clientes. Você pode deixar o link em suas redes sociais, no seu perfil do WhatsApp ou
            em qualquer outro lugar que fique de fácil acesso para os seus clientes aproveitarem essa experiência de compra.
          </p>
        </section>

        <section>
          <h2 className="xs:font-semibold">Receber pedidos de clientes de forma prática no WhatsApp e/ou no site</h2>
          <p>
            Quando o cliente confirma a compra, você receberá uma mensagem dele organizada no seu WhatsApp, com os itens do
            pedido, observações, adicionais, forma de pagamento, serviço escolhido, nome do cliente e endereço (caso seja
            entrega).
          </p>
          <p>
            Você também receberá esse pedido no site (opicional) para manter o controle, fazer edições e registrar como venda
            quando o pedido for finalizado.
          </p>
        </section>

        <section>
          <h2 className="xs:font-semibold">Gerenciar pedidos e gerenciar vendas</h2>
          <p>
            Se você receber os pedidos pelo site, poderá finalizá-los e registrar como venda para ter controle de entrada de
            cada mês. Além disso, nos planos Plus e Pro você ganha acesso à um dashboard de vendas mais complexo para filtrar
            datas, ver dias e horários de cada venda, analisar entrada de caixa e ticket médio por período, ver número de
            vendas, etc.
          </p>
        </section>
      </div>
    </div>
  );
};

export default page;
