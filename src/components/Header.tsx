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
          <Link to="/admin/login" className="rounded-lg border border-border px-3 py-2 font-medium text-muted-foreground hover:bg-secondary hover:text-primary">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
