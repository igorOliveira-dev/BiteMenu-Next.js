import Return from "@/components/Return";
import Link from "next/link";
import React from "react";

const page = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="fixed bg-translucid rounded-lg backdrop-blur-2xl top-2 left-2 ">
        <Return />
      </div>
      <div className="max-w-2xl flex flex-col gap-6 p-4 pt-12">
        <h1 className="default-h1">Política de Privacidade – Bite Menu</h1>

        <p>Última atualização: 21/04/2026</p>
        <p>
          O <strong>Bite Menu</strong> valoriza sua privacidade e está comprometido com a proteção dos seus dados pessoais.
          Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos suas informações ao
          utilizar nossos serviços, em conformidade com a{" "}
          <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD)</strong>. Esta política também se
          aplica aos usuários que realizam pagamentos de planos no Bite Menu, cujas informações são processadas de forma
          segura através do <strong>Stripe</strong>.
        </p>

        {/* 1. Informações Gerais */}
        <section className="flex flex-col gap-2 mb-4">
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
          <p>
            O Bite Menu atua como <strong>controlador</strong> dos dados dos criadores de cardápio e como{" "}
            <strong>operador</strong> dos dados dos consumidores finais coletados em nome dos estabelecimentos (criadores de
            cardápio), que são os controladores desses dados.
          </p>
        </section>

        {/* 2. Encarregado de Dados (DPO) */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">2. Encarregado de Dados (DPO)</h2>
          <p>
            Em conformidade com o art. 41 da LGPD, o Bite Menu designa um Encarregado pelo Tratamento de Dados Pessoais (Data
            Protection Officer – DPO), responsável por receber comunicações dos titulares e da Autoridade Nacional de
            Proteção de Dados (ANPD).
          </p>
          <p>
            Para exercer seus direitos ou tirar dúvidas sobre o tratamento de dados, entre em contato diretamente com nosso
            encarregado pelo e-mail: <strong>contato@bitemenu.com.br</strong>
          </p>
        </section>

        {/* 3. Criadores de Cardápio */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">3. Criadores de Cardápio</h2>
          <p>
            Ao criar uma conta no Bite Menu, coletamos informações necessárias para operação e personalização do serviço:
          </p>
          <ul className="list-disc ml-6">
            <li>Nome e e-mail;</li>
            <li>Senha (armazenada criptografada via Supabase Auth);</li>
            <li>Arquivos enviados, como logotipo e banner;</li>
            <li>Dados relacionados aos cardápios criados;</li>
            <li>Telefone de contato;</li>
            <li>Informações relacionadas à assinatura e ao pagamento (processadas via Stripe).</li>
          </ul>
          <p>Essas informações são usadas para:</p>
          <ul className="list-disc ml-6">
            <li>Gerenciar a sua conta;</li>
            <li>Permitir a criação, edição e exibição de cardápios;</li>
            <li>Permitir que seus clientes te enviem os pedidos;</li>
            <li>Enviar comunicações sobre seu uso do Bite Menu;</li>
            <li>Cumprir obrigações legais e contratuais;</li>
            <li>Enviar convites, atualizações e informações relacionadas ao Bite Menu.</li>
          </ul>

          <p>
            <strong>Bases legais:</strong> O tratamento dos dados dos criadores de cardápio fundamenta-se nas seguintes
            hipóteses previstas na LGPD:
          </p>
          <ul className="list-disc ml-6">
            <li>
              <strong>Execução de contrato</strong> (art. 7º, V): para criação e gerenciamento de conta, exibição de
              cardápios e processamento de pedidos;
            </li>
            <li>
              <strong>Cumprimento de obrigação legal</strong> (art. 7º, II): para emissão de notas fiscais e obrigações
              contábeis;
            </li>
            <li>
              <strong>Consentimento</strong> (art. 7º, I): para envio de comunicações de marketing, novidades e atualizações,
              quando autorizado.
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

        {/* 4. Consumidores e Visitantes */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">4. Consumidores e Visitantes</h2>
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
            <strong>Dados pessoais de pedidos:</strong> Também podemos coletar dados pessoais como nome, número de telefone e
            endereço, quando fornecidos voluntariamente ao realizar pedidos ou interagir com cardápios. Esses dados são
            armazenados com segurança no nosso banco de dados e compartilhados apenas com os proprietários dos
            estabelecimentos envolvidos, para permitir o atendimento e a entrega.
          </p>
          <p>
            <strong>Base legal:</strong> O tratamento desses dados fundamenta-se na execução de contrato (art. 7º, V da LGPD)
            e no legítimo interesse do controlador (estabelecimento) para fins de atendimento ao pedido (art. 7º, IX da
            LGPD).
          </p>
          <p>Nenhum dado pessoal identificável é compartilhado ou vendido a terceiros sem seu consentimento.</p>
        </section>

        {/* 5. Consentimento para Comunicações */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">5. Consentimento para Comunicações</h2>
          <p>
            Ao fornecer seu telefone ou e-mail e aceitar receber comunicações, você concorda em receber mensagens
            relacionadas ao Bite Menu, incluindo convites para testes, novidades, atualizações e informações relevantes sobre
            o serviço.
          </p>
          <p>
            Esse consentimento pode ser revogado a qualquer momento entrando em contato com nosso suporte ou pelo e-mail{" "}
            <strong>contato@bitemenu.com.br</strong>.
          </p>
        </section>

        {/* 6. Cookies e Rastreamento */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">6. Cookies e Rastreamento</h2>
          <p>
            O Bite Menu utiliza cookies e tecnologias semelhantes para melhorar sua experiência, analisar tráfego e proteger
            contra fraudes. Veja os tipos utilizados:
          </p>
          <ul className="list-disc ml-6">
            <li>
              <strong>Cookies essenciais:</strong> necessários para o funcionamento básico da plataforma (autenticação,
              sessão de usuário). Não podem ser desativados.
            </li>
            <li>
              <strong>Cookies analíticos:</strong> utilizados para mensurar visitas e comportamento de uso (ex: ferramentas
              de analytics). Coletam dados de forma agregada e não identificam diretamente o usuário.
            </li>
            <li>
              <strong>Cookies de segurança:</strong> utilizados para prevenção de fraudes e proteção da plataforma.
            </li>
          </ul>
          <p>
            Você pode configurar seu navegador para recusar cookies não essenciais. No entanto, isso pode afetar algumas
            funcionalidades da plataforma.
          </p>
        </section>

        {/* 7. Transferência Internacional de Dados */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">7. Transferência Internacional de Dados</h2>
          <p>
            O Bite Menu utiliza serviços de terceiros que podem armazenar dados em servidores localizados fora do Brasil,
            incluindo:
          </p>
          <ul className="list-disc ml-6">
            <li>
              <strong>Supabase</strong> (infraestrutura de banco de dados e autenticação) – servidores nos Estados Unidos;
            </li>
            <li>
              <strong>Stripe</strong> (processamento de pagamentos) – servidores nos Estados Unidos.
            </li>
          </ul>
          <p>
            Essas transferências são realizadas em conformidade com o art. 33 da LGPD, com base em garantias contratuais
            adequadas (cláusulas de proteção de dados) e nas políticas de privacidade desses fornecedores, que seguem padrões
            internacionais equivalentes ou superiores à LGPD. Para mais informações, consulte:{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500 hover:text-blue-700"
            >
              Política de Privacidade do Supabase
            </a>{" "}
            e{" "}
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

        {/* 8. Direitos dos Usuários */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">8. Direitos dos Usuários</h2>
          <p>De acordo com a LGPD, todos os titulares de dados possuem direitos, incluindo:</p>
          <ul className="list-disc ml-6">
            <li>Confirmação da existência de tratamento;</li>
            <li>Acesso aos dados;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
            <li>Portabilidade dos dados a outro fornecedor de serviço ou produto;</li>
            <li>Eliminação dos dados pessoais tratados com o consentimento do titular;</li>
            <li>Informação sobre entidades públicas e privadas com as quais o controlador realizou uso compartilhado;</li>
            <li>Informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa;</li>
            <li>Revogação do consentimento.</li>
          </ul>
          <p>
            Para exercer qualquer um desses direitos, envie sua solicitação para <strong>contato@bitemenu.com.br</strong>.
            Responderemos em até 15 dias úteis.
          </p>
        </section>

        {/* 9. Retenção e Segurança */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">9. Retenção e Segurança</h2>
          <p>Os dados pessoais são retidos pelos seguintes prazos:</p>
          <ul className="list-disc ml-6">
            <li>
              <strong>Dados de conta (criadores de cardápio):</strong> enquanto a conta estiver ativa e por até 12 meses após
              o encerramento, salvo obrigação legal em contrário;
            </li>
            <li>
              <strong>Dados de pedidos (consumidores finais):</strong> pelo prazo necessário para atendimento do pedido e
              resolução de eventuais disputas, ou conforme determinado pelo estabelecimento controlador;
            </li>
            <li>
              <strong>Dados financeiros e fiscais:</strong> pelo prazo mínimo de 5 anos, conforme exigido pela legislação
              tributária brasileira;
            </li>
            <li>
              <strong>Logs e dados técnicos:</strong> por até 6 meses, para fins de segurança e prevenção a fraudes.
            </li>
          </ul>
          <p>
            Utilizamos medidas técnicas e administrativas adequadas para proteger suas informações, incluindo criptografia em
            trânsito (TLS) e em repouso, controle de acesso restrito e monitoramento de segurança contínuo.
          </p>
        </section>

        {/* 10. Pagamentos e Dados Financeiros */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">10. Pagamentos e Dados Financeiros</h2>
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
          <p>
            Ao contratar um plano pago, o valor informado será cobrado uma vez por mês até o cancelamento ou falha no
            pagamento.
          </p>
          <p>
            O Bite Menu pode oferecer um período de teste gratuito para determinados planos (por exemplo, 7 dias no plano
            Pro). Durante esse período, não haverá cobrança. Após o término do período de teste, a assinatura será
            automaticamente convertida em paga e o valor do plano será cobrado mensalmente, salvo cancelamento antes do fim
            do período de teste.
          </p>
          <p>
            É de responsabilidade do usuário cancelar a assinatura antes do término do período de teste gratuito caso não
            deseje continuar com o plano pago.
          </p>
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
            <li>Atualizar seu status de plano ("free", "plus" ou "pro") na plataforma;</li>
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

        {/* 11. Responsabilidades dos Estabelecimentos (DPA) */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">11. Responsabilidades dos Estabelecimentos</h2>
          <p>
            Os estabelecimentos (criadores de cardápio) que utilizam o Bite Menu para coletar dados dos seus consumidores
            finais atuam como <strong>controladores</strong> desses dados, sendo o Bite Menu o operador. Ao utilizar a
            plataforma, os estabelecimentos reconhecem e assumem as seguintes responsabilidades:
          </p>
          <ul className="list-disc ml-6">
            <li>
              Garantir que a coleta e o tratamento dos dados dos consumidores finais estejam em conformidade com a LGPD e
              demais normas aplicáveis;
            </li>
            <li>Informar adequadamente seus consumidores sobre a coleta e uso de dados pessoais por meio do Bite Menu;</li>
            <li>
              Não utilizar os dados dos consumidores finais para finalidades incompatíveis com o atendimento de pedidos e a
              prestação do serviço;
            </li>
            <li>Garantir a segurança no acesso e uso das informações disponíveis na plataforma.</li>
          </ul>
          <p>
            O Bite Menu trata os dados dos consumidores finais exclusivamente conforme as instruções dos estabelecimentos e
            para as finalidades descritas nesta política.
          </p>
        </section>

        {/* 12. Alterações nesta Política */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">12. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Em caso de alterações relevantes, notificaremos os usuários
            cadastrados por e-mail com antecedência mínima de 15 dias antes da entrada em vigor das mudanças. A versão mais
            recente estará sempre disponível em{" "}
            <Link
              href="https://www.bitemenu.com.br/politica-de-privacidade"
              className="underline text-blue-500 hover:text-blue-700"
            >
              https://bitemenu.com.br/politica-de-privacidade
            </Link>
            .
          </p>
        </section>

        {/* 13. Contato */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">13. Contato</h2>
          <p>
            Em caso de dúvidas ou solicitações sobre esta Política, entre em contato com nosso Encarregado de Dados pelo
            e-mail <strong>contato@bitemenu.com.br</strong>.
          </p>
        </section>

        {/* 14. Aceite */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">14. Aceite</h2>
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
