import logoBranco from "@/assets/logo-reviva-branco.png.asset.json";
import logoVirando from "@/assets/logo-virando-jogo.png.asset.json";
import logoBazar from "@/assets/logo-bazar-solidario.png.asset.json";
import logoMao from "@/assets/logo-mao-amiga.png.asset.json";

export function Footer() {
  return (
    <footer className="mt-32 bg-primary text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-16 md:grid-cols-3">
          <div className="space-y-6">
            <img src={logoBranco.url} alt="Reviva Brasil" className="h-14 w-auto opacity-100" />
            <p className="max-w-xs text-[13px] leading-relaxed text-white/60">
              Restaurando vidas e valores. Uma instituição dedicada a transformar realidades através da solidariedade e compromisso social.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Projetos Apoiados</h4>
            <div className="flex flex-wrap items-center gap-6">
              <img src={logoVirando.url} alt="Virando o Jogo" className="h-10 w-auto opacity-80 grayscale transition-all hover:grayscale-0" />
              <img src={logoBazar.url} alt="Bazar Solidário" className="h-10 w-auto opacity-80 grayscale transition-all hover:grayscale-0" />
              <img src={logoMao.url} alt="Mão Amiga" className="h-10 w-auto opacity-80 grayscale transition-all hover:grayscale-0" />
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Transparência & Segurança</h4>
            <p className="text-[13px] leading-relaxed text-white/60">
              Todas as campanhas são auditadas e os recursos integralmente destinados aos projetos sociais da Associação Reviva Brasil. Pagamentos processados via Mercado Pago.
            </p>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-10 text-[11px] font-medium text-white/40 md:flex-row">
          <p>© {new Date().getFullYear()} Associação Reviva Brasil. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <span className="cursor-default hover:text-white/60 transition-colors">Termos de Uso</span>
            <span className="cursor-default hover:text-white/60 transition-colors">Política de Privacidade</span>
          </div>
        </div>
      </div>
    </footer>
  );
}