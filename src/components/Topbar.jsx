import { Menu, Sun, Moon } from "lucide-react";
import { NAV_ITEMS } from "./Sidebar";
import { IconButton } from "./ui";

export default function Topbar({ active, onOpenMobile, theme, onToggleTheme }) {
  const current = NAV_ITEMS.find((i) => i.id === active);
  const title = current ? current.label : active === "definicoes" ? "Definições" : active === "administracao" ? "Administração" : "";
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur px-4 md:px-8 py-4">
      <div className="flex items-center gap-3">
        <button className="md:hidden text-[var(--ink-soft)]" onClick={onOpenMobile}>
          <Menu size={22} />
        </button>
        <h1 className="font-display text-xl text-[var(--ink)]">{title}</h1>
      </div>
      <IconButton onClick={onToggleTheme} title="Alternar tema">
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </IconButton>
    </header>
  );
}
