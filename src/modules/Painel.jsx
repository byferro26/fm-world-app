import { Users, ListChecks, CalendarClock, TrendingUp } from "lucide-react";
import { useCollection } from "../lib/db";
import { Card, KpiCard, Badge, EmptyState, Spinner } from "../components/ui";

function isFuture(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) >= new Date(new Date().toDateString());
}

export default function Painel({ user, onNavigate }) {
  const { items: pessoas, loading: lp } = useCollection("pessoas");
  const { items: tarefas, loading: lt } = useCollection("tarefas");
  const { items: agenda, loading: la } = useCollection("agenda", { orderByField: "data" });

  const loading = lp || lt || la;

  const clientes = pessoas.filter((p) => p.tipo === "Cliente" || p.tipo === "Parceiro e Cliente").length;
  const pendentes = tarefas.filter((t) => t.estado !== "Concluída").length;
  const proximos = agenda.filter((a) => isFuture(a.data)).slice(0, 5);
  const novosMes = pessoas.filter((p) => {
    if (!p.criadoEm?.toDate) return false;
    const d = p.criadoEm.toDate();
    const hoje = new Date();
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  }).length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 fm-fade-in">
      <p className="text-[var(--ink-soft)]">
        Olá, {user?.nome?.split(" ")[0] || "bem-vindo"}. Aqui está o resumo do negócio hoje.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Pessoas na base" value={pessoas.length} sub={`${clientes} clientes`} tone="wine" icon={<Users size={18} />} />
        <KpiCard label="Novos este mês" value={novosMes} sub="contactos / parceiros" tone="sage" icon={<TrendingUp size={18} />} />
        <KpiCard label="Tarefas pendentes" value={pendentes} sub={`${tarefas.length} no total`} tone="gold" icon={<ListChecks size={18} />} />
        <KpiCard label="Próximos compromissos" value={proximos.length} sub="agenda" tone="rust" icon={<CalendarClock size={18} />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base">Próximos compromissos</h3>
            <button className="text-xs text-[var(--wine)] hover:underline" onClick={() => onNavigate("agenda")}>
              Ver agenda
            </button>
          </div>
          {proximos.length === 0 ? (
            <EmptyState title="Sem compromissos agendados" hint="Cria um na Agenda." />
          ) : (
            <ul className="space-y-2">
              {proximos.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--line)] px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{a.titulo}</p>
                    <p className="text-xs text-[var(--ink-soft)]">{a.data} {a.hora || ""}</p>
                  </div>
                  <Badge tone="wine">{a.tipo || "Evento"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base">Tarefas por fazer</h3>
            <button className="text-xs text-[var(--wine)] hover:underline" onClick={() => onNavigate("tarefas")}>
              Ver tarefas
            </button>
          </div>
          {pendentes === 0 ? (
            <EmptyState title="Tudo em dia" hint="Sem tarefas pendentes." />
          ) : (
            <ul className="space-y-2">
              {tarefas
                .filter((t) => t.estado !== "Concluída")
                .slice(0, 5)
                .map((t) => (
                  <li key={t.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--line)] px-3 py-2">
                    <p className="text-sm font-medium">{t.titulo}</p>
                    <Badge tone={t.estado === "Em curso" ? "gold" : "neutral"}>{t.estado}</Badge>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
