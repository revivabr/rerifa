import logoBranco from "@/assets/logo-reviva-branco.png.asset.json";
import logoVirando from "@/assets/logo-virando-jogo.png.asset.json";
import logoBazar from "@/assets/logo-bazar-solidario.png.asset.json";
import logoMao from "@/assets/logo-mao-amiga.png.asset.json";
import { Shield, Heart, Info } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="col-span-1 lg:col-span-1 space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/10 p-2">
                <img src={logoBranco.url} alt="Reviva Brasil" className="h-full w-full object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight">Reviva Brasil</span>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              Restaurando vidas e valores através da solidariedade. Junte-se a nós e transforme o futuro de milhares de famílias.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40">
              <Heart className="h-3 w-3" />
              Projetos Sociais
            </h4>
            <div className="flex flex-col gap-4">
              {[
                { logo: logoVirando, name: "Virando o Jogo" },
                { logo: logoBazar, name: "Bazar Solidário" },
                { logo: logoMao, name: "Mão Amiga" }
              ].map((project, i) => (
                <div key={i} className="flex items-center gap-3 group cursor-pointer">
                  <div className="h-8 w-12 rounded bg-white/5 p-1 transition-colors group-hover:bg-white/10">
                    <img src={project.logo.url} alt={project.name} className="h-full w-full object-contain grayscale brightness-200" />
                  </div>
                  <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">{project.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40">
              <Shield className="h-3 w-3" />
              Segurança
            </h4>
            <p className="text-sm leading-relaxed text-white/60">
              Sorteios auditados baseados na Loteria Federal. Ambiente 100% seguro com criptografia de ponta a ponta.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40">
              <Info className="h-3 w-3" />
              Informações
            </h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Quem Somos</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Como Funciona</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-10 text-[11px] font-medium text-white/40 md:flex-row">
          <p>© {new Date().getFullYear()} Associação Reviva Brasil. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <img src="https://logodownload.org/wp-content/uploads/2019/09/mercado-pago-logo.png" alt="Mercado Pago" className="h-4 w-auto opacity-40 grayscale" />
          </div>
        </div>
      </div>
    </footer>
  );
}
