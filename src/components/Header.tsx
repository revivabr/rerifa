import { Link } from "@tanstack/react-router";
import logoColor from "@/assets/logo-reviva-color.png.asset.json";
import { Lock, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-primary/5">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-8">
        <Link to="/" className="flex items-center gap-4 transition-all duration-300 hover:opacity-90 active:scale-95 group">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-primary flex items-center justify-center p-1.5 shadow-lg shadow-primary/10">
            <img 
              src={logoColor.url} 
              alt="Associação Reviva Brasil" 
              className="h-full w-full object-contain brightness-0 invert" 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-primary leading-none">Reviva Brasil</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary/60">Show de Prêmios</span>
          </div>
        </Link>
        
        <nav className="hidden items-center gap-8 md:flex">
          <Link 
            to="/" 
            className="text-xs font-semibold text-foreground/70 hover:text-primary transition-colors"
          >
            Início
          </Link>
          <a 
            href="#campanhas" 
            className="text-xs font-semibold text-foreground/70 hover:text-primary transition-colors"
          >
            Campanhas
          </a>
          <div className="h-4 w-px bg-primary/10" />
          <Link 
            to="/admin/login" 
            className="flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white"
          >
            <Lock className="h-3 w-3" />
            Entrar
          </Link>
        </nav>

        <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary md:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
