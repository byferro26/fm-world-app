import { useMemo, useState } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { useCollection, addItem, removeItem } from "../lib/db";
import { CATEGORIAS_FINANCEIRAS } from "../lib/constants";
import { Badge, Button, Card, EmptyState, Field, Input, KpiCard, Modal, Select, Spinner, Textarea } from "../components/ui";

const vazio = { tipo: "Receita", categoria: CATEGORIAS_FINANCEIRAS.Receita[0], valor: "", data: new Date().toISOString().slice(0, 10), descricao: "" };

export default function Financeiro() {
  const { items, loading } = useCollection("financeiro", { orderByField: "data" });
  const [aCriar, setACriar] = useState(false);

  const ordenados = [...items].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const { receitas, despesas } = useMemo(() => {
    const hoje = new Date();
    const doMes = items.filter((i) => (i.data || "").startsWith(hoje.toISOString().slice(0, 7)));
    return {
      receitas: doMes.filter((i) => i.tipo === "Receita").reduce((s, i) => s + Number(i.valor || 0), 0),
      despesas: doMes.filter((i) => i.tipo === "Despesa").reduce((s, i) => s + Number(i.valor || 0), 0),
    };
  }, [items]);

  return (
    <div className="space-y-4 fm-fade-in">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Receitas (mês)" value={`${receitas.toFixed(2)} €`} tone="sage" icon={<TrendingUp size={18} />} />
        <KpiCard label="Despesas (mês)" value={`${despesas.toFixed(2)} €`} tone="rust" icon={<TrendingDown size={18} />} />
        <KpiCard label="Saldo (mês)" value={`${(receitas - despesas).toFixed(2)} €`} tone="wine" icon={<Scale size={18} />} />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setACriar(true)}><Plus size={16} /> Novo registo</Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Spinner /></div>
      ) : ordenados.length === 0 ? (
        <EmptyState title="Sem registos financeiros" hint="Regista receitas e despesas do negócio." />
      ) : (
        <Card className="divide-y divide-[var(--line)] overflow-hidden">
          {ordenados.map((i) => (
            <div key={i.id} className="flex items-center gap-4 px-4 py-3">
              <Badge tone={i.tipo === "Receita" ? "sage" : "rust"}>{i.tipo}</Badge>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{i.categoria}</p>
                {i.descricao && <p className="text-xs text-[var(--ink-soft)] truncate">{i.descricao}</p>}
              </div>
              <p className="text-xs text-[var(--ink-soft)] w-24">{i.data}</p>
              <p className={`font-display text-base w-24 text-right ${i.tipo === "Receita" ? "text-[var(--sage)]" : "text-[var(--rust)]"}`}>
                {i.tipo === "Receita" ? "+" : "-"}{Number(i.valor || 0).toFixed(2)} €
              </p>
              <button onClick={() => removeItem("financeiro", i.id)} className="text-[var(--ink-soft)] hover:text-[var(--rust)]">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </Card>
      )}

      {aCriar && <FinanceiroForm onClose={() => setACriar(false)} onSave={async (data) => { await addItem("financeiro", { ...data, valor: Number(data.valor) || 0 }); setACriar(false); }} />}
    </div>
  );
}

function FinanceiroForm({ onClose, onSave }) {
  const [form, setForm] = useState(vazio);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => {
    const valor = e.target.value;
    if (k === "tipo") {
      setForm({ ...form, tipo: valor, categoria: CATEGORIAS_FINANCEIRAS[valor][0] });
    } else {
      setForm({ ...form, [k]: valor });
    }
  };

  return (
    <Modal
      title="Novo registo financeiro"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={!form.valor || saving} onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <Select value={form.tipo} onChange={set("tipo")}>
              <option>Receita</option>
              <option>Despesa</option>
            </Select>
          </Field>
          <Field label="Categoria">
            <Select value={form.categoria} onChange={set("categoria")}>
              {CATEGORIAS_FINANCEIRAS[form.tipo].map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (€)"><Input type="number" step="0.01" value={form.valor} onChange={set("valor")} autoFocus /></Field>
          <Field label="Data"><Input type="date" value={form.data} onChange={set("data")} /></Field>
        </div>
        <Field label="Descrição"><Textarea value={form.descricao} onChange={set("descricao")} rows={2} /></Field>
      </div>
    </Modal>
  );
}
