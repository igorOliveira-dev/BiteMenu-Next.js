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
        <h1 className="default-h1">Termos de Uso – Bite Menu</h1>

        <p>Última atualização: 28/06/2026</p>

        <p>
          Bem-vindo ao <strong>Bite Menu</strong>. Antes de utilizar a plataforma, leia atentamente estes Termos de Uso. Eles
          regulam a relação entre você (doravante <strong>"Usuário"</strong> ou <strong>"Estabelecimento"</strong>) e o Bite
          Menu no acesso e uso de todos os serviços oferecidos.
        </p>

        {/* 1. Aceitação dos Termos */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">1. Aceitação dos Termos</h2>
          <p>
            Ao criar uma conta, acessar o painel do Bite Menu ou utilizar qualquer funcionalidade da plataforma, você declara
            ter lido, compreendido e concordado integralmente com estes Termos de Uso, com a{" "}
            <Link
              href="https://www.bitemenu.com.br/politica-de-privacidade"
              className="underline text-blue-500 hover:text-blue-700"
            >
              Política de Privacidade
            </Link>{" "}
            do Bite Menu e com quaisquer termos adicionais aplicáveis a funcionalidades específicas.
          </p>
          <p>
            Caso não concorde com qualquer disposição destes Termos, não utilize a plataforma. O uso continuado dos serviços
            após a publicação de uma nova versão dos Termos implica aceitação das alterações realizadas.
          </p>
          <p>
            A utilização da plataforma é permitida apenas para pessoas com capacidade civil plena nos termos da legislação
            brasileira. Pessoas menores de 18 anos somente poderão utilizar o Bite Menu mediante autorização expressa de seus
            responsáveis legais, que assumirão integral responsabilidade pelo uso.
          </p>
        </section>

        {/* 2. Definições */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">2. Definições</h2>
          <p>Para fins destes Termos, as expressões abaixo têm os seguintes significados:</p>
          <ul className="list-disc ml-6">
            <li>
              <strong>Bite Menu / Plataforma:</strong> o serviço de software como serviço (SaaS) disponível em{" "}
              <a
                href="https://www.bitemenu.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-500 hover:text-blue-700"
              >
                www.bitemenu.com.br
              </a>
              , que permite a criação, gestão e divulgação de cardápios digitais.
            </li>
            <li>
              <strong>Usuário / Estabelecimento:</strong> pessoa física ou jurídica que cria uma conta no Bite Menu para
              gerenciar um cardápio digital.
            </li>
            <li>
              <strong>Consumidor Final / Comprador:</strong> pessoa que acessa o cardápio de um estabelecimento para
              visualizar produtos, fazer pedidos ou realizar pagamentos.
            </li>
            <li>
              <strong>Cardápio Digital:</strong> a página pública do estabelecimento no Bite Menu, acessível via link ou QR
              Code, que exibe os produtos, preços e condições de pedido.
            </li>
            <li>
              <strong>Pedido:</strong> a seleção de produtos pelo consumidor final que resulta no envio de uma mensagem
              formatada ao WhatsApp do estabelecimento e/ou no registro no painel do Bite Menu.
            </li>
            <li>
              <strong>Plano:</strong> o nível de assinatura contratado pelo estabelecimento (Free, Plus ou Pro), determinando
              os recursos e limites disponíveis.
            </li>
            <li>
              <strong>Pagamentos Bite Menu:</strong> funcionalidade opcional, em fase de testes, que permite ao
              estabelecimento receber pagamentos online dos seus consumidores finais por meio do Stripe Connect Express.
            </li>
            <li>
              <strong>Stripe / Conta Conectada:</strong> o Stripe é o processador de pagamentos utilizado pelo Bite Menu para
              cobranças de assinatura e, no contexto do Pagamentos Bite Menu, para o credenciamento e processamento de
              transações dos estabelecimentos com seus clientes.
            </li>
          </ul>
        </section>

        {/* 3. Elegibilidade e Cadastro */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">3. Elegibilidade e Cadastro</h2>
          <p>Para criar uma conta no Bite Menu, o Usuário deve:</p>
          <ul className="list-disc ml-6">
            <li>Fornecer informações verdadeiras, precisas e completas durante o cadastro;</li>
            <li>Manter os dados cadastrais atualizados;</li>
            <li>Criar apenas uma conta por estabelecimento;</li>
          </ul>
          <p>
            O Usuário é o único responsável pela segurança das suas credenciais de acesso (e-mail e senha). Qualquer
            atividade realizada com suas credenciais é de sua responsabilidade, inclusive acessos não autorizados decorrentes
            de negligência na guarda das credenciais.
          </p>
          <p>
            Em caso de suspeita de acesso indevido, o Usuário deve alterar sua senha imediatamente e comunicar o Bite Menu
            pelo e-mail <strong>contato@bitemenu.com.br</strong>.
          </p>
          <p>
            O Bite Menu se reserva o direito de recusar cadastros ou cancelar contas a seu critério, especialmente nos casos
            previstos na Seção 14 destes Termos.
          </p>
        </section>

        {/* 4. Planos e Recursos */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">4. Planos e Recursos</h2>
          <p>O Bite Menu oferece os seguintes planos de acesso:</p>
          <ul className="list-disc ml-6">
            <li>
              <strong>Free (Gratuito):</strong> sem custo, sem prazo de expiração, sem necessidade de cartão de crédito.
              Inclui cardápio digital, controle de pedidos, controle de vendas, com limite de 20 itens e 4 categorias.
            </li>
            <li>
              <strong>Plus (R$ 24,90/mês):</strong> inclui todos os recursos do Free, com limite ampliado para 50 itens e 10
              categorias, maior personalização do cardápio e configuração de taxa de entrega por bairro.
            </li>
            <li>
              <strong>Pro (R$ 44,90/mês):</strong> inclui todos os recursos do Plus, com limite de 200 itens e 20 categorias,
              impressão de pedidos, dashboard de vendas avançado com filtros por período, análise de ticket médio e relatório
              de vendas.
            </li>
          </ul>
          <p>
            Os recursos específicos de cada plano estão sujeitos a atualização pelo Bite Menu, com comunicação prévia aos
            usuários afetados. O Bite Menu pode lançar novos recursos, modificar recursos existentes ou descontinuar
            funcionalidades com aviso prévio razoável, exceto em casos de urgência técnica, legal ou de segurança.
          </p>
          <p>
            O plano Free é oferecido sem garantia de disponibilidade permanente. O Bite Menu pode, a qualquer momento,
            modificar os limites ou as condições do plano gratuito, com aviso prévio de pelo menos 30 dias aos usuários
            ativos.
          </p>
          <p>
            Não há limite de quantidade de pedidos recebidos em nenhum plano. Os limites dos planos referem-se exclusivamente
            à quantidade de itens e categorias do cardápio digital e ao acesso a determinadas funcionalidades.
          </p>
          <p>
            Você pode verificar os detalhes de cada plano a qualquer momento em{" "}
            <a href="/docs/planos" className="underline text-blue-500 hover:text-blue-700">
              nossa página de planos
            </a>
            .
          </p>
        </section>

        {/* 5. Pagamento e Cobrança */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">5. Pagamento e Cobrança</h2>
          <p>
            As assinaturas dos planos Plus e Pro são cobradas mensalmente, com renovação automática na mesma data do mês, por
            meio do <strong>Stripe</strong>, processador de pagamentos parceiro do Bite Menu. O Usuário aceita que a
            contratação de um plano pago configura autorização de débito recorrente no instrumento de pagamento cadastrado.
          </p>
          <p>
            O Bite Menu não armazena dados de cartão de crédito. Essas informações são tratadas exclusivamente pelo Stripe,
            em conformidade com o padrão PCI-DSS. Consulte a{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500 hover:text-blue-700"
            >
              Política de Privacidade do Stripe
            </a>{" "}
            para mais informações.
          </p>
          <p>
            <strong>Período de teste gratuito:</strong> Determinados planos podem incluir um período de teste sem cobrança
            (por exemplo, 7 dias no plano Pro). Findo esse período, a assinatura é convertida automaticamente em paga e
            cobrada mensalmente, salvo cancelamento pelo Usuário antes do término do período de teste. É responsabilidade
            exclusiva do Usuário cancelar o plano dentro do prazo caso não deseje ser cobrado.
          </p>
          <p>
            <strong>Alteração de preços:</strong> O Bite Menu poderá ajustar os valores dos planos mediante aviso prévio de
            30 dias. O Usuário poderá cancelar sem ônus antes da entrada em vigor do novo valor.
          </p>
          <p>
            <strong>Falha no pagamento:</strong> Em caso de falha no débito recorrente, o Bite Menu poderá suspender o acesso
            aos recursos do plano pago e rebaixar a conta para o plano Free até a regularização.
          </p>
        </section>

        {/* 6. Cancelamento e Reembolsos */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">6. Cancelamento e Reembolsos</h2>
          <p>
            O Usuário pode cancelar a assinatura paga a qualquer momento, diretamente pelo painel do Bite Menu ou pelo e-mail{" "}
            <strong>contato@bitemenu.com.br</strong>, sem necessidade de justificativa e sem multa por rescisão antecipada.
          </p>
          <p>
            O usuário perde acesso imediatamente aos recursos do plano pago e sua conta é convertida para o plano free após o
            cancelamento, mas mantém acesso ao cardápio digital e aos dados do painel, podendo voltar a utilizar os planos
            pagos futuramente.
          </p>
          <p>
            <strong>Reembolsos:</strong> Salvo disposição legal em contrário ou em situações de erro de cobrança comprovado,
            o Bite Menu não realiza reembolsos de mensalidades já processadas, uma vez que o acesso à plataforma durante o
            período pago constitui a contraprestação devida. Solicitações de reembolso por erro de cobrança devem ser
            enviadas para <strong>contato@bitemenu.com.br</strong> em até 7 dias corridos após a data da cobrança.
          </p>
          <p>
            O encerramento voluntário da conta pelo Usuário implica a perda de acesso a todos os dados do cardápio, pedidos e
            vendas armazenados na plataforma.
          </p>
        </section>

        {/* 7. Uso Permitido e Obrigações do Usuário */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">7. Uso Permitido e Obrigações do Usuário</h2>
          <p>
            O Bite Menu é uma plataforma destinada a estabelecimentos do setor de alimentação (restaurantes, bares,
            lanchonetes, hamburguerias, pizzarias, açaiterias, food trucks, doceiras, marmitarias e similares) e outros
            comércios que desejam criar e gerenciar cardápios digitais para venda de produtos legalmente comercializáveis.
          </p>
          <p>Ao utilizar a plataforma, o Usuário se compromete a:</p>
          <ul className="list-disc ml-6">
            <li>Utilizar o Bite Menu exclusivamente para fins lícitos e em conformidade com a legislação vigente;</li>
            <li>
              Manter os dados cadastrais e do cardápio atualizados, precisos e condizentes com a realidade do
              estabelecimento;
            </li>
            <li>
              Responsabilizar-se pelo conteúdo publicado no cardápio digital, incluindo descrições, imagens, preços e
              disponibilidade dos produtos;
            </li>
            <li>
              Cumprir a legislação sanitária, tributária, trabalhista e demais normas aplicáveis à sua atividade comercial;
            </li>
            <li>Tratar os consumidores finais com respeito e conduzir as relações comerciais com transparência;</li>
            <li>
              Honrar os pedidos recebidos conforme as condições anunciadas no cardápio, salvo caso fortuito ou força maior.
            </li>
          </ul>
        </section>

        {/* 8. Uso Proibido */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">8. Uso Proibido</h2>
          <p>É expressamente vedado ao Usuário:</p>
          <ul className="list-disc ml-6">
            <li>
              Anunciar ou comercializar produtos ilegais, falsificados, adulterados, sem os devidos registros sanitários,
              substâncias proibidas ou qualquer item cuja comercialização seja vedada pela legislação do país do
              estabelecimento;
            </li>
            <li>
              Inserir informações falsas, enganosas ou fraudulentas no cardápio digital, incluindo preços incorretos,
              descrições imprecisas ou imagens de produtos diferentes dos ofertados;
            </li>
            <li>Utilizar a plataforma para lavagem de dinheiro, fraude, evasão fiscal ou qualquer atividade ilícita;</li>
            <li>Tentar acessar sistemas, áreas restritas ou contas de outros usuários sem autorização;</li>
            <li>
              Realizar engenharia reversa, descompilar, copiar, reproduzir ou criar obras derivadas do software do Bite Menu;
            </li>
            <li>
              Usar scripts automatizados, bots ou qualquer mecanismo para extrair dados da plataforma (scraping) sem
              autorização prévia e por escrito do Bite Menu;
            </li>
            <li>Criar múltiplas contas para um mesmo estabelecimento ou se fazer passar por outra pessoa ou empresa;</li>
            <li>Utilizar a plataforma para envio de comunicações não solicitadas (spam) aos consumidores finais;</li>
            <li>
              Publicar conteúdo que infrinja direitos de propriedade intelectual de terceiros, incluindo imagens, logotipos
              ou textos protegidos por direitos autorais utilizados sem autorização.
            </li>
          </ul>
          <p>
            A violação de qualquer das proibições acima pode resultar na suspensão ou encerramento imediato da conta, sem
            prejuízo das medidas legais cabíveis.
          </p>
        </section>

        {/* 9. Conteúdo do Usuário */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">9. Conteúdo do Usuário</h2>
          <p>
            O Usuário mantém a titularidade de todo o conteúdo que insere na plataforma, incluindo textos, imagens, logotipo,
            banner e dados do cardápio (<strong>"Conteúdo do Usuário"</strong>). Ao publicar esse conteúdo, o Usuário concede
            ao Bite Menu uma licença não exclusiva, gratuita, mundial e pelo prazo necessário para a prestação dos serviços,
            para hospedar, exibir, reproduzir e distribuir o Conteúdo do Usuário exclusivamente para fins de operação da
            plataforma.
          </p>
          <p>
            O Usuário declara e garante que possui todos os direitos necessários sobre o Conteúdo do Usuário publicado,
            incluindo os direitos de imagem de fotografias e o direito de uso de marcas ou logotipos exibidos, e que referido
            conteúdo não viola direitos de terceiros nem a legislação vigente.
          </p>
          <p>
            O Bite Menu não monitora o conteúdo publicado pelos usuários de forma ativa, mas se reserva o direito de remover,
            sem aviso prévio, qualquer conteúdo que, a seu critério, viole estes Termos, a legislação aplicável ou direitos
            de terceiros, sem que isso gere qualquer responsabilidade ao Bite Menu.
          </p>
          <p>
            O Bite Menu não se responsabiliza pela veracidade, qualidade, segurança ou legalidade dos produtos e serviços
            anunciados pelos estabelecimentos em seus cardápios digitais.
          </p>
        </section>

        {/* 10. Cardápio Digital e Recebimento de Pedidos */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">10. Cardápio Digital e Recebimento de Pedidos</h2>
          <p>
            O Bite Menu disponibiliza ao estabelecimento um cardápio digital acessível pelos consumidores finais via link ou
            QR Code, sem necessidade de instalação de aplicativo.
          </p>
          <p>
            <strong>Fluxo padrão de pedidos:</strong> Ao finalizar o pedido no cardápio, o consumidor final é redirecionado
            ao WhatsApp e envia uma mensagem formatada com os itens selecionados, forma de pagamento escolhida, serviço
            (entrega, retirada ou consumo no local), nome e endereço (quando aplicável) diretamente para o número de WhatsApp
            cadastrado pelo estabelecimento. O Bite Menu age apenas como facilitador da montagem e formatação do pedido, sem
            participar da comunicação entre o consumidor e o estabelecimento após o envio.
          </p>
          <p>
            O Usuário pode optar por também receber e gerenciar os pedidos diretamente no painel do Bite Menu, onde poderá
            atualizá-los e registrá-los como vendas.
          </p>
          <p>
            <strong>Limitações relacionadas ao WhatsApp:</strong> O Bite Menu não tem vínculo, parceria ou contrato com o
            WhatsApp (Meta Platforms, Inc.) e não se responsabiliza por indisponibilidades, mudanças de funcionalidades ou
            restrições impostas pelo WhatsApp que afetem o recebimento de pedidos. O Usuário é responsável por manter seu
            número de WhatsApp ativo e acessível.
          </p>
          <p>
            <strong>Relação com o consumidor final:</strong> A relação comercial relativa ao pedido — incluindo confirmação,
            prazo de entrega, qualidade dos produtos, atendimento e pagamento — é estabelecida exclusivamente entre o
            consumidor final e o estabelecimento. O Bite Menu não é parte dessa relação e não se responsabiliza por disputas,
            inadimplências, reclamações ou danos decorrentes das transações realizadas entre estabelecimento e consumidor.
          </p>
        </section>

        {/* 11. Pagamentos Bite Menu (Funcionalidade em Fase de Testes) */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">11. Pagamentos Bite Menu (Funcionalidade em Fase de Testes)</h2>

          <p>
            <strong>Funcionalidade em fase de testes:</strong> O Pagamentos Bite Menu está disponível apenas para contas
            selecionadas. Os recursos, condições e termos descritos nesta seção podem ser alterados sem o aviso prévio de 30
            dias normalmente aplicável, dado o caráter experimental da funcionalidade. Os usuários participantes serão
            informados diretamente sobre alterações relevantes.
          </p>

          <p>
            <strong>Natureza da funcionalidade:</strong> O Pagamentos Bite Menu é uma funcionalidade opcional que viabiliza a
            integração entre o cardápio digital do estabelecimento e o <strong>Stripe Connect Express</strong>, permitindo
            que consumidores finais realizem pagamentos online diretamente ao estabelecimento. O Bite Menu é uma{" "}
            <strong>plataforma de tecnologia</strong> e não atua como instituição financeira, operadora de pagamentos,
            adquirente ou custodiante de valores. Todo o processamento financeiro é de responsabilidade exclusiva do{" "}
            <strong>Stripe</strong>, empresa devidamente regulamentada para operar serviços de pagamento.
          </p>

          <p>
            <strong>Termos do Stripe:</strong> Ao aderir ao Pagamentos Bite Menu, o estabelecimento celebra uma relação
            direta com o Stripe, aceitando os{" "}
            <a
              href="https://stripe.com/br/legal/connect-account"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500 hover:text-blue-700"
            >
              Termos de Serviço do Stripe Connect
            </a>
            , que complementam estes Termos de Uso. Em caso de conflito entre as disposições do Stripe e estes Termos no que
            se refere ao processamento financeiro, prevalecerão os termos do Stripe sobre sua própria operação.
          </p>

          <p>
            <strong>Credenciamento (onboarding e KYC):</strong> Para habilitar o recebimento de pagamentos, o estabelecimento
            deve concluir o processo de credenciamento diretamente com o Stripe, que coleta e verifica as informações de
            identidade (KYC) e conformidade regulatória (AML) necessárias. O Bite Menu não coleta, não armazena e não tem
            acesso a esses dados. Caso o Stripe não aprove ou suspenda o credenciamento do estabelecimento, o Bite Menu não
            tem responsabilidade por tal decisão nem capacidade de revertê-la.
          </p>

          <p>
            <strong>Taxa de plataforma:</strong> O Bite Menu cobra uma taxa de <strong>3% (três por cento)</strong> sobre o
            valor bruto de cada transação bem-sucedida processada via Pagamentos Bite Menu. Essa taxa é descontada
            automaticamente pelo Stripe antes do repasse ao estabelecimento e <strong>não é reembolsável</strong> em nenhuma
            hipótese, inclusive em caso de cancelamento do pedido, reembolso ao consumidor ou estorno, pois está vinculada ao
            processamento da transação e não ao resultado comercial do pedido.
          </p>

          <p>
            <strong>Taxa do Stripe:</strong> Além da taxa de plataforma do Bite Menu, o Stripe cobra sua própria taxa sobre
            cada transação processada, definida de acordo com sua própria precificação. O Bite Menu não recebe, não controla
            e não tem influência sobre essa taxa. Ambas as taxas — a do Bite Menu e a do Stripe — são descontadas
            automaticamente pelo Stripe antes do repasse ao estabelecimento, que recebe o valor líquido diretamente em sua
            conta bancária. Para conhecer os valores exatos aplicáveis à sua conta, consulte a
            <a
              href="https://stripe.com/br/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500 hover:text-blue-700"
            >
              página de preços do Stripe
            </a>
            .
          </p>

          <p>
            <strong>Repasse dos valores:</strong> Os prazos e condições para o repasse dos valores ao estabelecimento são
            definidos <strong>exclusivamente pelo Stripe</strong> e podem variar conforme o perfil da conta, o método de
            pagamento e o histórico de transações. O Bite Menu não tem controle, responsabilidade nem capacidade de
            intervenção sobre prazos de repasse, retenções ou bloqueios de valores realizados pelo Stripe. Em caso de dúvidas
            sobre repasses, o estabelecimento deve contatar diretamente o{" "}
            <a
              href="https://support.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500 hover:text-blue-700"
            >
              suporte do Stripe
            </a>
            .
          </p>

          <p>
            <strong>Reembolsos:</strong> A decisão de reembolsar total ou parcialmente um pedido é{" "}
            <strong>exclusivamente do estabelecimento</strong>, que é quem tem a relação comercial com o consumidor final. O
            processamento técnico dos reembolsos é realizado pelo Stripe. A taxa de 3% do Bite Menu sobre a transação
            original não é restituída em caso de reembolso. A taxa do Stripe sobre a transação original também pode não ser
            devolvida, conforme as políticas do Stripe vigentes.
          </p>

          <p>
            <strong>Chargebacks:</strong> Contestações de pagamento (chargebacks) iniciadas pelo consumidor junto à operadora
            do cartão são gerenciadas diretamente pelo Stripe. O Bite Menu não oferece suporte em processos de chargeback,
            cabendo ao estabelecimento acompanhar, responder e fornecer evidências diretamente pelos canais disponibilizados
            pelo Stripe. O estabelecimento é responsável por manter registros de pedidos e comprovantes que possam ser
            utilizados em disputas.
          </p>

          <p>
            <strong>Responsabilidades do estabelecimento no Pagamentos Bite Menu:</strong>
          </p>
          <ul className="list-disc ml-6">
            <li>Manter a conta Stripe ativa, verificada e em conformidade com os termos do Stripe Connect;</li>
            <li>
              Informar seus consumidores que o pagamento online é processado pelo Stripe, conforme a Política de Privacidade
              do Stripe;
            </li>
            <li>
              Cumprir todas as obrigações fiscais sobre os valores recebidos, incluindo emissão de nota fiscal quando exigida
              pela legislação;
            </li>
            <li>Responder por eventuais chargebacks e reembolsos perante o Stripe e os consumidores finais;</li>
            <li>Não utilizar o Pagamentos Bite Menu para fins ilegais, incluindo lavagem de dinheiro ou fraude.</li>
          </ul>

          <p>
            O Bite Menu não se responsabiliza por falhas no processamento de pagamentos, recusas de transação, atrasos ou
            retenções de repasse, erros do Stripe, indisponibilidade do sistema de pagamento ou quaisquer perdas financeiras
            decorrentes do uso ou não uso do Pagamentos Bite Menu.
          </p>
        </section>

        {/* 12. Propriedade Intelectual */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">12. Propriedade Intelectual</h2>
          <p>
            O Bite Menu e todos os seus componentes — incluindo código-fonte, design, interface, marca, logotipo, textos
            institucionais, estrutura da plataforma e demais elementos originais — são de titularidade exclusiva do Bite Menu
            e estão protegidos pela legislação brasileira de propriedade intelectual, incluindo a Lei nº 9.279/1996
            (Propriedade Industrial) e a Lei nº 9.610/1998 (Direitos Autorais).
          </p>
          <p>
            Estes Termos não transferem ao Usuário qualquer direito de propriedade intelectual sobre a plataforma. O Usuário
            recebe apenas uma licença limitada, não exclusiva, intransferível e revogável para acessar e utilizar o Bite Menu
            conforme estes Termos.
          </p>
          <p>
            É vedado ao Usuário reproduzir, copiar, distribuir, modificar, criar obras derivadas, sublicenciar, vender,
            alugar ou de qualquer forma explorar comercialmente o software ou qualquer componente da plataforma sem
            autorização prévia e por escrito do Bite Menu.
          </p>
          <p>O Conteúdo do Usuário permanece de titularidade do Usuário, conforme disposto na Seção 9.</p>
        </section>

        {/* 13. Disponibilidade da Plataforma */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">13. Disponibilidade da Plataforma</h2>
          <p>
            O Bite Menu emprega esforços razoáveis para manter a plataforma disponível de forma contínua. No entanto, não
            garante disponibilidade ininterrupta, uma vez que podem ocorrer interrupções por manutenção programada,
            atualizações de sistema, falhas de infraestrutura de terceiros ou eventos fora do controle do Bite Menu.
          </p>
          <p>
            O Bite Menu buscará comunicar com antecedência as manutenções programadas que possam afetar a disponibilidade do
            serviço, sempre que possível.
          </p>
          <p>
            O Bite Menu utiliza infraestrutura de terceiros (incluindo Supabase e Vercel) e não se responsabiliza por
            interrupções causadas por falhas nesses serviços. O funcionamento do envio de pedidos via WhatsApp também depende
            de serviços de terceiros (Meta Platforms, Inc.) sobre os quais o Bite Menu não tem controle.
          </p>
          <p>
            O Bite Menu se reserva o direito de modificar, suspender ou descontinuar, a qualquer momento, qualquer
            funcionalidade ou aspecto da plataforma, com comunicação prévia de pelo menos 30 dias quando se tratar de
            alterações relevantes que afetem o uso regular dos serviços.
          </p>
        </section>

        {/* 14. Limitação de Responsabilidade */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">14. Limitação de Responsabilidade</h2>
          <p>Na máxima extensão permitida pela legislação brasileira aplicável, o Bite Menu não se responsabiliza por:</p>
          <ul className="list-disc ml-6">
            <li>
              Perdas de vendas, lucros cessantes ou danos indiretos decorrentes de indisponibilidade da plataforma, do
              WhatsApp ou de outros serviços de terceiros;
            </li>
            <li>
              Disputas, inadimplências, reclamações ou danos decorrentes da relação comercial entre o estabelecimento e seus
              consumidores finais, incluindo problemas de entrega, qualidade dos produtos ou atendimento;
            </li>
            <li>
              Falhas, atrasos, retenções ou recusas no processamento de pagamentos pelo Stripe no contexto do Bite Menu
              Pagamentos;
            </li>
            <li>Perdas financeiras decorrentes de chargebacks, estornos ou fraudes no uso do Pagamentos Bite Menu;</li>
            <li>
              Perda de dados decorrente de exclusão voluntária da conta, falhas de sincronização causadas pelo usuário ou
              eventos de força maior;
            </li>
            <li>
              Uso indevido da plataforma por terceiros que tenham obtido acesso às credenciais do Usuário por negligência
              deste.
            </li>
          </ul>
        </section>

        {/* 15. Suspensão e Encerramento de Conta */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">15. Suspensão e Encerramento de Conta</h2>
          <p>
            O Bite Menu poderá, a seu critério, suspender temporariamente ou encerrar definitivamente a conta do Usuário, com
            ou sem aviso prévio conforme a gravidade da situação, nos seguintes casos:
          </p>
          <ul className="list-disc ml-6">
            <li>Violação de qualquer disposição destes Termos de Uso;</li>
            <li>Uso da plataforma para fins ilegais ou fraudulentos;</li>
            <li>
              Publicação de conteúdo que viole direitos de terceiros, a legislação vigente ou as boas práticas comerciais;
            </li>
            <li>Inadimplência reiterada no pagamento da assinatura;</li>
            <li>
              Conduta que coloque em risco a segurança, a reputação ou o funcionamento da plataforma ou de outros usuários.
            </li>
          </ul>
          <p>
            Em casos menos graves, o Bite Menu buscará notificar o Usuário e conceder prazo para regularização antes de
            adotar medidas de suspensão ou encerramento.
          </p>
          <p>
            O Usuário pode encerrar sua conta a qualquer momento, diretamente no painel do Bite Menu ou pelo e-mail{" "}
            <strong>contato@bitemenu.com.br</strong>. O encerramento não desobriga o Usuário das obrigações assumidas durante
            o uso da plataforma, incluindo valores devidos referentes ao período de uso.
          </p>
        </section>

        {/* 16. Relação entre as Partes */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">16. Relação entre as Partes</h2>
          <p>
            Estes Termos estabelecem uma relação de prestação de serviços de tecnologia entre o Bite Menu e o Usuário. Nada
            nestes Termos cria ou deve ser interpretado como criação de vínculo empregatício, societário, de franquia, de
            mandato, de representação comercial ou qualquer outra modalidade associativa entre as partes.
          </p>
          <p>
            O Bite Menu não é agente do Usuário nem do consumidor final para nenhuma finalidade. O Usuário age em nome
            próprio e é o único responsável pelas obrigações comerciais, fiscais e legais decorrentes de sua atividade no
            cardápio digital.
          </p>
        </section>

        {/* 17. Decisões Automatizadas */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">17. Decisões Automatizadas</h2>
          <p>
            O Bite Menu não realiza decisões automatizadas que produzam efeitos jurídicos ou afetem de maneira significativa
            os titulares de dados, conforme previsto no art. 20 da LGPD.
          </p>
          <p>
            Alguns serviços de terceiros integrados à plataforma — em especial o Stripe, no contexto do Pagamentos Bite Menu
            — podem realizar análises automatizadas para fins de prevenção a fraudes, verificação de identidade e cumprimento
            de obrigações regulatórias (KYC/AML), de acordo com suas próprias políticas. Essas análises são de
            responsabilidade exclusiva do Stripe e regidas por seus próprios termos.
          </p>
        </section>

        {/* 18. Privacidade e Proteção de Dados */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">18. Privacidade e Proteção de Dados</h2>
          <p>
            O tratamento de dados pessoais no âmbito do Bite Menu é regido pela{" "}
            <Link
              href="https://www.bitemenu.com.br/politica-de-privacidade"
              className="underline text-blue-500 hover:text-blue-700"
            >
              Política de Privacidade
            </Link>{" "}
            do Bite Menu, que complementa estes Termos de Uso e deve ser lida em conjunto com eles. O Bite Menu atua em
            conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 – LGPD).
          </p>
          <p>
            O Usuário, ao utilizar o Bite Menu para coletar dados de seus consumidores finais, atua como controlador desses
            dados e é responsável pelo cumprimento da LGPD e demais normas de proteção de dados aplicáveis em sua relação com
            esses consumidores.
          </p>
        </section>

        {/* 19. Incidentes de Segurança */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">19. Incidentes de Segurança</h2>
          <p>
            O Bite Menu adota medidas técnicas e administrativas adequadas para proteger os dados e sistemas da plataforma.
            Caso ocorra incidente de segurança que possa acarretar risco ou dano relevante aos titulares de dados, o Bite
            Menu adotará as medidas cabíveis previstas na LGPD, incluindo comunicação à Autoridade Nacional de Proteção de
            Dados (ANPD) e aos titulares afetados quando exigido pela legislação, no menor prazo razoável.
          </p>
          <p>
            O Usuário que identificar ou suspeitar de qualquer incidente de segurança envolvendo sua conta ou dados da
            plataforma deve comunicar imediatamente o Bite Menu pelo e-mail <strong>contato@bitemenu.com.br</strong>.
          </p>
        </section>

        {/* 20. Alterações nestes Termos */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">20. Alterações nestes Termos</h2>
          <p>
            O Bite Menu pode atualizar estes Termos de Uso a qualquer momento. Em caso de alterações relevantes,
            notificaremos os Usuários cadastrados pelo dashboard do Bite Menu.
          </p>
          <p>
            O uso continuado da plataforma após a entrada em vigor da nova versão dos Termos implica aceitação das
            alterações. Caso o Usuário não concorde com as mudanças, poderá cancelar sua conta antes da data de vigência dos
            novos Termos, sem ônus adicional.
          </p>
          <p>
            A versão mais recente destes Termos estará sempre disponível em{" "}
            <Link href="https://www.bitemenu.com.br/termos-de-uso" className="underline text-blue-500 hover:text-blue-700">
              https://bitemenu.com.br/termos-de-uso
            </Link>
            .
          </p>
        </section>

        {/* 21. Contato */}
        <section className="flex flex-col gap-2 mb-4">
          <h2 className="default-h2">21. Contato</h2>
          <p>
            Em caso de dúvidas, solicitações ou reclamações relacionadas a estes Termos de Uso ou ao funcionamento da
            plataforma, entre em contato pelo e-mail <strong>contato@bitemenu.com.br</strong>.
          </p>
          <p className="text-sm color-gray mt-4">
            O Bite Menu é uma plataforma de tecnologia desenvolvida para estabelecimentos do setor de alimentação. Não somos
            uma instituição financeira, operadora de pagamentos ou adquirente. Os serviços de processamento de pagamentos são
            prestados pelo Stripe, empresa independente e devidamente regulamentada.
          </p>
        </section>
      </div>
    </div>
  );
};

export default page;
