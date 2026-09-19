import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Heart,
  ShieldCheck,
  FileText,
  Lock,
  Users,
  Zap,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

export const Route = createFileRoute("/informacoes")({
  head: () => ({
    meta: [
      { title: "Informações — Reviva Brasil" },
      {
        name: "description",
        content:
          "Conheça a Associação Reviva Brasil, nossos projetos sociais e como funcionam nossas rifas solidárias.",
      },
    ],
  }),
  component: InformacoesPage,
});

const sections = [
  {
    id: "quem-somos",
    icon: Users,
    title: "Quem Somos",
    color: "text-primary",
    bg: "bg-primary/5",
    content: [
      "A Associação Reviva Brasil é uma organização sem fins lucrativos dedicada a transformar vidas através da solidariedade. Nossa missão é restaurar vidas e valores, oferecendo apoio a famílias em situação de vulnerabilidade social.",
      "Atuamos em diversas frentes, desde projetos de educação e cultura até iniciativas de geração de renda e inclusão social. Cada ação entre amigos realizada em nossa plataforma tem como objetivo financiar esses projetos, garantindo sustentabilidade e impacto real.",
      "Somos movidos pela crença de que a sorte pode ser generosa. Quando você participa de uma rifa solidária, não apenas concorre a prêmios incríveis, mas também se torna parte ativa da mudança que queremos ver no mundo.",
    ],
  },
  {
    id: "como-funciona",
    icon: Zap,
    title: "Como Funciona",
    color: "text-gold",
    bg: "bg-gold/10",
    content: [
      "Nossas campanhas são ações entre amigos organizadas de forma transparente e segura. Cada campanha oferece cotas numeradas que você pode adquirir através de pagamento instantâneo via PIX, processado pela plataforma Mercado Pago.",
      "Após a confirmação do pagamento, seus números são reservados automaticamente e ficam disponíveis para o sorteio. Os resultados são baseados nos sorteios da Loteria Federal brasileira, garantindo total imparcialidade e auditoria pública.",
      "Os prêmios variam conforme a campanha — de motos e carros até dinheiro e experiências únicas. Parte da arrecadação é destinada aos nossos projetos sociais, como o Virando o Jogo, Bazar Solidário e Mão Amiga.",
    ],
  },
  {
    id: "termos-de-uso",
    icon: FileText,
    title: "Termos de Uso",
    color: "text-blue-600",
    bg: "bg-blue-50",
    content: [
      "Ao participar de nossas campanhas, você concorda com os termos e condições estabelecidos para cada ação. As campanhas são exclusivamente para maiores de 18 anos, residentes no território brasileiro.",
      "Os números adquiridos são intransferíveis e vinculados aos dados de contato do comprador. Em caso de cancelamento do pagamento, a reserva é automaticamente liberada para novo comprador. Não realizamos reembolsos após a confirmação da compra.",
      "O sorteio é realizado com base nos resultados oficiais da Loteria Federal. O ganhador será contactado através dos dados fornecidos no ato da compra. Caso não seja localizado em até 30 dias, um novo sorteio poderá ser realizado.",
    ],
  },
  {
    id: "privacidade",
    icon: Lock,
    title: "Privacidade",
    color: "text-green-600",
    bg: "bg-green-50",
    content: [
      "Respeitamos sua privacidade. Os dados pessoais coletados (nome, e-mail e telefone) são utilizados exclusivamente para processar sua participação, realizar o sorteio e contactar o ganhador.",
      "Não compartilhamos seus dados com terceiros para fins comerciais. Utilizamos criptografia e práticas de segurança alinhadas à LGPD para proteger suas informações contra acessos não autorizados.",
      "Você tem o direito de acessar, corrigir ou solicitar a exclusão de seus dados a qualquer momento. Para exercer esses direitos, entre em contato conosco através dos canais disponíveis em nosso site institucional.",
    ],
  },
  {
    id: "seguranca",
    icon: ShieldCheck,
    title: "Segurança",
    color: "text-red-600",
    bg: "bg-red-50",
    content: [
      "Nossa plataforma utiliza tecnologia de ponta para garantir transações seguras. Os pagamentos são processados diretamente pela API do Mercado Pago, sem que seus dados financeiros sejam armazenados em nossos servidores.",
      "Os sorteios são auditados e baseados em resultados públicos da Loteria Federal, eliminando qualquer possibilidade de manipulação. Todos os números vendidos e os resultados são registrados de forma transparente.",
      "Utilizamos conexão SSL em toda a plataforma e nossos servidores contam com monitoramento contínuo. Em caso de qualquer atividade suspeita, nossa equipe de segurança atua imediatamente para proteger nossos participantes.",
    ],
  },
];

function InformacoesPage() {
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5efe1] via-white to-[#faf7f0]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-primary px-6 py-20">
        <div className="absolute inset-0 bg-mesh opacity-20" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-sm border border-white/10">
            <Heart className="h-3 w-3" />
            Transparência e Confiança
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-5xl">
            Informações
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-white/70">
            Tudo o que você precisa saber sobre a Associação Reviva Brasil e
            nossas rifas solidárias.
          </p>
        </div>
      </section>

      {/* Quick Nav */}
      <section className="sticky top-20 z-40 border-b border-primary/10 bg-[#faf7f0]/90 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <nav className="flex flex-wrap items-center gap-3">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm ring-1 ring-primary/10 transition-all hover:bg-primary hover:text-white hover:shadow-md"
              >
                <s.icon className="h-3 w-3" />
                {s.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* Sections */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-16">
          {sections.map((section) => (
            <article
              key={section.id}
              id={section.id}
              className="scroll-mt-40"
            >
              <div className="rounded-[2rem] border border-black/[0.04] bg-white p-8 shadow-premium transition-all duration-500 hover:shadow-glass md:p-12">
                <div className="mb-8 flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${section.bg}`}
                  >
                    <section.icon
                      className={`h-7 w-7 ${section.color}`}
                    />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-primary md:text-3xl">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-5">
                  {section.content.map((paragraph, i) => (
                    <p
                      key={i}
                      className="text-sm font-medium leading-relaxed text-slate-600 md:text-base"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div className="mt-8 flex items-start gap-3 rounded-2xl bg-slate-50 p-5">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-xs font-bold uppercase tracking-widest text-primary/60">
                    Informação verificada e atualizada pela equipe Reviva Brasil
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-primary to-primary-glow p-10 text-center shadow-2xl shadow-primary/20 md:p-16">
          <h2 className="text-2xl font-black text-white md:text-3xl">
            Pronto para participar?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm font-medium text-white/70">
            Explore nossas campanhas ativas e seja parte dessa corrente do bem.
          </p>
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-primary shadow-lg transition-all hover:bg-white/90 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Início
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
