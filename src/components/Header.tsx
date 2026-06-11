import { Link } from "@tanstack/react-router";
import logoColor from "@/assets/logo-reviva-color.png.asset.json";
import { Lock, User } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass-morphism border-b border-black/[0.03]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">
        <Link to="/" className="flex items-center gap-4 transition-all duration-300 hover:opacity-80 active:scale-95">
          <img src={logoColor.url} alt="Associação Reviva Brasil" className="h-9 w-auto" />
          <div className="hidden h-6 w-[1px] bg-black/10 sm:block" />
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 sm:inline">
            Rifa Solidária
          </span>
        </Link>
        
        <nav className="flex items-center gap-8">
          <Link 
            to="/" 
            className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground/70 hover:text-primary transition-all duration-300"
          >
            Campanhas
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              to="/admin/login" 
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.05] bg-white text-muted-foreground/60 transition-all duration-300 hover:border-primary/20 hover:text-primary hover:shadow-sm active:scale-95"
              title="Acesso Administrativo"
            >
              <Lock className="h-3.5 w-3.5" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
