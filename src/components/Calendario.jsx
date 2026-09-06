import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "./ui";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function toIso(date) {
  return date.toISOString().slice(0, 10);
}

export default function Calendario({ eventos, onSelecionarDia }) {
  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });

  const eventosPorDia = useMemo(() => {
    const map = new Map();
    for (const e of eventos) {
      if (!e.data) continue;
      if (!map.has(e.data)) map.set(e.data, []);
      map.get(e.data).push(e);
    }
    return map;
  }, [eventos]);

  const celulas = useMemo(() => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    const dias = [];
    for (let i = 0; i < primeiroDiaSemana; i++) dias.push(null);
    for (let d = 1; d <= totalDias; d++) dias.push(new Date(ano, mes, d));
    return dias;
  }, [mesAtual]);

  const hojeIso = toIso(new Date());

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-display text-xl">{MESES[mesAtual.getMonth()]} {mesAtual.getFullYear()}</p>
        <div className="flex items-center gap-1">
          <button
            className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--line)] hover:bg-[var(--bg-panel-alt)]"
            onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            className="px-3 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--line)] hover:bg-[var(--bg-panel-alt)] text-sm"
            onClick={() => setMesAtual(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
          >
            Hoje
          </button>
          <button
            className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--line)] hover:bg-[var(--bg-panel-alt)]"
            onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-t border-l border-[var(--line)]">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="border-r border-b border-[var(--line)] bg-[var(--bg-panel-alt)] px-2 py-1.5 text-xs text-[var(--ink-soft)]">
            {d}
          </div>
        ))}
        {celulas.map((dia, i) => {
          if (!dia) return <div key={i} className="border-r border-b border-[var(--line)] bg-[var(--bg-panel-alt)] min-h-24" />;
          const iso = toIso(dia);
          const eventosDoDia = eventosPorDia.get(iso) || [];
          const isHoje = iso === hojeIso;
          return (
            <button
              key={i}
              onClick={() => onSelecionarDia?.(iso)}
              className="border-r border-b border-[var(--line)] bg-[var(--bg-panel)] min-h-24 p-1.5 text-left align-top hover:bg-[var(--bg-panel-alt)] transition"
            >
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${isHoje ? "bg-[var(--wine)] text-white" : "text-[var(--ink-soft)]"}`}>
                {dia.getDate()}
              </span>
              <div className="mt-1 space-y-0.5">
                {eventosDoDia.slice(0, 3).map((e) => (
                  <div key={e.id} className="truncate text-[11px]">
                    <Badge tone="wine" className="max-w-full truncate">{e.titulo}</Badge>
                  </div>
                ))}
                {eventosDoDia.length > 3 && (
                  <p className="text-[11px] text-[var(--ink-soft)]">+{eventosDoDia.length - 3} mais</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
