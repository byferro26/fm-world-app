import { useMemo, useState } from "react";
import { Award, ChevronDown, ChevronRight, Network } from "lucide-react";
import { useCollection, updateItem } from "../lib/db";
import { NIVEIS_CARREIRA, nivelPorPontos } from "../lib/constants";
import { Badge, Card, EmptyState, Input, Spinner } from "../components/ui";

const CLUBES = ["Magnólia", "Orquídea", "Estrela"];

export default function Equipa() {
  const { items, loading } = useCollection("pessoas");
  const parceiros = useMemo(
    () => items.filter((p) => p.tipo === "Parceiro").sort((a, b) => (b.pontos || 0) - (a.pontos || 0)),
    [items]
  );

  return (
    <div className="space-y-6 fm-fade-in">
      <div>
        <h3 className="font-display text-base mb-3">Clubes de carreira</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {CLUBES.map((clube) => (
            <Card key={clube} className="p-4 space-y-2.5">
              <p className="font-display text-base flex items-center gap-2">
                <Award size={16} style={{ color: `var(--${NIVEIS_CARREIRA.find((n) => n.clube === clube)?.cor})` }} />
                {clube}
              </p>
              <ul className="space-y-1">
                {NIVEIS_CARREIRA.filter((n) => n.clube === clube).map((n) => (
                  <li key={n.nome} className="flex items-center justify-between text-xs text-[var(--ink-soft)]">
                    <span>{n.nome}</span>
                    <span>{n.eficacia} · {n.pontosMin.toLocaleString("pt-PT")} pts</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--ink-soft)]">
          O Clube Estrela depende também do número de ramas qualificadas em Orquídea, não só de pontos — confirma os limiares com o Plano de Marketing oficial mais recente.
        </p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Spinner /></div>
      ) : parceiros.length === 0 ? (
        <EmptyState title="Ainda sem parceiros" hint='Marca uma pessoa como "Parceiro" em Pessoas para aparecer aqui.' />
      ) : (
        <>
          <div>
            <h3 className="font-display text-base mb-3">Parceiros por nível</h3>
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
          </div>

          <div>
            <h3 className="font-display text-base mb-3 flex items-center gap-2">
              <Network size={17} /> Árvore de rede (ramificação)
            </h3>
            <Card className="p-4">
              <ArvoreRede parceiros={parceiros} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function ArvoreRede({ parceiros }) {
  const porPatrocinador = useMemo(() => {
    const map = new Map();
    for (const p of parceiros) {
      const chave = p.patrocinadorId && parceiros.some((x) => x.id === p.patrocinadorId) ? p.patrocinadorId : "raiz";
      if (!map.has(chave)) map.set(chave, []);
      map.get(chave).push(p);
    }
    return map;
  }, [parceiros]);

  const raiz = porPatrocinador.get("raiz") || [];

  if (raiz.length === 0) {
    return <p className="text-sm text-[var(--ink-soft)]">Sem parceiros no topo da rede.</p>;
  }

  return (
    <ul className="space-y-1">
      {raiz.map((p) => (
        <NodoRede key={p.id} pessoa={p} porPatrocinador={porPatrocinador} nivelProfundidade={0} />
      ))}
    </ul>
  );
}

function NodoRede({ pessoa, porPatrocinador, nivelProfundidade }) {
  const [aberto, setAberto] = useState(nivelProfundidade < 1);
  const filhos = porPatrocinador.get(pessoa.id) || [];
  const nivel = nivelPorPontos(pessoa.pontos || 0);

  return (
    <li>
      <div
        className="flex items-center gap-2 rounded-[var(--radius-sm)] py-1.5 pr-2 hover:bg-[var(--bg-panel-alt)] cursor-pointer"
        style={{ paddingLeft: nivelProfundidade * 20 }}
        onClick={() => filhos.length > 0 && setAberto(!aberto)}
      >
        {filhos.length > 0 ? (
          aberto ? <ChevronDown size={14} className="text-[var(--ink-soft)]" /> : <ChevronRight size={14} className="text-[var(--ink-soft)]" />
        ) : (
          <span className="w-3.5" />
        )}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--wine-soft)] text-[10px] font-semibold text-white">
          {pessoa.nome?.slice(0, 1).toUpperCase()}
        </div>
        <span className="text-sm">{pessoa.nome}</span>
        <Badge tone={nivel.cor} className="ml-1">{nivel.nome}</Badge>
        {filhos.length > 0 && <span className="text-xs text-[var(--ink-soft)]">({filhos.length})</span>}
      </div>
      {aberto && filhos.length > 0 && (
        <ul className="border-l border-[var(--line)] ml-3.5">
          {filhos.map((f) => (
            <NodoRede key={f.id} pessoa={f} porPatrocinador={porPatrocinador} nivelProfundidade={nivelProfundidade + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
