import ReturnLandingPage from "@/components/ReturnLandingPage";
import Link from "next/link";
import React from "react";

const page = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="max-w-2xl flex flex-col gap-6 p-4">
        <div>
          <div className="flex items-center gap-4">
            <ReturnLandingPage />
            <h1 className="default-h1">Política de Privacidade – Bite Menu</h1>
          </div>
        </div>

        <p>Última atualização: 29/10/2025</p>
        <p>
          O <strong>Bite Menu</strong> valoriza sua privacidade e está comprometido com a proteção dos seus dados pessoais.
          Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos suas informações ao
          utilizar nossos serviços, em conformidade com a{" "}
          <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD)</strong>. Esta política também se
          aplica aos usuários que realizam pagamentos de planos no Bite Menu, cujas informações são processadas de forma
          segura através do <strong>Stripe</strong>.
        </p>

        <section>
          <h2 className="default-h2">1. Informações Gerais</h2>
          <p>Esta política aplica-se a todos os usuários do Bite Menu, incluindo:</p>
          <ul className="list-disc ml-6">
            <li>
              <strong>Criadores de cardápio:</strong> usuários cadastrados que criam e gerenciam cardápios digitais.
            </li>
            <li>
              <strong>Consumidores e visitantes:</strong> pessoas que acessam os cardápios sem cadastro.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="default-h2">2. Criadores de Cardápio</h2>
          <p>
            Ao criar uma conta no Bite Menu, coletamos informações necessárias para operação e personalização do serviço:
          </p>
          <ul className="list-disc ml-6">
            <li>Nome e e-mail;</li>
            <li>Senha (armazenada criptografada via Supabase Auth);</li>
            <li>Arquivos enviados, como logotipo e banner;</li>
            <li>Dados relacionados aos cardápios criados;</li>
            <li>Telefone de contato;</li>
            <li>Informações relacionadas à assinatura e ao pagamento (processadas via Stripe);</li>
          </ul>
          <p>Essas informações são usadas para:</p>
          <ul className="list-disc ml-6">
            <li>Gerenciar a sua conta;</li>
            <li>Permitir a criação, edição e exibição de cardápios;</li>
            <li>Permitir que seus clientes te enviem os pedidos;</li>
            <li>Enviar comunicações sobre seu uso do Bite Menu;</li>
            <li>Cumprir obrigações legais e contratuais;</li>
            <li>
              Enviar convites, atualizações e informações relacionadas ao Bite Menu, caso você tenha autorizado receber essas
              comunicações.
            </li>
          </ul>
          <p>
            Seus dados são armazenados em servidores seguros e criptografados. Não compartilhamos suas informações pessoais
            com terceiros, exceto fornecedores de infraestrutura necessários para o funcionamento da plataforma (por exemplo,
            Supabase e Stripe).
          </p>
          <p>
            Os dados de pagamento não são armazenados diretamente pelo Bite Menu, mas sim pelo Stripe, que atua como operador
            de pagamento em conformidade com as normas PCI-DSS.
          </p>
        </section>

        <section>
          <h2 className="default-h2">3. Consumidores e Visitantes</h2>
          <p>
            Quando alguém acessa um cardápio criado no Bite Menu sem cadastro, podemos coletar dados técnicos para garantir
            funcionamento seguro e análise de uso:
          </p>
          <ul className="list-disc ml-6">
            <li>Endereço IP;</li>
            <li>Tipo de navegador;</li>
            <li>Data e hora de acesso;</li>
            <li>Páginas acessadas.</li>
          </ul>
          <p>Esses dados são utilizados para:</p>
          <ul className="list-disc ml-6">
            <li>Garantir segurança e estabilidade do serviço;</li>
            <li>Mensurar visitas e comportamento para melhoria da plataforma;</li>
            <li>Prevenir uso indevido.</li>
          </ul>
          <p>
            <strong>Dados pessoais:</strong> Também podemos coletar dados pessoais como nome, número de telefone e endereço,
            quando fornecidos voluntariamente ao realizar pedidos ou interagir com cardápios. Esses dados são armazenados com
            segurança no nosso banco de dados e compartilhados apenas com os proprietários dos estabelecimentos envolvidos,
            para permitir o atendimento e a entrega.
          </p>
          <p>Nenhum dado pessoal identificável é compartilhado ou vendido a terceiros sem seu consentimento.</p>
        </section>

        <section>
          <h2 className="default-h2">4. Consentimento para Comunicações</h2>
          <p>
            Ao fornecer seu telefone ou e-mail e aceitar receber comunicações, você concorda em receber mensagens
            relacionadas ao Bite Menu, incluindo convites para testes, novidades, atualizações e informações relevantes sobre
            o serviço.
          </p>
          <p>Esse consentimento pode ser revogado a qualquer momento entrando em contato com nosso suporte.</p>
        </section>

        <section>
          <h2 className="default-h2">5. Cookies e Rastreamento</h2>
          <p>
            Podemos utilizar cookies e tecnologias semelhantes para melhorar sua experiência no site, analisar tráfego e
            proteger contra fraudes. Essas informações não identificam diretamente o usuário.
          </p>
        </section>

        <section>
          <h2 className="default-h2">6. Direitos dos Usuários</h2>
          <p>De acordo com a LGPD, todos os titulares de dados possuem direitos, incluindo:</p>
          <ul className="list-disc ml-6">
            <li>Confirmação da existência de tratamento;</li>
            <li>Acesso aos dados;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Solicitação de exclusão;</li>
            <li>Revogação do consentimento;</li>
            <li>Portabilidade dos dados.</li>
          </ul>
          <p>
            Para exercer qualquer um desses direitos, envie sua solicitação para o suporte{" "}
            <Link href="/support" className="underline text-blue-500 hover:text-blue-700">
              clicando aqui
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="default-h2">7. Retenção e Segurança</h2>
          <p>
            Seus dados serão armazenados apenas pelo tempo necessário para cumprir as finalidades desta política, salvo
            obrigação legal em contrário. Utilizamos medidas técnicas e administrativas adequadas para proteger suas
            informações.
          </p>
        </section>

        <section>
          <h2 className="default-h2">8. Pagamentos e Dados Financeiros</h2>
          <p>
            O Bite Menu utiliza o serviço <strong>Stripe</strong> para processar pagamentos dos planos <strong>Plus</strong>{" "}
            e <strong>Pro</strong>. O Stripe é responsável por garantir a segurança das transações financeiras e o
            cumprimento das normas de proteção de dados aplicáveis.
          </p>
          <p>
            Ao contratar um plano pago, você será redirecionado para uma página segura do Stripe, onde poderá inserir seus
            dados de pagamento. O Bite Menu <strong>não armazena nem tem acesso</strong> a informações sensíveis como número
            de cartão, código de segurança (CVV) ou data de validade.
          </p>
          <p>Ao contratar um plano pago, o valor informado será cobrado uma vez por mês até o cancelamento.</p>
          <p>As informações que podemos receber do Stripe incluem:</p>
          <ul className="list-disc ml-6">
            <li>Identificador da transação;</li>
            <li>Status do pagamento (ex: ativo, cancelado, pendente);</li>
            <li>Plano contratado e período de validade;</li>
            <li>Data de início e término da assinatura.</li>
          </ul>
          <p>Esses dados são usados exclusivamente para:</p>
          <ul className="list-disc ml-6">
            <li>Gerenciar e validar a sua assinatura no Bite Menu;</li>
            <li>Atualizar seu status de plano (“free”, “plus” ou “pro”) na plataforma;</li>
            <li>Emitir recibos e notas fiscais, quando aplicável;</li>
            <li>Cumprir obrigações legais e contábeis.</li>
          </ul>
          <p>
            O processamento dos pagamentos está sujeito à{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500 hover:text-blue-700"
            >
              Política de Privacidade do Stripe
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="default-h2">9. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta política periodicamente. A versão mais recente estará disponível em{" "}
            <Link
              href="https://www.bitemenu.com.br/politica-de-privacidade"
              className="underline text-blue-500 hover:text-blue-700"
            >
              https://bitemenu.com.br/politica-de-privacidade
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="default-h2">10. Contato</h2>
          <p>
            Em caso de dúvidas ou solicitações sobre esta Política, entre em contato{" "}
            <Link href="/support" className="underline text-blue-500 hover:text-blue-700">
              clicando aqui
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="default-h2">11. Aceite</h2>
          <p>
            Ao utilizar o Bite Menu, você concorda com esta Política de Privacidade e com o tratamento dos seus dados
            pessoais conforme aqui descrito.
          </p>

          <p className="text-sm color-gray mt-4">
            O Bite Menu cumpre a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD) e segue boas práticas
            internacionais de segurança da informação. Todas as transações financeiras são processadas com criptografia e
            certificação PCI-DSS por meio do Stripe.
          </p>
        </section>
      </div>
    </div>
  );
};

export default page;
