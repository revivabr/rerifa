import { Link } from "@tanstack/react-router";
import logoColor from "@/assets/logo-reviva-color.png.asset.json";
import { Lock } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-black/[0.05]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8 md:px-12">
        <Link to="/" className="flex items-center gap-6 transition-all duration-700 hover:opacity-80 active:scale-95 group">
          <img src={logoColor.url} alt="Associação Reviva Brasil" className="h-10 w-10 object-contain p-1 border border-primary/10 rounded-xl transition-transform duration-700 group-hover:scale-105" />
          <div className="hidden h-5 w-[1px] bg-black/[0.05] sm:block" />
          <span className="hidden text-[9px] font-bold uppercase tracking-[0.4em] text-primary/40 sm:inline transition-colors duration-700 group-hover:text-primary">
            Private Selection
          </span>
        </Link>
        
        <nav className="flex items-center gap-12">
          <Link 
            to="/" 
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/50 hover:text-primary transition-all duration-500"
          >
            Coleções
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              to="/admin/login" 
              className="flex h-12 w-12 items-center justify-center rounded-full border border-black/[0.03] bg-white/50 text-muted-foreground/40 transition-all duration-700 hover:border-primary/20 hover:text-primary hover:shadow-premium hover:bg-white active:scale-90"
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

