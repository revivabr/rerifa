import { Link } from "@tanstack/react-router";
import logoColor from "@/assets/logo-reviva-quadrado.png.asset.json";
import { Lock, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#f5efe1]/80 backdrop-blur-md border-b border-primary/10">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-8">
        <Link to="/" className="flex items-center gap-3 transition-all duration-300 hover:opacity-90 active:scale-95 group">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-[#faf7f0] flex items-center justify-center p-1 shadow-lg shadow-primary/10 border border-primary/5">
            <img 
              src={logoColor.url} 
              alt="Associação Reviva Brasil" 
              className="h-full w-full object-contain" 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-tighter text-primary leading-none">Rifa Solidária</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40">SORTE É SER GENEROSO</span>
          </div>
        </Link>
        
        <nav className="hidden items-center gap-8 md:flex">
          <Link 
            to="/" 
            className="text-xs font-bold uppercase tracking-widest text-foreground/50 hover:text-primary transition-colors"
          >
            Início
          </Link>
          <a 
            href="#campanhas" 
            className="text-xs font-bold uppercase tracking-widest text-foreground/50 hover:text-primary transition-colors"
          >
            Campanhas
          </a>
          <div className="h-4 w-px bg-primary/10" />
          <Link 
            to="/admin/login" 
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary transition-all hover:bg-primary hover:text-white"
            title="Área Administrativa"
          >
            <Lock className="h-4 w-4" />
          </Link>
        </nav>

        <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary md:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
