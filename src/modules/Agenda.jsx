import { useMemo, useState } from "react";
import { Plus, Trash2, Clock, MapPin } from "lucide-react";
import { useCollection, addItem, removeItem, updateItem } from "../lib/db";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Spinner, Textarea } from "../components/ui";

const TIPOS = ["Reunião", "Formação", "Evento", "Chamada", "Sessão com Cliente", "Entrega", "Outro"];
const ESTADOS = ["Agendado", "Confirmado", "Concluído", "Cancelado"];
const vazio = { titulo: "", tipo: "Reunião", data: new Date().toISOString().slice(0, 10), hora: "", local: "", estado: "Agendado", notas: "" };

export default function Agenda() {
  const { items, loading } = useCollection("agenda", { orderByField: "data" });
  const [aCriar, setACriar] = useState(false);

  const grupos = useMemo(() => {
    const map = new Map();
    for (const a of items) {
      const key = a.data || "Sem data";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    return [...map.entries()];
  }, [items]);

  const hojeStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4 fm-fade-in">
      <div className="flex justify-end">
        <Button onClick={() => setACriar(true)}><Plus size={16} /> Novo compromisso</Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Spinner /></div>
      ) : grupos.length === 0 ? (
        <EmptyState title="Sem compromissos" hint="Agenda reuniões, formações e entregas." />
      ) : (
        <div className="space-y-5">
          {grupos.map(([data, eventos]) => (
            <div key={data}>
              <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${data === hojeStr ? "text-[var(--wine)]" : "text-[var(--ink-soft)]"}`}>
                {formatarData(data)} {data === hojeStr && "· Hoje"}
              </p>
              <Card className="divide-y divide-[var(--line)] overflow-hidden">
                {eventos.map((a) => (
                  <div key={a.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{a.titulo}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[var(--ink-soft)]">
                        {a.hora && <span className="flex items-center gap-1"><Clock size={12} /> {a.hora}</span>}
                        {a.local && <span className="flex items-center gap-1"><MapPin size={12} /> {a.local}</span>}
                      </div>
                    </div>
                    <Badge tone="wine">{a.tipo}</Badge>
                    <Select
                      className="w-auto text-xs py-1"
                      value={a.estado}
                      onChange={(e) => updateItem("agenda", a.id, { estado: e.target.value })}
                    >
                      {ESTADOS.map((e) => <option key={e}>{e}</option>)}
                    </Select>
                    <button onClick={() => removeItem("agenda", a.id)} className="text-[var(--ink-soft)] hover:text-[var(--rust)]">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}

      {aCriar && (
        <AgendaForm
          onClose={() => setACriar(false)}
          onSave={async (data) => { await addItem("agenda", data); setACriar(false); }}
        />
      )}
    </div>
  );
}

function formatarData(iso) {
  if (iso === "Sem data") return iso;
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
  } catch {
    return iso;
  }
}

function AgendaForm({ onClose, onSave }) {
  const [form, setForm] = useState(vazio);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal
      title="Novo compromisso"
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
          <Field label="Data"><Input type="date" value={form.data} onChange={set("data")} /></Field>
          <Field label="Hora"><Input type="time" value={form.hora} onChange={set("hora")} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <Select value={form.tipo} onChange={set("tipo")}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</Select>
          </Field>
          <Field label="Local ou link"><Input value={form.local} onChange={set("local")} /></Field>
        </div>
        <Field label="Notas"><Textarea value={form.notas} onChange={set("notas")} rows={3} /></Field>
      </div>
    </Modal>
  );
}
