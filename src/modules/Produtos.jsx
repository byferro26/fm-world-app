import { useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { useCollection, addItem, updateItem, removeItem } from "../lib/db";
import { CATEGORIAS_PRODUTO } from "../lib/constants";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Spinner } from "../components/ui";

const vazio = { nome: "", categoria: "Perfumaria", preco: "", stock: "", stockMinimo: "5" };

export default function Produtos() {
  const { items, loading } = useCollection("produtos", { orderByField: "nome" });
  const [aCriar, setACriar] = useState(false);
  const [aEditar, setAEditar] = useState(null);

  return (
    <div className="space-y-4 fm-fade-in">
      <div className="flex justify-end">
        <Button onClick={() => setACriar(true)}><Plus size={16} /> Novo produto</Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState title="Sem produtos" hint="Cria o catálogo Perfumaria, Cosmética, Nutricode e Casa e Corpo." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => {
            const semStock = Number(p.stock) <= Number(p.stockMinimo || 0);
            return (
              <Card key={p.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{p.nome}</p>
                    <Badge tone="neutral" className="mt-1">{p.categoria}</Badge>
                  </div>
                  <button onClick={() => removeItem("produtos", p.id)} className="text-[var(--ink-soft)] hover:text-[var(--rust)]">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-[var(--ink-soft)]">Preço</p>
                    <p className="font-display text-lg">{Number(p.preco || 0).toFixed(2)} €</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--ink-soft)]">Stock</p>
                    <p className={`font-display text-lg ${semStock ? "text-[var(--rust)]" : ""}`}>{p.stock ?? 0}</p>
                  </div>
                </div>
                {semStock && (
                  <p className="flex items-center gap-1 text-xs text-[var(--rust)]">
                    <AlertTriangle size={12} /> Stock baixo — repor em breve
                  </p>
                )}
                <button onClick={() => setAEditar(p)} className="text-xs text-[var(--wine)] hover:underline">
                  Editar / ajustar stock
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {aCriar && (
        <ProdutoForm
          initial={vazio}
          titulo="Novo produto"
          onClose={() => setACriar(false)}
          onSave={async (data) => { await addItem("produtos", normalizar(data)); setACriar(false); }}
        />
      )}
      {aEditar && (
        <ProdutoForm
          initial={aEditar}
          titulo="Editar produto"
          onClose={() => setAEditar(null)}
          onSave={async (data) => { await updateItem("produtos", aEditar.id, normalizar(data)); setAEditar(null); }}
        />
      )}
    </div>
  );
}

function normalizar(data) {
  return { ...data, preco: Number(data.preco) || 0, stock: Number(data.stock) || 0, stockMinimo: Number(data.stockMinimo) || 0 };
}

function ProdutoForm({ initial, titulo, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal
      title={titulo}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={!form.nome || saving} onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nome"><Input value={form.nome} onChange={set("nome")} autoFocus /></Field>
        <Field label="Categoria">
          <Select value={form.categoria} onChange={set("categoria")}>
            {CATEGORIAS_PRODUTO.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Preço (€)"><Input type="number" step="0.01" value={form.preco} onChange={set("preco")} /></Field>
          <Field label="Stock atual"><Input type="number" value={form.stock} onChange={set("stock")} /></Field>
          <Field label="Stock mínimo"><Input type="number" value={form.stockMinimo} onChange={set("stockMinimo")} /></Field>
        </div>
      </div>
    </Modal>
  );
}
