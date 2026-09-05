import { useMemo, useState } from "react";
import { Award } from "lucide-react";
import { useCollection, updateItem } from "../lib/db";
import { NIVEIS_CARREIRA, nivelPorPontos } from "../lib/constants";
import { Badge, Card, EmptyState, Input, Spinner } from "../components/ui";

export default function Equipa() {
  const { items, loading } = useCollection("pessoas");
  const parceiros = useMemo(
    () => items.filter((p) => p.tipo === "Parceiro").sort((a, b) => (b.pontos || 0) - (a.pontos || 0)),
    [items]
  );

  return (
    <div className="space-y-6 fm-fade-in">
      <div className="grid sm:grid-cols-3 gap-4">
        {NIVEIS_CARREIRA.map((n) => (
          <Card key={n.nome} className="p-4 space-y-1">
            <div className="flex items-center gap-2">
              <Award size={16} style={{ color: `var(--${n.cor})` }} />
              <p className="font-display text-base">{n.nome}</p>
            </div>
            <p className="text-xs text-[var(--ink-soft)]">a partir de {n.pontosMin.toLocaleString("pt-PT")} pontos</p>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Spinner /></div>
      ) : parceiros.length === 0 ? (
        <EmptyState title="Ainda sem parceiros" hint='Marca uma pessoa como "Parceiro" em Pessoas para aparecer aqui.' />
      ) : (
        <Card className="divide-y divide-[var(--line)] overflow-hidden">
          {parceiros.map((p) => {
            const nivel = nivelPorPontos(p.pontos || 0);
            return (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--wine-soft)] text-sm font-semibold text-white">
                  {p.nome?.slice(0, 1).toUpperCase()}
                </div>
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{p.nome}</p>
                <Badge tone={nivel.cor}>{nivel.nome}</Badge>
                <div className="flex items-center gap-1 text-sm">
                  <Input
                    type="number"
                    className="w-24 text-right"
                    defaultValue={p.pontos || 0}
                    onBlur={(e) => updateItem("pessoas", p.id, { pontos: Number(e.target.value) || 0 })}
                  />
                  <span className="text-xs text-[var(--ink-soft)]">pts</span>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
