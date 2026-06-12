import logoBranco from "@/assets/logo-reviva-branco.png.asset.json";
import logoVirando from "@/assets/logo-virando-jogo.png.asset.json";
import logoBazar from "@/assets/logo-bazar-solidario.png.asset.json";
import logoMao from "@/assets/logo-mao-amiga.png.asset.json";

export function Footer() {
  return (
    <footer className="mt-32 bg-gradient-to-b from-stone-50 to-stone-100 border-t border-black/[0.05] text-primary">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-16 md:grid-cols-3">
          <div className="space-y-6">
            <div className="inline-block p-2 rounded-xl bg-primary shadow-sm">
              <img src={logoBranco.url} alt="Reviva Brasil" className="h-12 w-auto" />
            </div>
            <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Restaurando vidas e valores. Uma instituição dedicada a transformar realidades através da solidariedade e compromisso social.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Projetos Apoiados</h4>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex h-12 items-center rounded-lg bg-white px-3 shadow-sm border border-black/[0.03]">
                <img src={logoVirando.url} alt="Virando o Jogo" className="h-8 w-auto object-contain" />
              </div>
              <div className="flex h-12 items-center rounded-lg bg-white px-3 shadow-sm border border-black/[0.03]">
                <img src={logoBazar.url} alt="Bazar Solidário" className="h-8 w-auto object-contain" />
              </div>
              <div className="flex h-12 items-center rounded-lg bg-white px-3 shadow-sm border border-black/[0.03]">
                <img src={logoMao.url} alt="Mão Amiga" className="h-8 w-auto object-contain" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Transparência & Segurança</h4>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Todas as campanhas são auditadas e os recursos integralmente destinados aos projetos sociais da Associação Reviva Brasil. Pagamentos processados via Mercado Pago.
            </p>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-black/[0.1] pt-10 text-[11px] font-bold text-primary md:flex-row">
          <p>© {new Date().getFullYear()} Associação Reviva Brasil. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <span className="cursor-default hover:text-primary transition-colors">Termos de Uso</span>
            <span className="cursor-default hover:text-primary transition-colors">Política de Privacidade</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
