import logoBranco from "@/assets/logo-reviva-branco.png.asset.json";
import logoVirando from "@/assets/logo-virando-jogo.png.asset.json";
import logoBazar from "@/assets/logo-bazar-solidario.png.asset.json";
import logoMao from "@/assets/logo-mao-amiga.png.asset.json";

export function Footer() {
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <img src={logoBranco.url} alt="Reviva Brasil" className="h-20 w-auto opacity-90" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/80">
              Restaurando vidas e valores. Sua participação ajuda nossos projetos sociais a continuarem transformando vidas.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/70">Nossos projetos</h4>
            <div className="mt-4 grid grid-cols-3 items-center gap-4 rounded-2xl bg-background/95 p-4">
              <img src={logoVirando.url} alt="Projeto Virando o Jogo" className="h-12 w-auto object-contain" title="Projeto Virando o Jogo" />
              <img src={logoBazar.url} alt="Bazar Solidário" className="h-12 w-auto object-contain" title="Bazar Solidário" />
              <img src={logoMao.url} alt="Projeto Mão Amiga" className="h-12 w-auto object-contain" title="Projeto Mão Amiga" />
            </div>
          </div>

          <div className="text-sm text-primary-foreground/80">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/70">Transparência</h4>
            <p className="mt-4 leading-relaxed">
              Os recursos arrecadados nas rifas são destinados aos projetos sociais da Associação Reviva Brasil.
              Todos os números são confirmados somente após a comprovação do pagamento via PIX.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/70 md:flex-row">
          <p>© {new Date().getFullYear()} Associação Reviva Brasil — Restaurando Vidas e Valores</p>
          <p>rifa.revivabrasil.com.br</p>
        </div>
      </div>
    </footer>
  );
}
