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

        <p>Última atualização: 27/06/2026</p>

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
            <li>
              <strong>Compradores finais (Pagamentos Bite Menu):</strong> clientes dos estabelecimentos que realizam
              pagamentos online via Stripe Checkout ao finalizar um pedido.
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
            <li>
              <strong>Plataforma tecnológica intermediadora</strong> no contexto do Pagamentos Bite Menu: viabiliza a
              integração com o Stripe Connect Express para que os estabelecimentos recebam pagamentos online, sem coletar nem
              ter acesso aos dados de pagamento dos compradores finais nem aos dados de verificação de identidade (KYC)
              submetidos diretamente ao Stripe durante o credenciamento.
            </li>
          </ul>
          <p>
            O <strong>Stripe</strong> atua como <strong>controlador independente</strong> dos dados coletados por ele
            diretamente — em especial os dados de verificação de identidade dos estabelecimentos (KYC/AML) e os dados de
            pagamento dos compradores finais —, nos termos de sua própria{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500 hover:text-blue-700"
            >
              Política de Privacidade
            </a>
            .
          </p>
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
            <li>Dados relacionados à assinatura dos planos Bite Menu (processados via Stripe);</li>
            <li>
              Identificador da conta Stripe conectada (apenas quando o estabelecimento habilita o Pagamentos Bite Menu).
            </li>
          </ul>

          <p>
            <strong>Credenciamento no Pagamentos Bite Menu (KYC via Stripe):</strong> Ao aderir ao Pagamentos Bite Menu, o
            estabelecimento é redirecionado ao ambiente seguro do Stripe para concluir o processo de credenciamento (
            <em>onboarding</em>). Nesse fluxo, o Stripe coleta diretamente do estabelecimento as informações exigidas para
            verificação de identidade (KYC – <em>Know Your Customer</em>) e prevenção à lavagem de dinheiro (AML –{" "}
            <em>Anti-Money Laundering</em>), tais como CPF ou CNPJ, dados bancários para recebimento, documento de identidade
            com foto e demais documentos exigidos pela regulamentação vigente. O Bite Menu{" "}
            <strong>não coleta, não armazena e não tem acesso</strong> aos dados de KYC submetidos pelo estabelecimento ao
            Stripe. Em nosso banco de dados, armazenamos apenas um identificador que confirma se a conta Stripe do
            estabelecimento está conectada e ativa.
          </p>

          <p>As informações coletadas pelo Bite Menu são utilizadas para:</p>
          <ul className="list-disc ml-6">
            <li>Criar e gerenciar a conta do estabelecimento na plataforma;</li>
            <li>Permitir a criação, edição e exibição de cardápios digitais;</li>
            <li>Processar pedidos e facilitar a comunicação entre o estabelecimento e seus clientes;</li>
            <li>Gerenciar a assinatura e o faturamento dos planos;</li>
            <li>Habilitar e manter a integração com o Stripe Connect Express para recebimentos online;</li>
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
              processamento de pedidos, cobrança da assinatura e habilitação do Pagamentos Bite Menu;
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
            estabelecimentos apenas com fornecedores de infraestrutura necessários ao funcionamento da plataforma (Supabase e
            Stripe), com o Stripe para fins de processamento de assinaturas e habilitação do Pagamentos Bite Menu, e, quando
            legalmente exigido, com autoridades competentes.
          </p>
          <p>
            Os dados de pagamento da assinatura não são armazenados pelo Bite Menu, mas pelo Stripe, que atua como
            processador de pagamentos.
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
            <li>
              <strong>Stripe</strong> (processamento de assinaturas dos planos e, para usuários do Pagamentos Bite Menu,
              credenciamento via Stripe Connect Express e processamento de transações online dos clientes dos
              estabelecimentos) – servidores nos Estados Unidos e em outras jurisdições.
            </li>
          </ul>
          <p>
            Essas transferências são realizadas em conformidade com o art. 33 da LGPD, com base em garantias contratuais
            adequadas, incluindo cláusulas-padrão de proteção de dados (o Stripe adota medidas contratuais específicas para
            transferências internacionais provenientes do Brasil). Esses fornecedores adotam padrões de segurança
            equivalentes ou superiores aos exigidos pela legislação brasileira. Para mais informações, consulte a{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500 hover:text-blue-700"
            >
              Política de Privacidade do Supabase
            </a>{" "}
            e a{" "}
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
            <strong>Dados tratados diretamente pelo Stripe:</strong> Para exercer direitos sobre dados coletados pelo Stripe
            — como dados de cartão de crédito ou informações de verificação de identidade (KYC) submetidas durante o
            credenciamento no Stripe Connect —, o titular deve contatar o Stripe diretamente pelo e-mail{" "}
            <strong>dpo@stripe.com</strong> ou pelos canais indicados na{" "}
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
            <li>
              <strong>Confirmações de transações do Pagamentos Bite Menu:</strong> identificadores e status de transações são
              retidos pelo mesmo prazo dos dados financeiros, para fins de comprovação fiscal e resolução de disputas;
            </li>
            <li>
              <strong>Dados de KYC e verificação de identidade:</strong> retidos pelo Stripe conforme suas próprias políticas
              e obrigações regulatórias. O Bite Menu não retém esses dados;
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
            Para a contratação dos planos pagos <strong>Plus</strong> e <strong>Pro</strong>, o Bite Menu utiliza o{" "}
            <strong>Stripe</strong> como processador de pagamentos. Nesse contexto, o Bite Menu é o{" "}
            <strong>controlador</strong> e o Stripe atua como <strong>operador</strong> (subprocessador) para as finalidades
            de cobrança e gestão das assinaturas, nos termos do DPA celebrado entre as partes.
          </p>
          <p>
            Ao contratar um plano pago, o estabelecimento é redirecionado a uma página segura do Stripe para inserir seus
            dados de pagamento. O Bite Menu <strong>não armazena nem tem acesso</strong> a informações sensíveis como número
            de cartão, código de segurança (CVV) ou data de validade.
          </p>
          <p>As informações que o Bite Menu recebe do Stripe sobre as assinaturas incluem:</p>
          <ul className="list-disc ml-6">
            <li>Identificador da transação e da assinatura;</li>
            <li>Status do pagamento (ativo, cancelado, pendente, inadimplente);</li>
            <li>Plano contratado e período de vigência;</li>
            <li>Data de início e término da assinatura.</li>
          </ul>
          <p>Esses dados são usados exclusivamente para:</p>
          <ul className="list-disc ml-6">
            <li>Ativar e validar o plano contratado na plataforma;</li>
            <li>Atualizar o status do plano ("free", "plus" ou "pro");</li>
            <li>Emitir recibos e notas fiscais, quando aplicável;</li>
            <li>Cumprir obrigações legais e contábeis.</li>
          </ul>
          <p>
            <strong>Período de teste gratuito:</strong> Alguns planos podem oferecer período de teste sem cobrança (por
            exemplo, 7 dias no plano Pro). Após o término, a assinatura é convertida automaticamente em paga e o valor é
            cobrado mensalmente, salvo cancelamento pelo estabelecimento antes do vencimento do período de teste. É de
            responsabilidade do usuário cancelar previamente caso não deseje continuar com o plano pago.
          </p>
          <p>
            <strong>Base legal:</strong> O tratamento desses dados fundamenta-se na execução de contrato (art. 7º, V da LGPD)
            e no cumprimento de obrigação legal (art. 7º, II da LGPD) para fins fiscais e contábeis.
          </p>
          <p>
            O processamento das assinaturas está sujeito à{" "}
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

        {/* 11. Pagamentos Bite Menu – Recebimentos Online pelos Estabelecimentos */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">11. Pagamentos Bite Menu – Recebimentos Online pelos Estabelecimentos</h2>

          <p>
            <strong>Funcionalidade em fase de testes:</strong> O Pagamentos Bite Menu está disponível apenas para contas
            selecionadas. Os recursos e condições descritos nesta seção podem ser alterados durante o período de testes, sem
            o aviso prévio previsto na Seção 14, dado o caráter experimental da funcionalidade. Nesses casos, as atualizações
            serão comunicadas diretamente aos usuários participantes.
          </p>

          <p>
            O <strong>Pagamentos Bite Menu</strong> permite que estabelecimentos recebam pagamentos online dos seus clientes
            diretamente em sua conta bancária, por meio da integração com o <strong>Stripe Connect Express</strong>. O Bite
            Menu é uma <strong>plataforma de tecnologia</strong> e não atua como instituição financeira, operadora de
            pagamentos ou adquirente. Todo o processamento financeiro é realizado pelo Stripe, empresa devidamente
            regulamentada para operar serviços de pagamento. Ao aderir ao Pagamentos Bite Menu, o estabelecimento concorda
            com os{" "}
            <a
              href="https://stripe.com/br/legal/connect-account"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500 hover:text-blue-700"
            >
              Termos de Serviço do Stripe Connect
            </a>
            , celebrando uma relação contratual direta com o Stripe para fins regulatórios e de processamento financeiro.
          </p>

          <p>
            <strong>Como funciona o Stripe Connect Express:</strong> O Stripe Connect Express é um modelo de integração em
            que o Stripe gerencia diretamente a conta financeira de cada estabelecimento (conta conectada). Nesse modelo:
          </p>
          <ul className="list-disc ml-6">
            <li>
              O estabelecimento possui uma conta própria no Stripe, vinculada à plataforma do Bite Menu, e acessa o painel do
              Stripe para visualizar saldos, histórico de transações e dados financeiros;
            </li>
            <li>
              Os valores pagos pelos clientes finais são transferidos diretamente para a conta bancária do estabelecimento,
              conforme os prazos definidos exclusivamente pelo Stripe. O Bite Menu{" "}
              <strong>não retém, não custódia e não tem controle</strong> sobre os valores pagos pelos clientes;
            </li>
            <li>
              O Bite Menu recebe automaticamente uma taxa de plataforma de 3% sobre o valor bruto de cada transação
              processada com sucesso, descontada pelo Stripe antes do repasse ao estabelecimento. Essa taxa não é
              reembolsável em caso de cancelamento ou estorno.
            </li>
          </ul>

          <p>
            <strong>Credenciamento e verificação de identidade (onboarding e KYC):</strong> Para habilitar o recebimento de
            pagamentos, o estabelecimento deve concluir o processo de credenciamento diretamente no Stripe. Nesse processo, o{" "}
            <strong>Stripe</strong> — como controlador independente — coleta, armazena e verifica as informações necessárias
            para o cumprimento de obrigações regulatórias de KYC e AML, incluindo:
          </p>
          <ul className="list-disc ml-6">
            <li>CPF (para pessoas físicas) ou CNPJ (para pessoas jurídicas);</li>
            <li>Dados bancários para recebimento (agência, conta e titularidade);</li>
            <li>Documento de identidade com foto (RG, CNH ou equivalente);</li>
            <li>Endereço comercial e demais documentos exigidos pela regulamentação vigente.</li>
          </ul>
          <p>
            O Stripe pode realizar verificações adicionais, quando exigido pela regulamentação aplicável. Essas verificações
            são conduzidas pelo Stripe sob suas próprias obrigações legais e regulatórias, de forma independente ao Bite
            Menu.
          </p>
          <p>
            O Bite Menu <strong>não coleta, não armazena e não tem acesso</strong> aos dados de KYC submetidos pelo
            estabelecimento ao Stripe. Em nosso banco de dados, armazenamos apenas um identificador que confirma se a conta
            Stripe do estabelecimento está conectada e ativa, e o status geral da integração.
          </p>

          <p>
            <strong>Dados que o Bite Menu recebe sobre as transações:</strong> Após a confirmação do pagamento pelo Stripe
            (via webhook), o Bite Menu armazena apenas:
          </p>
          <ul className="list-disc ml-6">
            <li>Identificador da transação no Stripe;</li>
            <li>Status do pagamento (pago, pendente, falho);</li>
            <li>Valor bruto da transação e da taxa de plataforma;</li>
            <li>Referência ao pedido associado no Bite Menu.</li>
          </ul>
          <p>
            O Bite Menu <strong>não armazena</strong> dados de cartão de crédito, dados bancários do estabelecimento nem
            informações financeiras detalhadas dos compradores finais. Toda essa informação é mantida e gerenciada
            exclusivamente pelo Stripe.
          </p>

          <p>
            <strong>Base legal:</strong> O tratamento dos dados relativos ao Pagamentos Bite Menu (identificador de conta
            conectada e confirmações de transação) fundamenta-se na execução de contrato (art. 7º, V da LGPD), necessário
            para viabilizar o recebimento de pagamentos online pelo estabelecimento, e no cumprimento de obrigação legal
            (art. 7º, II da LGPD) para fins fiscais e contábeis.
          </p>
        </section>

        {/* 12. Tratamento dos Dados do Comprador Final */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">12. Tratamento dos Dados do Comprador Final</h2>
          <p>
            Quando um cliente de um estabelecimento finaliza um pedido e opta por pagar por um método de pagamento que
            utiliza Stripe naquele estabelecimento, ele é redirecionado ao <strong>Stripe Checkout</strong>, uma interface
            segura hospedada e operada diretamente pelo Stripe. Nesse fluxo:
          </p>
          <ul className="list-disc ml-6">
            <li>
              Os dados de pagamento do comprador — incluindo número do cartão de crédito, data de validade e código de
              segurança (CVV) — são inseridos diretamente na plataforma do Stripe e{" "}
              <strong>nunca trafegam pelos servidores do Bite Menu</strong>;
            </li>
            <li>
              O Stripe atua como <strong>controlador independente</strong> dos dados de pagamento do comprador, aplicando os
              padrões de segurança PCI-DSS nível 1 e sua própria política de privacidade;
            </li>
            <li>
              O Bite Menu não tem acesso aos dados completos do instrumento de pagamento (como número do cartão, CVV ou dados
              bancários).
            </li>
          </ul>

          <p>
            <strong>Dados de pedido do comprador:</strong> Os dados pessoais fornecidos pelo comprador para a realização do
            pedido (nome, telefone, endereço) são tratados conforme descrito na Seção 4 desta política, com o estabelecimento
            como controlador e o Bite Menu como operador. Esses dados preexistem ao fluxo de pagamento e não são expandidos
            em razão do uso do Stripe.
          </p>

          <p>
            <strong>Informações recebidas do Stripe sobre a transação:</strong> Após a confirmação do pagamento, o Bite Menu
            recebe do Stripe apenas as informações de status da transação (identificador, status e valor), sem dados pessoais
            adicionais do comprador além dos já armazenados no contexto do pedido.
          </p>

          <p>
            <strong>Responsabilidade do estabelecimento perante o comprador:</strong> O estabelecimento, como controlador dos
            dados dos seus clientes, é responsável por:
          </p>
          <ul className="list-disc ml-6">
            <li>
              Informar adequadamente seus clientes de que o pagamento online é processado pelo Stripe, sujeito à{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-500 hover:text-blue-700"
              >
                Política de Privacidade do Stripe
              </a>
              ;
            </li>
            <li>
              Gerir a relação comercial com o comprador, incluindo atendimento, cancelamentos e decisões sobre reembolsos;
            </li>
            <li>
              Cumprir as obrigações fiscais aplicáveis sobre os valores recebidos, incluindo a emissão de nota fiscal quando
              exigida por lei.
            </li>
          </ul>

          <p>
            <strong>Exercício de direitos pelo comprador:</strong> Para direitos relacionados aos dados de pagamento
            coletados diretamente pelo Stripe (dados de cartão, autenticações e histórico de transações), o comprador deve
            contatar o Stripe pelo e-mail <strong>dpo@stripe.com</strong> ou pelos canais indicados na{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500 hover:text-blue-700"
            >
              Política de Privacidade do Stripe
            </a>
            . Para dados relativos ao pedido (nome, telefone, endereço), o comprador pode contatar o estabelecimento ou o
            Bite Menu pelo e-mail <strong>contato@bitemenu.com.br</strong>.
          </p>

          <p>
            <strong>Base legal:</strong> O tratamento do status de transação recebido do Stripe pelo Bite Menu fundamenta-se
            na execução de contrato (art. 7º, V da LGPD) e no legítimo interesse (art. 7º, IX da LGPD) de atualizar o status
            do pedido e garantir a integridade do fluxo de compra para o estabelecimento e o comprador.
          </p>
        </section>

        {/* 13. Responsabilidades dos Estabelecimentos */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">13. Responsabilidades dos Estabelecimentos</h2>
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
            <strong>Responsabilidades adicionais para usuários do Pagamentos Bite Menu:</strong>
          </p>
          <ul className="list-disc ml-6">
            <li>
              Manter a conta Stripe ativa, verificada e em conformidade com os{" "}
              <a
                href="https://stripe.com/br/legal/connect-account"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-500 hover:text-blue-700"
              >
                Termos de Serviço do Stripe Connect
              </a>{" "}
              e demais políticas do Stripe;
            </li>
            <li>
              Informar seus clientes que o pagamento online é processado pelo Stripe, sujeito à Política de Privacidade do
              Stripe;
            </li>
            <li>
              Gerenciar a relação comercial com os compradores finais, incluindo atendimento, cancelamentos e decisões sobre
              reembolsos, cuja responsabilidade é exclusiva do estabelecimento;
            </li>
            <li>
              Acompanhar e responder a eventuais chargebacks (contestações de pagamento iniciadas pelo comprador junto à
              operadora do cartão) diretamente pelo painel do Stripe, sem envolvimento do Bite Menu;
            </li>
            <li>
              Cumprir as obrigações fiscais aplicáveis sobre os valores recebidos, incluindo a emissão de nota fiscal quando
              exigida pela legislação vigente.
            </li>
          </ul>

          <p>
            O Bite Menu trata os dados dos consumidores finais exclusivamente conforme as instruções dos estabelecimentos e
            para as finalidades descritas nesta política. O Bite Menu não se responsabiliza por falhas no processamento de
            pagamentos, atrasos em repasses, retenções de valores pelo Stripe, erros de transação ou quaisquer perdas
            financeiras decorrentes do uso da integração com o Stripe.
          </p>
        </section>

        {/* 14. Alterações nesta Política */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">14. Alterações nesta Política</h2>
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

        {/* 15. Contato */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">15. Contato</h2>
          <p>
            Em caso de dúvidas, solicitações ou reclamações sobre esta Política de Privacidade ou sobre o tratamento de dados
            pelo Bite Menu, entre em contato pelo e-mail <strong>contato@bitemenu.com.br</strong>.
          </p>
        </section>

        {/* 16. Aceite */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">16. Aceite</h2>
          <p>
            O aceite desta Política de Privacidade é registrado de forma <strong>explícita</strong> no momento do cadastro ou
            no primeiro acesso após uma atualização relevante desta política, com data, hora e identificação do usuário
            armazenadas para fins de comprovação. Sem esse aceite, não é possível utilizar a plataforma como criador de
            cardápio.
          </p>
          <p>Em caso de atualização relevante desta política, solicitaremos novo aceite ao acessar a plataforma.</p>
          <p className="text-sm color-gray mt-4">
            O Bite Menu está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD) e segue boas
            práticas internacionais de segurança da informação. As transações financeiras são processadas com criptografia e
            certificação PCI-DSS nível 1 por meio do Stripe.
          </p>
        </section>
      </div>
    </div>
  );
};

export default page;
