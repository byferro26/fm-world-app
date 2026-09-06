import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useCollection, updateItem, removeItem, criarVendaComStock } from "../lib/db";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Spinner } from "../components/ui";

const ESTADOS = ["Pendente", "Pago", "Entregue", "Cancelada"];

export default function Vendas() {
  const { items: vendas, loading } = useCollection("vendas", { orderByField: "data" });
  const { items: pessoas } = useCollection("pessoas", { orderByField: "nome" });
  const { items: produtos } = useCollection("produtos");
  const [aCriar, setACriar] = useState(false);

  const vendasOrdenadas = [...vendas].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const pessoaNome = (id) => pessoas.find((p) => p.id === id)?.nome || "—";

  return (
    <div className="space-y-4 fm-fade-in">
      <div className="flex justify-end">
        <Button onClick={() => setACriar(true)} disabled={produtos.length === 0}>
          <Plus size={16} /> Nova venda
        </Button>
      </div>
      {produtos.length === 0 && (
        <p className="text-xs text-[var(--ink-soft)]">Cria primeiro produtos no catálogo para poderes registar vendas.</p>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Spinner /></div>
      ) : vendasOrdenadas.length === 0 ? (
        <EmptyState title="Sem vendas registadas" hint="Regista encomendas e acompanha o estado de cada uma." />
      ) : (
        <Card className="divide-y divide-[var(--line)] overflow-hidden">
          {vendasOrdenadas.map((v) => (
            <div key={v.id} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{pessoaNome(v.pessoaId)}</p>
                <p className="text-xs text-[var(--ink-soft)]">{v.data} · {(v.itens || []).length} artigo(s)</p>
              </div>
              <p className="font-display text-base w-20 text-right">{Number(v.total || 0).toFixed(2)} €</p>
              <Select
                className="w-auto text-xs py-1"
                value={v.estado}
                onChange={(e) => updateItem("vendas", v.id, { estado: e.target.value })}
              >
                {ESTADOS.map((e) => <option key={e}>{e}</option>)}
              </Select>
              <button onClick={() => removeItem("vendas", v.id)} className="text-[var(--ink-soft)] hover:text-[var(--rust)]">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </Card>
      )}

      {aCriar && <VendaForm pessoas={pessoas} produtos={produtos} onClose={() => setACriar(false)} />}
    </div>
  );
}

function VendaForm({ pessoas, produtos, onClose }) {
  const [pessoaId, setPessoaId] = useState(pessoas[0]?.id || "");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [linhas, setLinhas] = useState([{ produtoId: produtos[0]?.id || "", quantidade: 1 }]);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const total = useMemo(() => {
    return linhas.reduce((soma, l) => {
      const p = produtos.find((pr) => pr.id === l.produtoId);
      return soma + (p ? Number(p.preco) * Number(l.quantidade || 0) : 0);
    }, 0);
  }, [linhas, produtos]);

  function atualizarLinha(i, campo, valor) {
    const novas = [...linhas];
    novas[i] = { ...novas[i], [campo]: valor };
    setLinhas(novas);
  }

  async function guardar() {
    setErro("");
    for (const l of linhas) {
      const p = produtos.find((pr) => pr.id === l.produtoId);
      if (p && Number(l.quantidade) > Number(p.stock)) {
        setErro(`Stock insuficiente de "${p.nome}" (disponível: ${p.stock}).`);
        return;
      }
    }
    setSaving(true);
    try {
      const itens = linhas.map((l) => {
        const p = produtos.find((pr) => pr.id === l.produtoId);
        return { produtoId: l.produtoId, nome: p?.nome, quantidade: Number(l.quantidade), preco: Number(p?.preco || 0) };
      });
      await criarVendaComStock({ pessoaId, data, itens, total, estado: "Pendente" });
      onClose();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Nova venda"
      width="max-w-xl"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={!pessoaId || saving} onClick={guardar}>Registar venda</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pessoa">
            <Select value={pessoaId} onChange={(e) => setPessoaId(e.target.value)}>
              {pessoas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </Select>
          </Field>
          <Field label="Data"><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></Field>
        </div>

        <div>
          <p className="text-[13px] text-[var(--ink-soft)] mb-2">Artigos</p>
          <div className="space-y-2">
            {linhas.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select className="flex-1" value={l.produtoId} onChange={(e) => atualizarLinha(i, "produtoId", e.target.value)}>
                  {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome} — {Number(p.preco).toFixed(2)} €</option>)}
                </Select>
                <Input
                  type="number"
                  min="1"
                  className="w-20"
                  value={l.quantidade}
                  onChange={(e) => atualizarLinha(i, "quantidade", e.target.value)}
                />
                <button
                  onClick={() => setLinhas(linhas.filter((_, idx) => idx !== i))}
                  disabled={linhas.length === 1}
                  className="text-[var(--ink-soft)] hover:text-[var(--rust)] disabled:opacity-30"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            className="mt-2 text-xs text-[var(--wine)] hover:underline"
            onClick={() => setLinhas([...linhas, { produtoId: produtos[0]?.id || "", quantidade: 1 }])}
          >
            + adicionar artigo
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--line)] pt-3">
          <span className="text-sm text-[var(--ink-soft)]">Total</span>
          <span className="font-display text-xl">{total.toFixed(2)} €</span>
        </div>

        {erro && <p className="text-sm text-[var(--rust)]">{erro}</p>}
      </div>
    </Modal>
  );
}
