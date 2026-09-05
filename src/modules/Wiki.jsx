import { useMemo, useState } from "react";
import { Plus, Trash2, ExternalLink, Search } from "lucide-react";
import { useCollection, addItem, updateItem, removeItem } from "../lib/db";
import { TIPOS_DOCUMENTO, VISIBILIDADE_DOCUMENTO, CATEGORIAS_PRODUTO } from "../lib/constants";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Spinner, Textarea } from "../components/ui";

const vazio = { titulo: "", tipoConteudo: "Documento", produtos: [], categoria: "Interno", link: "", notas: "" };

export default function Wiki() {
  const { items, loading } = useCollection("documentos", { orderByField: "titulo" });
  const [query, setQuery] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroProduto, setFiltroProduto] = useState("todos");
  const [aCriar, setACriar] = useState(false);
  const [aEditar, setAEditar] = useState(null);

  const filtrados = useMemo(() => {
    return items.filter((d) => {
      if (filtroTipo !== "todos" && (d.tipoConteudo || "Documento") !== filtroTipo) return false;
      if (filtroProduto !== "todos" && !(d.produtos || []).includes(filtroProduto)) return false;
      const q = query.toLowerCase();
      return !q || d.titulo?.toLowerCase().includes(q);
    });
  }, [items, query, filtroTipo, filtroProduto]);

  return (
    <div className="space-y-4 fm-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
          <Input className="pl-9" placeholder="Procurar documentos..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select className="w-auto" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="todos">Todos os tipos</option>
          {TIPOS_DOCUMENTO.map((t) => <option key={t}>{t}</option>)}
        </Select>
        <Select className="w-auto" value={filtroProduto} onChange={(e) => setFiltroProduto(e.target.value)}>
          <option value="todos">Todos os produtos</option>
          {CATEGORIAS_PRODUTO.map((p) => <option key={p}>{p}</option>)}
        </Select>
        <Button onClick={() => setACriar(true)}><Plus size={16} /> Novo documento</Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Spinner /></div>
      ) : filtrados.length === 0 ? (
        <EmptyState title="Sem documentos" hint="Junta apresentações, formações, vídeos e materiais da equipa." />
      ) : (
        <Card className="divide-y divide-[var(--line)] overflow-hidden">
          {filtrados.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--bg-panel-alt)]" onClick={() => setAEditar(d)}>
              <Badge tone="neutral">{d.categoria}</Badge>
              <Badge tone="gold">{d.tipoConteudo || "Documento"}</Badge>
              {(d.produtos || []).map((p) => <Badge key={p} tone="wine">{p}</Badge>)}
              <p className="flex-1 min-w-0 truncate text-sm font-medium">{d.titulo}</p>
              {d.link && (
                <a href={d.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[var(--ink-soft)] hover:text-[var(--wine)]">
                  <ExternalLink size={15} />
                </a>
              )}
              <button onClick={(e) => { e.stopPropagation(); removeItem("documentos", d.id); }} className="text-[var(--ink-soft)] hover:text-[var(--rust)]">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </Card>
      )}

      {aCriar && (
        <DocForm titulo="Novo documento" initial={vazio} onClose={() => setACriar(false)} onSave={async (data) => { await addItem("documentos", data); setACriar(false); }} />
      )}
      {aEditar && (
        <DocForm titulo="Editar documento" initial={aEditar} onClose={() => setAEditar(null)} onSave={async (data) => { await updateItem("documentos", aEditar.id, data); setAEditar(null); }} />
      )}
    </div>
  );
}

function DocForm({ titulo, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function toggleProduto(p) {
    const atual = form.produtos || [];
    setForm({ ...form, produtos: atual.includes(p) ? atual.filter((x) => x !== p) : [...atual, p] });
  }

  return (
    <Modal
      title={titulo}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={!form.titulo || saving} onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Título"><Input value={form.titulo} onChange={set("titulo")} autoFocus /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo de conteúdo">
            <Select value={form.tipoConteudo} onChange={set("tipoConteudo")}>{TIPOS_DOCUMENTO.map((t) => <option key={t}>{t}</option>)}</Select>
          </Field>
          <Field label="Visibilidade">
            <Select value={form.categoria} onChange={set("categoria")}>{VISIBILIDADE_DOCUMENTO.map((v) => <option key={v}>{v}</option>)}</Select>
          </Field>
        </div>
        <Field label="Produtos relacionados">
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS_PRODUTO.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => toggleProduto(p)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  (form.produtos || []).includes(p)
                    ? "bg-[var(--wine)] text-white border-transparent"
                    : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--bg-panel-alt)]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Link (opcional)"><Input value={form.link} onChange={set("link")} placeholder="https://..." /></Field>
        <Field label="Notas"><Textarea value={form.notas} onChange={set("notas")} rows={3} /></Field>
      </div>
    </Modal>
  );
}
