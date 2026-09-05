import { useEffect, useState } from "react";
import { watchAuth } from "./lib/auth";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Login from "./modules/Login";
import Painel from "./modules/Painel";
import Pessoas from "./modules/Pessoas";
import Agenda from "./modules/Agenda";
import Tarefas from "./modules/Tarefas";
import Vendas from "./modules/Vendas";
import Produtos from "./modules/Produtos";
import Financeiro from "./modules/Financeiro";
import Wiki from "./modules/Wiki";
import Equipa from "./modules/Equipa";
import Chat from "./modules/Chat";
import Definicoes from "./modules/Definicoes";
import { Spinner } from "./components/ui";
import { sair } from "./lib/auth";

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("fm_theme") || "system");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
    localStorage.setItem("fm_theme", theme);
  }, [theme]);

  return [theme, setTheme];
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = a carregar, null = sem sessão
  const [view, setView] = useState("painel");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    return watchAuth(setUser);
  }, []);

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  async function handleSignOut() {
    await sair();
    setUser(null);
  }

  if (user === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
        <Spinner />
      </div>
    );
  }

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <Sidebar
        active={view}
        onNavigate={(v) => { setView(v); setMobileOpen(false); }}
        user={user}
        onSignOut={handleSignOut}
        open={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar active={view} onOpenMobile={() => setMobileOpen(true)} theme={theme} onToggleTheme={toggleTheme} />
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {view === "painel" && <Painel user={user} onNavigate={setView} />}
          {view === "pessoas" && <Pessoas />}
          {view === "agenda" && <Agenda />}
          {view === "tarefas" && <Tarefas />}
          {view === "vendas" && <Vendas />}
          {view === "produtos" && <Produtos />}
          {view === "financeiro" && <Financeiro />}
          {view === "wiki" && <Wiki />}
          {view === "equipa" && <Equipa />}
          {view === "chat" && <Chat user={user} />}
          {view === "definicoes" && <Definicoes user={user} theme={theme} onSetTheme={setTheme} />}
        </main>
      </div>
    </div>
  );
}
