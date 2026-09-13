import { Link } from "@tanstack/react-router";
import logoColor from "@/assets/logo-reviva-quadrado.png.asset.json";
import { Lock, Menu, Home, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 md:px-8">
        <Link to="/" className="flex items-center gap-3 transition-all duration-300 hover:opacity-90 active:scale-95 group">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-primary/5 bg-secondary p-1 shadow-lg shadow-primary/10 sm:h-12 sm:w-12">
            <img 
              src={logoColor.url} 
              alt="Associação Reviva Brasil" 
              className="h-full w-full object-contain" 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black leading-none text-primary sm:text-base">Rifa Solidária</span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40 min-[380px]:block">SORTE É SER GENEROSO</span>
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
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary transition-all hover:bg-primary hover:text-primary-foreground"
            title="Área Administrativa"
          >
            <Lock className="h-4 w-4" />
          </Link>
        </nav>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[86vw] max-w-sm border-primary/10 bg-background p-0">
            <SheetHeader className="border-b border-border px-6 py-5 text-left">
              <SheetTitle className="flex items-center gap-3 text-primary">
                <img src={logoColor.url} alt="" className="h-10 w-10 rounded-lg object-contain" />
                Rifa Solidária
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2 p-4" aria-label="Menu principal">
              <SheetClose asChild>
                <Link to="/" className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-bold text-foreground hover:bg-secondary">
                  <Home className="h-5 w-5 text-primary" /> Início
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <a href="/#campanhas" className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-bold text-foreground hover:bg-secondary">
                  <Ticket className="h-5 w-5 text-primary" /> Campanhas
                </a>
              </SheetClose>
              <div className="my-2 h-px bg-border" />
              <SheetClose asChild>
                <Link to="/admin/login" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-premium">
                  <Lock className="h-4 w-4" /> Login administrativo
                </Link>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
