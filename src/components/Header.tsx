import { Link } from "@tanstack/react-router";
import logoColor from "@/assets/logo-reviva-color.png.asset.json";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoColor.url} alt="Associação Reviva Brasil" className="h-10 w-auto" />
          <span className="hidden text-sm font-semibold text-primary sm:inline">Rifa Solidária</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/" className="rounded-lg px-3 py-2 font-medium text-foreground hover:bg-secondary">Campanhas</Link>
          <Link 
            to="/admin/login" 
            className="rounded-lg border border-border p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-primary active:scale-95"
            title="Acesso Administrativo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </Link>
        </nav>
      </div>
    </header>
  );
}
