import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Phone, Mail } from "lucide-react";
import { useCollection, addItem, updateItem, removeItem } from "../lib/db";
import { Badge, Button, Card, Drawer, EmptyState, Field, Input, Modal, Select, Spinner, Textarea } from "../components/ui";

const TIPOS = ["Contacto", "Cliente", "Parceiro"];
const ESTADOS = ["Por contactar", "Contactado", "Em conversa", "Convertido", "Inativo"];

const vazio = { nome: "", telefone: "", email: "", tipo: "Contacto", estado: "Por contactar", interesses: [], notas: "" };

export default function Pessoas() {
  const { items, loading } = useCollection("pessoas", { orderByField: "nome" });
  const [query, setQuery] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [aberto, setAberto] = useState(null); // pessoa selecionada (drawer)
  const [aCriar, setACriar] = useState(false);

  const filtradas = useMemo(() => {
    return items.filter((p) => {
      if (filtroTipo !== "todos" && p.tipo !== filtroTipo) return false;
      const q = query.toLowerCase();
      return !q || p.nome?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q);
    });
  }, [items, query, filtroTipo]);

  return (
    <div className="space-y-4 fm-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
          <Input className="pl-9" placeholder="Procurar por nome ou email..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select className="w-auto" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="todos">Todos os tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Button onClick={() => setACriar(true)}>
          <Plus size={16} /> Nova pessoa
        </Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Spinner /></div>
      ) : filtradas.length === 0 ? (
        <EmptyState title="Sem pessoas para mostrar" hint="Cria a primeira entrada da tua base de dados." />
      ) : (
        <Card className="divide-y divide-[var(--line)] overflow-hidden">
          {filtradas.map((p) => (
            <button
              key={p.id}
              onClick={() => setAberto(p)}
              className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-[var(--bg-panel-alt)] transition"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--wine-soft)] text-sm font-semibold text-white">
                {p.nome?.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.nome}</p>
                <p className="truncate text-xs text-[var(--ink-soft)]">{p.email || p.telefone || "—"}</p>
              </div>
              <Badge tone={p.tipo === "Parceiro" ? "wine" : p.tipo === "Cliente" ? "sage" : "neutral"}>{p.tipo}</Badge>
              <Badge tone="neutral" className="hidden sm:inline-flex">{p.estado}</Badge>
            </button>
          ))}
        </Card>
      )}

      {aCriar && (
        <PessoaForm
          initial={vazio}
          onClose={() => setACriar(false)}
          onSave={async (data) => {
            await addItem("pessoas", data);
            setACriar(false);
          }}
        />
      )}

      {aberto && (
        <Drawer title={aberto.nome} subtitle={aberto.tipo} onClose={() => setAberto(null)}>
          <PessoaDetalhe
            pessoa={aberto}
            onSave={async (data) => {
              await updateItem("pessoas", aberto.id, data);
              setAberto({ ...aberto, ...data });
            }}
            onDelete={async () => {
              await removeItem("pessoas", aberto.id);
              setAberto(null);
            }}
          />
        </Drawer>
      )}
    </div>
  );
}

function PessoaForm({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal
      title="Nova pessoa"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!form.nome || saving}
            onClick={async () => {
              setSaving(true);
              await onSave(form);
              setSaving(false);
            }}
          >
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nome"><Input value={form.nome} onChange={set("nome")} autoFocus /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone"><Input value={form.telefone} onChange={set("telefone")} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={set("email")} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <Select value={form.tipo} onChange={set("tipo")}>
              {TIPOS.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Estado">
            <Select value={form.estado} onChange={set("estado")}>
              {ESTADOS.map((e) => <option key={e}>{e}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Notas"><Textarea value={form.notas} onChange={set("notas")} rows={3} /></Field>
      </div>
    </Modal>
  );
}

function PessoaDetalhe({ pessoa, onSave, onDelete }) {
  const [form, setForm] = useState(pessoa);
  const [editando, setEditando] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (!editando) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone={form.tipo === "Parceiro" ? "wine" : "sage"}>{form.tipo}</Badge>
          <Badge tone="neutral">{form.estado}</Badge>
        </div>
        <div className="space-y-2 text-sm">
          {form.telefone && <p className="flex items-center gap-2"><Phone size={14} className="text-[var(--ink-soft)]" /> {form.telefone}</p>}
          {form.email && <p className="flex items-center gap-2"><Mail size={14} className="text-[var(--ink-soft)]" /> {form.email}</p>}
        </div>
        {form.notas && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-soft)] mb-1">Notas</p>
            <p className="text-sm whitespace-pre-wrap">{form.notas}</p>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={() => setEditando(true)}>Editar</Button>
          <Button variant="danger" onClick={onDelete}><Trash2 size={15} /> Remover</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Field label="Nome"><Input value={form.nome} onChange={set("nome")} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefone"><Input value={form.telefone} onChange={set("telefone")} /></Field>
        <Field label="Email"><Input value={form.email} onChange={set("email")} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo">
          <Select value={form.tipo} onChange={set("tipo")}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</Select>
        </Field>
        <Field label="Estado">
          <Select value={form.estado} onChange={set("estado")}>{ESTADOS.map((e) => <option key={e}>{e}</option>)}</Select>
        </Field>
      </div>
      <Field label="Notas"><Textarea value={form.notas} onChange={set("notas")} rows={4} /></Field>
      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={() => setEditando(false)}>Cancelar</Button>
        <Button onClick={async () => { await onSave(form); setEditando(false); }}>Guardar alterações</Button>
      </div>
    </div>
  );
}
