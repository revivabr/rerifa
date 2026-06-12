import logoBranco from "@/assets/logo-reviva-quadrado.png.asset.json";
import logoVirando from "@/assets/logo-virando-jogo.png.asset.json";
import logoBazar from "@/assets/logo-bazar-solidario.png.asset.json";
import logoMao from "@/assets/logo-mao-amiga.png.asset.json";
import logoMercadoPago from "@/assets/mercado-pago-logo.png.asset.json";
import { Heart, Info } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#faf7f0] p-1 flex items-center justify-center">
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
            <div className="flex items-center gap-6 flex-wrap">
              {[
                { logo: logoVirando, name: "Virando o Jogo" },
                { logo: logoBazar, name: "Bazar Solidário" },
                { logo: logoMao, name: "Mão Amiga" }
              ].map((project, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="h-14 w-24 rounded-lg bg-[#faf7f0] p-2 transition-colors group-hover:bg-white flex items-center justify-center">
                    <img src={project.logo.url} alt={project.name} className="h-full w-full object-contain" />
                  </div>
                </div>
              ))}
            </div>
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
              <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center gap-6 border-t border-white/5 pt-10 text-sm font-medium text-white/40">
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 w-full flex-wrap">
              <p>Sorteios auditados por IA na plataforma. Ambiente 100% seguro, pagamento via API&nbsp;</p>
              <img src={logoMercadoPago.url} alt="Mercado Pago" className="h-4 w-auto opacity-60 brightness-0 invert" />
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 w-full flex-wrap">
              <p>© {new Date().getFullYear()} Associação Reviva Brasil. Todos os direitos reservados.</p>
              <span className="hidden md:inline text-white/20">·</span>
              <p>
                Feito com ❤️ por{" "}
                <a href="https://levelupconsultor.com.br" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">
                  LevelUP Consultor
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
