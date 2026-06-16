import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Pagamentos - Bite Menu",
  description:
    "Saiba como funciona o Stripe Connect Express no Bite Menu: taxas, prazos de repasse, reembolsos, configuração e perguntas frequentes.",

  alternates: {
    canonical: "https://www.bitemenu.com.br/docs/pagamentos",
  },

  openGraph: {
    title: "Pagamentos - Bite Menu",
    description:
      "Saiba como funciona o Stripe Connect Express no Bite Menu: taxas, prazos de repasse, reembolsos, configuração e perguntas frequentes.",
    url: "https://www.bitemenu.com.br/docs/pagamentos",
    siteName: "Bite Menu",
    type: "website",
  },
};

const page = () => {
  return (
    <div className="max-w-[1080px] flex flex-col scroll-mt-[90px]">
      <h1 className="default-h1">Pagamentos Bite Menu</h1>

      {/* ── Aviso de versão beta ── */}
      <section className="mt-4 scroll-mt-[90px]" id="aviso-beta">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm">
            <strong className="text-amber-500">⚠️ Versão em testes:</strong> Esta funcionalidade está em fase de testes e
            está disponível apenas em algumas contas selecionadas. Os recursos e condições descritos nesta página podem ser
            alterados sem aviso prévio durante o período de testes.
          </p>
        </div>
      </section>

      {/* ── Visão geral ── */}
      <section className="mt-4 scroll-mt-[90px]" id="visao-geral">
        <h2 className="docs-title">Visão geral</h2>
        <p className="docs-paragraph">
          O Bite Menu oferece uma integração com o <strong>Stripe Connect Express</strong> para que estabelecimentos possam
          receber pagamentos online diretamente dos seus clientes através do cardápio digital. Com essa integração, os
          valores são transferidos diretamente para a conta bancária do estabelecimento — o Bite Menu atua apenas como
          plataforma intermediadora e não retém os valores pagos pelos clientes.
        </p>
        <p className="docs-paragraph">
          O Bite Menu é uma <strong>plataforma de tecnologia</strong>, não uma instituição financeira, operadora de
          pagamentos ou adquirente. Todo o processamento financeiro é realizado pelo Stripe, empresa devidamente
          regulamentada para operar serviços de pagamento. Ao utilizar os Pagamentos Bite Menu, o estabelecimento concorda
          com os{" "}
          <a
            href="https://stripe.com/br/legal/connect-account"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500 hover:text-blue-700"
          >
            Termos de Serviço do Stripe Connect
          </a>{" "}
          além dos Termos de Uso do Bite Menu.
        </p>
        <p className="docs-paragraph">
          Para aceitar pagamentos online no seu cardápio, é necessário conectar uma conta Stripe à sua conta do Bite Menu. O
          processo é feito inteiramente dentro da plataforma.
        </p>
      </section>

      {/* ── Como configurar ── */}
      <section className="mt-4 scroll-mt-[90px]" id="como-configurar">
        <h2 className="docs-title">Como configurar</h2>
        <p className="docs-paragraph">Siga os passos abaixo para ativar os pagamentos no seu cardápio:</p>
        <ol className="docs-paragraph list-decimal pl-6">
          <li>
            Acesse seu{" "}
            <a href="https://www.bitemenu.com.br/dashboard" className="underline text-blue-500 hover:text-blue-700">
              dashboard do Bite Menu
            </a>
          </li>
          <li>
            No menu lateral, vá para a aba <strong>"Pagamentos Bite Menu"</strong>
          </li>
          <li>
            Clique em <strong>"Configurar recebimentos"</strong>
          </li>
          <li>
            Você será redirecionado ao Stripe para criar ou conectar sua conta. Tenha em mãos:
            <ul className="list-disc pl-6 mt-1">
              <li>CPF ou CNPJ válido</li>
              <li>Dados bancários para recebimento</li>
              <li>Documento de identidade para verificação</li>
            </ul>
          </li>
          <li>Conclua o onboarding no Stripe e volte ao Bite Menu</li>
          <li>
            Com a conta conectada, ative o Stripe no cardápio pelo toggle <strong>"Ativar Stripe no cardápio"</strong>
          </li>
          <li>
            Selecione os <strong>métodos de pagamento</strong> que devem redirecionar o cliente ao Stripe
          </li>
        </ol>
        <p className="docs-paragraph">Após esses passos, seu cardápio estará pronto para aceitar pagamentos online.</p>
      </section>

      {/* ── Taxas ── */}
      <section className="mt-4 scroll-mt-[90px]" id="taxas">
        <h2 className="docs-title">Taxas por transação</h2>
        <p className="docs-paragraph">
          Cada transação processada pelo Stripe no Bite Menu está sujeita a duas taxas distintas e independentes:
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>
            <strong>2% — Bite Menu:</strong> taxa de plataforma cobrada pelo Bite Menu sobre o valor bruto de cada transação
            bem-sucedida. Essa taxa é descontada automaticamente pelo Stripe antes do repasse ao estabelecimento.
          </li>
          <li>
            <strong>Taxa do Stripe:</strong> definida pelo próprio Stripe conforme o método de pagamento, o país do
            estabelecimento e o perfil da conta. O Bite Menu não recebe e não tem influência sobre essa taxa. Consulte a{" "}
            <a
              href="https://stripe.com/br/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500 hover:text-blue-700"
            >
              página de preços do Stripe
            </a>{" "}
            para saber os valores exatos aplicáveis à sua conta.
          </li>
        </ul>
        <p className="docs-paragraph">
          As taxas são descontadas automaticamente antes do repasse. O estabelecimento recebe o valor líquido diretamente na
          conta bancária cadastrada, sem nenhuma ação manual necessária.
        </p>
        <p className="docs-paragraph">
          <strong>Importante:</strong> a taxa de 2% do Bite Menu <strong>não é reembolsável</strong> em caso de cancelamento
          ou estorno de pedido, uma vez que a cobrança está vinculada ao processamento da transação e não ao recebimento do
          pedido pelo estabelecimento.
        </p>
      </section>

      {/* ── Prazo de repasse ── */}
      <section className="mt-4 scroll-mt-[90px]" id="prazo-de-repasse">
        <h2 className="docs-title">Prazo de repasse</h2>
        <p className="docs-paragraph">
          O prazo para o dinheiro chegar na sua conta bancária é definido <strong>exclusivamente pelo Stripe</strong> e varia
          conforme o seu perfil, o método de pagamento utilizado e o seu histórico de transações.{" "}
          <strong>O Bite Menu não tem controle, responsabilidade ou capacidade de intervenção sobre esses prazos.</strong>
        </p>
        <p className="docs-paragraph">
          Em geral, os repasses podem levar de alguns dias a cerca de 30 dias após a confirmação do pagamento. Em casos de
          suspeita de fraude ou análise de risco, o Stripe pode reter valores por prazo superior, a critério exclusivo da
          empresa. O Bite Menu não pode antecipar, alterar ou garantir prazos de repasse.
        </p>
        <p className="docs-paragraph">
          Para acompanhar o status dos seus repasses em tempo real, acesse o painel do Stripe diretamente pelo botão{" "}
          <strong>"Gerenciar conta Stripe"</strong> disponível na aba de Pagamentos do seu dashboard. Em caso de dúvidas
          sobre repasses, o estabelecimento deve entrar em contato diretamente com o suporte do Stripe.
        </p>
      </section>

      {/* ── Métodos de pagamento ── */}
      <section className="mt-4 scroll-mt-[90px]" id="metodos-de-pagamento">
        <h2 className="docs-title">Métodos de pagamento</h2>
        <p className="docs-paragraph">Atualmente, o Bite Menu suporta os seguintes métodos de pagamento via Stripe:</p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>
            <strong>Cartão de crédito</strong> — disponível. Pode ser ativado imediatamente após a conexão da conta.
          </li>
        </ul>
        <p className="docs-paragraph">
          Novos métodos serão liberados gradualmente. Assim que estiverem disponíveis, você poderá ativá-los na aba de
          Pagamentos do seu dashboard sem nenhuma configuração adicional.
        </p>
        <p className="docs-paragraph">
          Se o cliente selecionar no seu cardápio um método de pagamento não ativado no Stripe, o fluxo do pedido continuará
          normalmente, mas o pagamento não será processado e o cliente final deverá acertar o valor diretamente com o
          estabelecimento.
        </p>
      </section>

      {/* ── Fluxo de compra ── */}
      <section className="mt-4 scroll-mt-[90px]" id="fluxo-de-compra">
        <h2 className="docs-title">Fluxo de compra</h2>
        <p className="docs-paragraph">
          Veja como funciona o processo de compra no cardápio do Bite Menu quando os pagamentos via Stripe estão ativados:
        </p>

        <p className="docs-paragraph font-semibold mt-4">1. Cliente escolhe a forma de pagamento</p>
        <p className="docs-paragraph">
          Ao finalizar o pedido, o cliente seleciona a forma de pagamento desejada entre as opções disponíveis no cardápio.
        </p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>
            Se a forma de pagamento escolhida <strong>não estiver vinculada ao Stripe</strong>, o pedido segue o fluxo normal
            do Bite Menu — o estabelecimento recebe o pedido e o pagamento é acertado diretamente com o cliente, sem
            envolvimento do Stripe.
          </li>
          <li>
            Se a forma de pagamento escolhida <strong>estiver vinculada ao Stripe</strong>, o cliente é redirecionado ao
            checkout do Stripe para concluir o pagamento online.
          </li>
        </ul>

        <p className="docs-paragraph font-semibold mt-4">2. Pedido chega ao estabelecimento</p>
        <p className="docs-paragraph">
          Quando o pagamento é via Stripe, o pedido aparece normalmente na aba de pedidos do estabelecimento, com a forma de
          pagamento identificada como <strong>"Stripe"</strong>. Nesse momento, o pedido pode estar com o status{" "}
          <strong>"Pendente"</strong> — isso significa que o Bite Menu ainda não recebeu a confirmação de pagamento do
          Stripe, pois o cliente pode ainda estar no processo de checkout.
        </p>

        <p className="docs-paragraph font-semibold mt-4">3. Confirmação do pagamento</p>
        <p className="docs-paragraph">
          Assim que o cliente conclui o checkout no Stripe e o pagamento é confirmado, o status do pedido é atualizado
          automaticamente para <strong>"Pago"</strong>. Nenhuma ação manual do estabelecimento é necessária para essa
          atualização.
        </p>
      </section>

      {/* ── Reembolsos e estornos ── */}
      <section className="mt-4 scroll-mt-[90px]" id="reembolsos">
        <h2 className="docs-title">Reembolsos e estornos</h2>
        <p className="docs-paragraph">
          O Bite Menu é a plataforma tecnológica que conecta o estabelecimento ao cliente final e viabiliza o processamento
          dos pagamentos via Stripe. Por operar nesse modelo, o Bite Menu tem visibilidade sobre as transações realizadas e
          cobra uma taxa de plataforma sobre cada uma delas — o que implica responsabilidades compartilhadas no ecossistema
          de pagamentos.
        </p>
        <p className="docs-paragraph">
          Dito isso, a <strong>decisão comercial de reembolsar ou não um pedido é exclusivamente do estabelecimento</strong>,
          que é quem tem a relação direta com o cliente final e conhece as circunstâncias de cada caso. O Bite Menu não
          interfere nessa decisão.
        </p>

        <p className="docs-paragraph font-semibold mt-4">Como processar um reembolso</p>
        <p className="docs-paragraph">
          O processo de emissão de reembolsos depende do tipo de conta Stripe e das permissões configuradas. Consulte a{" "}
          <a
            href="https://docs.stripe.com/refunds"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500 hover:text-blue-700"
          >
            documentação oficial do Stripe sobre reembolsos
          </a>{" "}
          para entender como proceder conforme o seu perfil de conta. Em caso de dúvidas, o suporte do Stripe é o canal
          adequado.
        </p>

        <p className="docs-paragraph font-semibold mt-4">Pontos de atenção sobre reembolsos</p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>
            Reembolsos estão sujeitos às políticas e prazos do Stripe. O valor pode levar alguns dias úteis para retornar ao
            cartão do cliente.
          </li>
          <li>
            A taxa de 2% cobrada pelo Bite Menu sobre a transação original <strong>não é devolvida</strong> em caso de
            reembolso, pois está vinculada ao processamento da transação e não ao recebimento efetivo do pedido.
          </li>
          <li>
            A taxa do Stripe sobre a transação original também pode não ser devolvida, conforme a política do Stripe vigente
            à época.
          </li>
          <li>
            Chargebacks (contestações iniciadas pelo cliente junto à operadora do cartão) são gerenciados diretamente pelo
            Stripe. O Bite Menu não oferece suporte em processos de chargeback, cabendo ao estabelecimento acompanhar e
            responder às disputas pelo painel do Stripe.
          </li>
        </ul>
      </section>

      {/* ── Gerenciar a conta Stripe ── */}
      <section className="mt-4 scroll-mt-[90px]" id="gerenciar-conta">
        <h2 className="docs-title">Gerenciar sua conta Stripe</h2>
        <p className="docs-paragraph">
          Depois de conectar sua conta, você pode acessar o painel completo do Stripe a qualquer momento diretamente pelo
          Bite Menu. Para isso:
        </p>
        <ol className="docs-paragraph list-decimal pl-6">
          <li>Acesse seu dashboard do Bite Menu</li>
          <li>
            Vá para a aba <strong>"Pagamentos Bite Menu"</strong>
          </li>
          <li>
            Clique em <strong>"Gerenciar conta Stripe"</strong>
          </li>
        </ol>
        <p className="docs-paragraph">
          No painel do Stripe você pode visualizar saldos disponíveis, histórico de transações, atualizar dados bancários e
          muito mais.
        </p>
      </section>

      {/* ── Responsabilidades ── */}
      <section className="mt-4 scroll-mt-[90px]" id="responsabilidades">
        <h2 className="docs-title">Responsabilidades</h2>
        <p className="docs-paragraph">
          Para que não haja dúvidas, abaixo estão as responsabilidades de cada parte envolvida:
        </p>

        <p className="docs-paragraph font-semibold mt-4">Bite Menu</p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Disponibilizar a integração técnica com o Stripe Connect Express</li>
          <li>Manter o cardápio digital funcionando para que os clientes possam realizar pedidos e pagamentos</li>
          <li>Cobrar a taxa de plataforma de 2% sobre cada transação processada</li>
          <li>
            Garantir a disponibilidade da plataforma, sem responsabilidade sobre falhas no processamento financeiro, que é
            gerenciado integralmente pelo Stripe
          </li>
        </ul>

        <p className="docs-paragraph font-semibold mt-4">Estabelecimento</p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Manter sua conta Stripe ativa, verificada e em conformidade com os termos do Stripe</li>
          <li>Gerir a relação comercial com os clientes, incluindo atendimento, cancelamentos e reembolsos</li>
          <li>Cumprir as obrigações fiscais sobre os valores recebidos, conforme a legislação aplicável</li>
          <li>
            Garantir que os produtos e serviços oferecidos no cardápio estejam em conformidade com a legislação vigente
          </li>
        </ul>

        <p className="docs-paragraph font-semibold mt-4">Stripe</p>
        <ul className="docs-paragraph list-disc pl-6">
          <li>Processar e liquidar os pagamentos conforme seus próprios termos de serviço</li>
          <li>Gerir prazos de repasse, análise de risco e segurança das transações</li>
          <li>Processar reembolsos e gerenciar chargebacks conforme suas políticas</li>
        </ul>

        <p className="docs-paragraph">
          O Bite Menu <strong>não se responsabiliza</strong> por falhas no processamento de pagamentos, atrasos em repasses,
          retenções de valores pelo Stripe, erros de transação ou quaisquer perdas financeiras decorrentes do uso da
          integração com o Stripe.
        </p>
      </section>

      {/* ── Segurança ── */}
      <section className="mt-4 scroll-mt-[90px]" id="seguranca">
        <h2 className="docs-title">Segurança</h2>
        <p className="docs-paragraph">
          Toda a infraestrutura de pagamentos é gerenciada pelo Stripe, líder global no processamento de transações
          financeiras. O Bite Menu <strong>não armazena</strong> nenhum dado de cartão, conta bancária ou informação
          financeira dos clientes finais ou dos estabelecimentos.
        </p>
        <p className="docs-paragraph">
          Em nosso banco de dados, guardamos apenas um identificador que confirma se a sua conta Stripe está conectada e
          ativa. Todo o restante é tratado diretamente pelo Stripe, que segue os padrões mais rígidos de segurança do setor
          (PCI DSS nível 1).
        </p>
      </section>

      {/* ── Perguntas frequentes ── */}
      <section className="mt-4 scroll-mt-[90px]" id="perguntas-frequentes">
        <h2 className="docs-title">Perguntas frequentes</h2>

        <p className="docs-paragraph font-semibold mt-4">Preciso de uma conta Stripe já existente para conectar?</p>
        <p className="docs-paragraph">
          Não. Durante o processo de onboarding, você pode criar uma conta Stripe nova diretamente pelo fluxo do Bite Menu.
          Se já tiver uma conta, ela pode ser conectada normalmente.
        </p>

        <p className="docs-paragraph font-semibold mt-4">O Bite Menu tem acesso ao meu dinheiro?</p>
        <p className="docs-paragraph">
          Não. O modelo Stripe Connect Express garante que os valores pagos pelos clientes vão diretamente para a sua conta
          Stripe. O Bite Menu recebe apenas a taxa de plataforma de 2%, descontada automaticamente sobre cada transação.
        </p>

        <p className="docs-paragraph font-semibold mt-4">
          Posso desativar o Stripe e continuar usando o cardápio normalmente?
        </p>
        <p className="docs-paragraph">
          Sim. O Stripe é uma funcionalidade opcional. Você pode desativá-lo a qualquer momento pelo toggle na aba de
          Pagamentos, e seu cardápio continuará funcionando normalmente com os demais métodos de pagamento configurados.
        </p>

        <p className="docs-paragraph font-semibold mt-4">O que acontece se eu desconectar minha conta Stripe?</p>
        <p className="docs-paragraph">
          Os pagamentos online via Stripe serão interrompidos imediatamente. Transações já realizadas e repasses em andamento
          não são afetados — eles continuam sendo processados pelo Stripe conforme o cronograma normal. Para reativar, basta
          conectar uma conta novamente na aba de Pagamentos.
        </p>

        <p className="docs-paragraph font-semibold mt-4">
          Tenho um problema com o processamento de um pagamento. Quem devo contatar?
        </p>
        <p className="docs-paragraph">
          Para problemas relacionados ao processamento de pagamentos, repasses, bloqueios de conta ou transações específicas,
          o contato deve ser feito diretamente com o{" "}
          <a
            href="https://support.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500 hover:text-blue-700"
          >
            suporte do Stripe
          </a>
          , pois o Bite Menu não tem acesso ou capacidade de intervenção nesses processos. Para dúvidas sobre a integração
          com o Bite Menu, entre em contato com nosso suporte.
        </p>
      </section>
    </div>
  );
};

export default page;
