import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { Bell, LogOut, Menu, UserRound, X } from "lucide-react";
import { Logo } from "./Logo.jsx";
import { Button } from "./ui.jsx";
import { buttonClass } from "../lib/buttonClass.js";
import { useAuth } from "../auth/context.js";
import { CONTACT_EMAIL, GITHUB_URL } from "../lib/supabase.js";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Logo className="text-base" />
          <p>Feito por Luciano Pereira.</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Rodapé">
          <Link to="/sobre" className="hover:text-ink">
            Sobre
          </Link>
          <Link to="/termos" className="hover:text-ink">
            Termos de uso
          </Link>
          <Link to="/privacidade" className="hover:text-ink">
            Privacidade
          </Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink">
            Contato
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-ink">
            Código no GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}

export function SiteLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  // O menu fica aberto só na página em que foi aberto
  const [openOn, setOpenOn] = useState(null);
  const open = openOn === pathname;

  const links = (
    <>
      <NavLink to="/sobre" className="rounded-full px-3 py-2 text-ink-soft hover:text-ink">
        Sobre
      </NavLink>
      {user ? (
        <Link to="/painel" className={buttonClass("primary", "sm")}>
          Abrir meus lembretes
        </Link>
      ) : (
        <>
          <NavLink to="/entrar" className="rounded-full px-3 py-2 text-ink-soft hover:text-ink">
            Entrar
          </NavLink>
          <Link to="/cadastro" className={buttonClass("primary", "sm")}>
            Criar conta grátis
          </Link>
        </>
      )}
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" aria-label="RemindMail, página inicial">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 text-[15px] font-medium sm:flex" aria-label="Principal">
            {links}
          </nav>
          <button
            type="button"
            className="rounded-lg p-2 text-ink sm:hidden"
            onClick={() => setOpenOn(open ? null : pathname)}
            aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
        {open && (
          <nav className="flex flex-col items-start gap-1 border-t border-line px-5 py-4 text-[15px] font-medium sm:hidden" aria-label="Principal">
            {links}
          </nav>
        )}
      </header>
      <main id="conteudo" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function AppLayout() {
  const { profile, user, signOut } = useAuth();
  const name = profile?.username || user?.email?.split("@")[0] || "";
  const tab = ({ isActive }) =>
    `inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors ${
      isActive ? "bg-ink text-white" : "text-ink-soft hover:bg-line-soft hover:text-ink"
    }`;

  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <header className="sticky top-0 z-30 border-b border-line bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
          <Link to="/painel" aria-label="Meus lembretes">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1" aria-label="Painel">
            <NavLink to="/painel" end className={tab}>
              <Bell className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Lembretes</span>
            </NavLink>
            <NavLink to="/painel/conta" className={tab}>
              <UserRound className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{name ? `Conta de ${name.split(" ")[0]}` : "Conta"}</span>
            </NavLink>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair" title="Sair">
              <LogOut className="size-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-5 py-12 sm:py-16">
      <div className="rounded-3xl border border-line bg-card p-7 shadow-xl shadow-ink/5 sm:p-9">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{subtitle}</p>}
        <div className="mt-7">{children}</div>
      </div>
      {footer && <div className="mt-6 text-center text-[15px] text-ink-soft">{footer}</div>}
    </div>
  );
}
