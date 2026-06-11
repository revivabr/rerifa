import { Link } from "@tanstack/react-router";
import logoColor from "@/assets/logo-reviva-color.png.asset.json";
import { Lock } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <img src={logoColor.url} alt="Associação Reviva Brasil" className="h-10 w-auto" />
          <span className="hidden text-sm font-black uppercase tracking-tighter text-primary sm:inline">Rifa Solidária</span>
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link 
            to="/" 
            className="text-xs font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
          >
            Campanhas
          </Link>
          <Link 
            to="/admin/login" 
            className="group flex h-8 w-8 items-center justify-center rounded-full bg-sand text-muted-foreground/40 transition-all hover:bg-primary/5 hover:text-primary active:scale-95"
            title="Acesso Administrativo"
          >
            <Lock className="h-3 w-3 transition-transform group-hover:rotate-12" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
