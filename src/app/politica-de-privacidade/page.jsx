import Return from "@/components/Return";
import Link from "next/link";
import React from "react";

const page = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="fixed bg-translucid rounded-lg backdrop-blur-2xl top-2 left-2">
        <Return />
      </div>
      <div className="max-w-2xl flex flex-col gap-6 p-4 pt-12">
        <h1 className="default-h1">Política de Privacidade – Bite Menu</h1>

        <p>Última atualização: 04/10/2026</p>

        <p>
          O <strong>Bite Menu</strong> valoriza sua privacidade e está comprometido com a proteção dos seus dados pessoais.
          Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos suas informações ao
          utilizar nossos serviços, em conformidade com a{" "}
          <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 – LGPD)</strong>.
        </p>

        {/* 1. Informações Gerais */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">1. Informações Gerais</h2>
          <p>Esta política aplica-se a todos os usuários do Bite Menu, incluindo:</p>
          <ul className="list-disc ml-6">
            <li>
              <strong>Criadores de cardápio (estabelecimentos):</strong> usuários cadastrados que criam e gerenciam cardápios
              digitais na plataforma.
            </li>
            <li>
              <strong>Consumidores e visitantes:</strong> pessoas que acessam os cardápios, com ou sem cadastro, incluindo os
              que realizam pedidos.
            </li>
          </ul>
          <p>O Bite Menu desempenha papéis distintos conforme o tipo de dado e o fluxo de tratamento:</p>
          <ul className="list-disc ml-6">
            <li>
              <strong>Controlador</strong> dos dados dos estabelecimentos: define as finalidades e os meios de tratamento dos
              dados fornecidos pelos criadores de cardápio para prestação dos serviços da plataforma e gestão das
              assinaturas.
            </li>
            <li>
              <strong>Operador</strong> dos dados dos consumidores finais: trata os dados dos clientes dos estabelecimentos
              exclusivamente conforme as instruções dos próprios estabelecimentos, que são os controladores responsáveis por
              esses dados.
            </li>
          </ul>
        </section>

        {/* 2. Dados Pessoais */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">2. Dados Pessoais</h2>
          <p>
            O Bite Menu disponibiliza o canal contato@bitemenu.com.br para assuntos relacionados ao tratamento de dados
            pessoais
          </p>
        </section>

        {/* 3. Criadores de Cardápio (Estabelecimentos) */}
        <section id="coleta-de-dados" className="flex flex-col gap-2 mb-4 scroll-mt-4">
          <h2 className="default-h2">3. Criadores de Cardápio (Estabelecimentos)</h2>
          <p>
            Ao criar uma conta no Bite Menu, coletamos as informações necessárias para operação, personalização e faturamento
            dos serviços:
          </p>
          <ul className="list-disc ml-6">
            <li>Nome e e-mail;</li>
            <li>Senha (armazenada de forma criptografada via Supabase Auth);</li>
            <li>Arquivos enviados, como logotipo e banner do cardápio;</li>
            <li>Dados dos cardápios criados (produtos, categorias, preços e configurações);</li>
            <li>Telefone de contato;</li>
            <li>Dados relacionados à assinatura dos planos Bite Menu (processados via ValidaPay);</li>
          </ul>

          <p>As informações coletadas pelo Bite Menu são utilizadas para:</p>
          <ul className="list-disc ml-6">
            <li>Criar e gerenciar a conta do estabelecimento na plataforma;</li>
            <li>Permitir a criação, edição e exibição de cardápios digitais;</li>
            <li>Processar pedidos e facilitar a comunicação entre o estabelecimento e seus clientes;</li>
            <li>Gerenciar a assinatura e o faturamento dos planos;</li>
            <li>Enviar comunicações operacionais e, quando autorizado, novidades e atualizações sobre o serviço;</li>
            <li>Cumprir obrigações legais, fiscais e contratuais.</li>
          </ul>

          <p>
            <strong>Bases legais:</strong> O tratamento dos dados dos estabelecimentos fundamenta-se nas seguintes hipóteses
            previstas no art. 7º da LGPD:
          </p>
          <ul className="list-disc ml-6">
            <li>
              <strong>Execução de contrato</strong> (inciso V): para criação e gestão de conta, exibição de cardápios,
              processamento de pedidos e cobrança da assinatura;
            </li>
            <li>
              <strong>Cumprimento de obrigação legal ou regulatória</strong> (inciso II): para emissão de notas fiscais e
              atendimento de obrigações contábeis e tributárias;
            </li>
            <li>
              <strong>Consentimento</strong> (inciso I): para envio de comunicações de marketing, novidades e atualizações,
              quando expressamente autorizado pelo estabelecimento.
            </li>
          </ul>

          <p>
            Os dados são armazenados em servidores seguros e criptografados. O Bite Menu compartilha informações dos
            estabelecimentos apenas com fornecedores de infraestrutura necessários ao funcionamento da plataforma
            (Supabase), com a ValidaPay para fins de processamento de assinaturas e, quando legalmente exigido, com
            autoridades competentes.
          </p>
          <p>
            Os dados de pagamento da assinatura não são armazenados pelo Bite Menu, mas pela ValidaPay, que atua
            como processadora de pagamentos.
          </p>
        </section>

        {/* 4. Consumidores e Visitantes dos Cardápios */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">4. Consumidores e Visitantes dos Cardápios</h2>
          <p>
            Ao acessar um cardápio criado no Bite Menu, podemos coletar dados técnicos para garantir o funcionamento seguro
            da plataforma e a análise de uso:
          </p>
          <ul className="list-disc ml-6">
            <li>Endereço IP;</li>
            <li>Tipo de navegador e dispositivo;</li>
            <li>Data e hora de acesso;</li>
            <li>Páginas e itens acessados.</li>
          </ul>
          <p>Esses dados técnicos são utilizados para:</p>
          <ul className="list-disc ml-6">
            <li>Garantir a segurança e a estabilidade do serviço;</li>
            <li>Mensurar visitas e comportamento de uso para melhoria da plataforma;</li>
            <li>Prevenir uso indevido e fraudes.</li>
          </ul>
          <p>
            <strong>Dados pessoais de pedidos:</strong> Ao realizar um pedido, o consumidor pode fornecer voluntariamente
            informações como nome, número de telefone e endereço de entrega. Esses dados são armazenados no banco de dados do
            Bite Menu e compartilhados exclusivamente com o respectivo estabelecimento para fins de atendimento do pedido e
            entrega.
          </p>
          <p>
            <strong>Papéis no tratamento:</strong> Em relação aos dados dos consumidores finais, o Bite Menu atua como{" "}
            <strong>operador</strong>, tratando os dados exclusivamente conforme as instruções dos{" "}
            <strong>estabelecimentos</strong>, que são os controladores responsáveis. A relação contratual que justifica o
            tratamento desses dados é firmada entre o consumidor e o estabelecimento ao realizar o pedido.
          </p>
          <p>
            <strong>Bases legais:</strong> O tratamento desses dados fundamenta-se na execução de contrato ou de
            procedimentos preliminares a pedido do titular (art. 7º, V da LGPD) e no legítimo interesse do controlador
            (estabelecimento) para atendimento do pedido e prevenção de fraudes (art. 7º, IX da LGPD).
          </p>
          <p>
            Nenhum dado pessoal identificável dos consumidores é compartilhado com terceiros além do estabelecimento
            responsável pelo pedido, sem o consentimento do titular.
          </p>
        </section>

        {/* 5. Consentimento para Comunicações */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">5. Consentimento para Comunicações</h2>
          <p>
            Ao fornecer seu telefone ou e-mail e aceitar receber comunicações durante o cadastro, o estabelecimento concorda
            em receber mensagens relacionadas ao Bite Menu, incluindo convites para testes de novas funcionalidades,
            novidades, atualizações e informações relevantes sobre o serviço.
          </p>
          <p>
            Esse consentimento pode ser revogado a qualquer momento pelo e-mail <strong>contato@bitemenu.com.br</strong>. A
            revogação não afeta a licitude do tratamento realizado anteriormente com base no consentimento.
          </p>
        </section>

        {/* 6. Cookies e Rastreamento */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">6. Cookies e Rastreamento</h2>
          <p>
            O Bite Menu utiliza cookies e tecnologias semelhantes para melhorar a experiência do usuário, analisar tráfego e
            proteger a plataforma. Os tipos utilizados incluem:
          </p>
          <ul className="list-disc ml-6">
            <li>
              <strong>Cookies essenciais:</strong> necessários para o funcionamento básico da plataforma (autenticação e
              gerenciamento de sessão). Não podem ser desativados.
            </li>
            <li>
              <strong>Cookies analíticos:</strong> utilizados para mensurar visitas e comportamento de uso. Coletam dados de
              forma agregada e não identificam diretamente o usuário.
            </li>
            <li>
              <strong>Cookies de segurança:</strong> utilizados para prevenção de fraudes e proteção da plataforma.
            </li>
          </ul>
          <p>
            Você pode configurar seu navegador para recusar cookies não essenciais. No entanto, isso pode afetar algumas
            funcionalidades da plataforma.
          </p>
          <p>
            Google Analytics: O Bite Menu utiliza o Google Analytics, serviço fornecido pela Google LLC, para compreender
            como os usuários utilizam a plataforma, medir audiência, identificar páginas mais acessadas e melhorar
            continuamente nossos serviços. O Google Analytics coleta informações como endereço IP (que pode ser anonimizado),
            tipo de navegador, dispositivo utilizado, páginas visitadas, tempo de permanência e eventos de navegação,
            utilizando cookies e tecnologias semelhantes.
          </p>
          <p>
            Google Tag Manager: O Bite Menu utiliza o Google Tag Manager (GTM), ferramenta que facilita o gerenciamento e a
            implementação de scripts e etiquetas utilizados na plataforma, incluindo o Google Analytics. O Google Tag
            Manager, por si só, não coleta dados pessoais diretamente, mas pode carregar ferramentas que realizam esse
            tratamento conforme descrito nesta Política.
          </p>
        </section>

        {/* 7. Transferência Internacional de Dados */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">7. Transferência Internacional de Dados</h2>
          <p>
            O Bite Menu utiliza serviços de terceiros que armazenam e tratam dados em servidores localizados fora do Brasil:
          </p>
          <ul className="list-disc ml-6">
            <li>Google LLC (Google Analytics e Google Tag Manager) – serviços de análise de uso da plataforma.</li>
            <li>
              <strong>Supabase</strong> (banco de dados e autenticação) – servidores nos Estados Unidos;
            </li>
          </ul>
          <p>
            Essas transferências são realizadas em conformidade com o art. 33 da LGPD, com base em garantias contratuais
            adequadas, incluindo cláusulas-padrão de proteção de dados. Esses fornecedores adotam padrões de segurança
            equivalentes ou superiores aos exigidos pela legislação brasileira. Para mais informações, consulte a{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500 hover:text-blue-700"
            >
              Política de Privacidade do Supabase
            </a>
            .
          </p>
        </section>

        {/* 8. Direitos dos Titulares de Dados */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">8. Direitos dos Titulares de Dados</h2>
          <p>
            De acordo com o art. 18 da LGPD, todos os titulares de dados possuem os seguintes direitos em relação ao
            tratamento realizado pelo Bite Menu:
          </p>
          <ul className="list-disc ml-6">
            <li>Confirmação da existência de tratamento;</li>
            <li>Acesso aos dados;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a LGPD;</li>
            <li>Portabilidade dos dados a outro fornecedor de serviço ou produto;</li>
            <li>Eliminação dos dados pessoais tratados com base no consentimento do titular;</li>
            <li>
              Informação sobre entidades públicas e privadas com as quais o Bite Menu realizou compartilhamento de dados;
            </li>
            <li>Informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da recusa;</li>
            <li>Revogação do consentimento.</li>
          </ul>
          <p>
            Para exercer qualquer um desses direitos sobre dados tratados pelo Bite Menu, envie sua solicitação para{" "}
            <strong>contato@bitemenu.com.br</strong>. Responderemos dentro do prazo legal estabelecido pela LGPD.
          </p>
          <p>
            <strong>Dados dos consumidores finais (pedidos):</strong> Como o Bite Menu atua como operador em relação aos
            dados dos consumidores, as solicitações de direitos devem ser endereçadas primariamente ao estabelecimento
            controlador. O Bite Menu dará suporte às solicitações encaminhadas pelo estabelecimento.
          </p>
        </section>

        {/* 9. Retenção e Segurança de Dados */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">9. Retenção e Segurança de Dados</h2>
          <p>Os dados pessoais tratados pelo Bite Menu são retidos pelos seguintes prazos:</p>
          <ul className="list-disc ml-6">
            <li>
              <strong>Dados de conta dos estabelecimentos:</strong> enquanto a conta estiver ativa e por até 12 (doze) meses
              após o encerramento, salvo obrigação legal em contrário;
            </li>
            <li>
              <strong>Dados de pedidos dos consumidores finais:</strong> pelo prazo necessário para atendimento do pedido e
              resolução de eventuais disputas, ou conforme determinado pelo estabelecimento controlador;
            </li>
            <li>
              <strong>Dados financeiros e fiscais (assinaturas e transações):</strong> pelo prazo mínimo de 5 (cinco) anos,
              conforme exigido pela legislação tributária e contábil brasileira;
            </li>
          </ul>
          <p>
            Utilizamos medidas técnicas e administrativas adequadas para proteger as informações armazenadas pelo Bite Menu,
            incluindo controle de acesso restrito e monitoramento de segurança contínuo.
          </p>
        </section>

        {/* 10. Pagamentos de Assinatura (Planos Bite Menu) */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">10. Pagamentos de Assinatura (Planos Bite Menu)</h2>
          <p>
            Para a contratação dos planos pagos <strong>Plus</strong> e <strong>Pro</strong>, o Bite Menu utiliza a{" "}
            <strong>ValidaPay</strong> como processadora de pagamentos. Nesse contexto, o Bite Menu é o{" "}
            <strong>controlador</strong> e a ValidaPay atua como <strong>operadora</strong> (subprocessadora) para as
            finalidades de cobrança e gestão das assinaturas.
          </p>
          <p>
            Ao contratar um plano pago, o estabelecimento é redirecionado a uma página segura da ValidaPay, onde informa
            seu CPF ou CNPJ e escolhe pagar por PIX, boleto ou cartão de crédito. O Bite Menu envia à ValidaPay apenas o
            nome e o e-mail da conta para pré-preencher o pagamento, e <strong>não armazena nem tem acesso</strong> a
            informações sensíveis como número de cartão ou código de segurança (CVV).
          </p>
          <p>As informações que o Bite Menu recebe da ValidaPay sobre as assinaturas incluem:</p>
          <ul className="list-disc ml-6">
            <li>Identificador da assinatura;</li>
            <li>Status da assinatura (ativa, cancelada, cancelamento agendado, expirada);</li>
            <li>Plano contratado e período de vigência;</li>
            <li>
              E-mail e CPF/CNPJ informados no pagamento, usados apenas para vincular a assinatura à conta e cumprir
              obrigações legais e fiscais.
            </li>
          </ul>
          <p>Esses dados são usados exclusivamente para:</p>
          <ul className="list-disc ml-6">
            <li>Ativar e validar o plano contratado na plataforma;</li>
            <li>Atualizar o status do plano ("free", "plus" ou "pro");</li>
            <li>Emitir recibos e notas fiscais, quando aplicável;</li>
            <li>Cumprir obrigações legais e contábeis.</li>
          </ul>
          <p>
            <strong>Base legal:</strong> O tratamento desses dados fundamenta-se na execução de contrato (art. 7º, V da LGPD)
            e no cumprimento de obrigação legal (art. 7º, II da LGPD) para fins fiscais e contábeis.
          </p>
        </section>


        {/* 11. Responsabilidades dos Estabelecimentos */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">11. Responsabilidades dos Estabelecimentos</h2>
          <p>
            Os estabelecimentos que utilizam o Bite Menu para coletar dados dos seus consumidores finais atuam como{" "}
            <strong>controladores</strong> desses dados, sendo o Bite Menu o operador. Ao utilizar a plataforma, os
            estabelecimentos reconhecem e assumem as seguintes responsabilidades:
          </p>
          <ul className="list-disc ml-6">
            <li>
              Garantir que a coleta e o tratamento dos dados dos seus consumidores finais estejam em conformidade com a LGPD
              e demais normas aplicáveis;
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
            para as finalidades descritas nesta política. O Bite Menu não se responsabiliza por falhas no processamento de
            pagamentos, erros de transação ou quaisquer perdas financeiras decorrentes de serviços de terceiros.
          </p>
        </section>

        {/* 12. Alterações nesta Política */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">12. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Os usuários sempre serão informados sobre alterações relevantes.
            A versão mais recente estará sempre disponível em{" "}
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
            Em caso de dúvidas, solicitações ou reclamações sobre esta Política de Privacidade ou sobre o tratamento de dados
            pelo Bite Menu, entre em contato pelo e-mail <strong>contato@bitemenu.com.br</strong>.
          </p>
        </section>

        {/* 14. Aceite */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">14. Aceite</h2>
          <p>
            O aceite desta Política de Privacidade é registrado de forma <strong>explícita</strong> no momento do cadastro ou
            no primeiro acesso após uma atualização relevante desta política, com data, hora e identificação do usuário
            armazenadas para fins de comprovação. Sem esse aceite, não é possível utilizar a plataforma como criador de
            cardápio.
          </p>
          <p>Em caso de atualização relevante desta política, solicitaremos novo aceite ao acessar a plataforma.</p>
          <p className="text-sm color-gray mt-4">
            O Bite Menu está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD) e segue boas
            práticas internacionais de segurança da informação. As transações financeiras são processadas com criptografia por
            meio da ValidaPay.
          </p>
        </section>
      </div>
    </div>
  );
};

export default page;
