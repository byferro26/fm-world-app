import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  Wallet,
  Calendar,
  Kanban,
  BookOpen,
  Network,
  MessageCircle,
  Settings,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react";

export const NAV_ITEMS = [
  { id: "painel", label: "Painel", icon: LayoutDashboard },
  { id: "pessoas", label: "Pessoas", icon: Users },
  { id: "vendas", label: "Vendas", icon: ShoppingBag },
  { id: "produtos", label: "Produtos", icon: Package },
  { id: "financeiro", label: "Financeiro", icon: Wallet },
  { id: "agenda", label: "Agenda", icon: Calendar },
  { id: "tarefas", label: "Tarefas", icon: Kanban },
  { id: "wiki", label: "Documentos", icon: BookOpen },
  { id: "equipa", label: "Equipa & Rede", icon: Network },
  { id: "chat", label: "Chat", icon: MessageCircle },
];

export default function Sidebar({ active, onNavigate, user, onSignOut, open, onCloseMobile }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={`fixed z-50 md:z-auto md:static top-0 left-0 h-full w-64 shrink-0 bg-[var(--sidebar)] text-[var(--ink-on-dark)] flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="font-display text-lg leading-none">FM World</p>
            <p className="text-[11px] text-[var(--ink-on-dark-soft)] mt-1 tracking-wide uppercase">
              Gestão de Negócio
            </p>
          </div>
          <button className="md:hidden text-[var(--ink-on-dark-soft)]" onClick={onCloseMobile}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-[var(--wine)] text-white"
                    : "text-[var(--ink-on-dark-soft)] hover:bg-white/5 hover:text-[var(--ink-on-dark)]"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
          <button
            onClick={() => onNavigate("definicoes")}
            className={`flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition ${
              active === "definicoes"
                ? "bg-[var(--wine)] text-white"
                : "text-[var(--ink-on-dark-soft)] hover:bg-white/5 hover:text-[var(--ink-on-dark)]"
            }`}
          >
            <Settings size={17} />
            Definições
          </button>
          {user?.papel === "admin" && (
            <button
              onClick={() => onNavigate("administracao")}
              className={`flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition ${
                active === "administracao"
                  ? "bg-[var(--wine)] text-white"
                  : "text-[var(--ink-on-dark-soft)] hover:bg-white/5 hover:text-[var(--ink-on-dark)]"
              }`}
            >
              <ShieldCheck size={17} />
              Administração
            </button>
          )}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--wine)] text-sm font-semibold text-white">
              {(user?.nome || user?.email || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{user?.nome || user?.email}</p>
              <p className="truncate text-[11px] text-[var(--ink-on-dark-soft)] capitalize">
                {user?.papel || "parceiro"}
              </p>
            </div>
            <button
              onClick={onSignOut}
              className="text-[var(--ink-on-dark-soft)] hover:text-[var(--ink-on-dark)]"
              title="Sair"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
