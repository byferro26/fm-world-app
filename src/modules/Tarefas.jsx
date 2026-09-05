import { useState } from "react";
import { Plus, ArrowRight, Trash2 } from "lucide-react";
import { useCollection, addItem, updateItem, removeItem } from "../lib/db";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Spinner, Textarea } from "../components/ui";

const COLUNAS = ["Por fazer", "Em curso", "Concluída"];
const PRIORIDADES = ["Baixa", "Normal", "Alta"];
const vazio = { titulo: "", estado: "Por fazer", prioridade: "Normal", notas: "" };

export default function Tarefas() {
  const { items, loading } = useCollection("tarefas");
  const [aCriar, setACriar] = useState(false);

  return (
    <div className="space-y-4 fm-fade-in">
      <div className="flex justify-end">
        <Button onClick={() => setACriar(true)}><Plus size={16} /> Nova tarefa</Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState title="Sem tarefas" hint="Cria a primeira tarefa da equipa." />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {COLUNAS.map((coluna) => {
            const tarefasColuna = items.filter((t) => t.estado === coluna);
            return (
              <div key={coluna}>
                <p className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                  {coluna}
                  <span className="rounded-full bg-[var(--bg-panel-alt)] px-2 py-0.5">{tarefasColuna.length}</span>
                </p>
                <div className="space-y-2">
                  {tarefasColuna.map((t) => (
                    <Card key={t.id} className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{t.titulo}</p>
                        <button onClick={() => removeItem("tarefas", t.id)} className="text-[var(--ink-soft)] hover:text-[var(--rust)] shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {t.notas && <p className="text-xs text-[var(--ink-soft)]">{t.notas}</p>}
                      <div className="flex items-center justify-between pt-1">
                        <Badge tone={t.prioridade === "Alta" ? "rust" : t.prioridade === "Baixa" ? "neutral" : "gold"}>
                          {t.prioridade}
                        </Badge>
                        {coluna !== "Concluída" && (
                          <button
                            className="flex items-center gap-1 text-xs text-[var(--wine)] hover:underline"
                            onClick={() => updateItem("tarefas", t.id, { estado: COLUNAS[COLUNAS.indexOf(coluna) + 1] })}
                          >
                            Avançar <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {aCriar && (
        <TarefaForm onClose={() => setACriar(false)} onSave={async (data) => { await addItem("tarefas", data); setACriar(false); }} />
      )}
    </div>
  );
}

function TarefaForm({ onClose, onSave }) {
  const [form, setForm] = useState(vazio);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal
      title="Nova tarefa"
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
          <Field label="Coluna">
            <Select value={form.estado} onChange={set("estado")}>{COLUNAS.map((c) => <option key={c}>{c}</option>)}</Select>
          </Field>
          <Field label="Prioridade">
            <Select value={form.prioridade} onChange={set("prioridade")}>{PRIORIDADES.map((p) => <option key={p}>{p}</option>)}</Select>
          </Field>
        </div>
        <Field label="Notas"><Textarea value={form.notas} onChange={set("notas")} rows={3} /></Field>
      </div>
    </Modal>
  );
}
