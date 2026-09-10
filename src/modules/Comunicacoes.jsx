import { useEffect, useMemo, useState } from "react";
import { Send, MessageCircleWarning, History } from "lucide-react";
import { useCollection } from "../lib/db";
import { estadoComunicacoes, enviarComunicacao, historicoComunicacoes } from "../lib/comunicacoes";
import { Badge, Button, Card, EmptyState, Spinner, Textarea } from "../components/ui";

const GRUPOS = ["Parceiro", "Cliente", "Contacto"];

export default function Comunicacoes() {
  const { items: pessoas, loading } = useCollection("pessoas", { orderByField: "nome" });
  const [estado, setEstado] = useState(null);
  const [gruposSelecionados, setGruposSelecionados] = useState([]);
  const [individuaisSelecionados, setIndividuaisSelecionados] = useState(new Set());
  const [mensagem, setMensagem] = useState("");
  const [aEnviar, setAEnviar] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [historico, setHistorico] = useState(null);

  useEffect(() => {
    estadoComunicacoes().then(setEstado);
    historicoComunicacoes().then(setHistorico).catch(() => {});
  }, []);

  const destinatarios = useMemo(() => {
    const porGrupo = pessoas.filter((p) => gruposSelecionados.includes(p.tipo));
    const idsGrupo = new Set(porGrupo.map((p) => p.id));
    const individuais = pessoas.filter((p) => individuaisSelecionados.has(p.id) && !idsGrupo.has(p.id));
    return [...porGrupo, ...individuais];
  }, [pessoas, gruposSelecionados, individuaisSelecionados]);

  function toggleGrupo(g) {
    setGruposSelecionados((atual) => (atual.includes(g) ? atual.filter((x) => x !== g) : [...atual, g]));
  }

  function toggleIndividual(id) {
    setIndividuaisSelecionados((atual) => {
      const novo = new Set(atual);
      novo.has(id) ? novo.delete(id) : novo.add(id);
      return novo;
    });
  }

  async function enviar() {
    setAEnviar(true);
    setResultado(null);
    try {
      const r = await enviarComunicacao(destinatarios.map((p) => p.id), mensagem);
      setResultado(r);
      setMensagem("");
      setGruposSelecionados([]);
      setIndividuaisSelecionados(new Set());
      historicoComunicacoes().then(setHistorico).catch(() => {});
    } finally {
      setAEnviar(false);
    }
  }

  if (loading || !estado) {
    return <div className="flex h-48 items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="space-y-5 fm-fade-in">
      {!estado.configurado && (
        <Card className="p-4 flex gap-3 items-start">
          <MessageCircleWarning size={18} className="text-[var(--rust)] shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--ink-soft)]">
            O envio por WhatsApp ainda não está ligado a credenciais reais — as mensagens ficam registadas mas não chegam a ninguém até isso ficar configurado.
          </p>
        </Card>
      )}

      <Card className="p-5 space-y-4">
        <div>
          <p className="text-[13px] text-[var(--ink-soft)] mb-2">Grupos</p>
          <div className="flex flex-wrap gap-2">
            {GRUPOS.map((g) => (
              <button
                key={g}
                onClick={() => toggleGrupo(g)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  gruposSelecionados.includes(g)
                    ? "bg-[var(--wine)] text-white border-transparent"
                    : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--bg-panel-alt)]"
                }`}
              >
                {g === "Parceiro" ? "Parceiros" : g === "Cliente" ? "Clientes" : "Contactos"}
                <span className="ml-1.5 opacity-60">{pessoas.filter((p) => p.tipo === g).length}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[13px] text-[var(--ink-soft)] mb-2">Ou escolhe pessoas individuais</p>
          <div className="max-h-48 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--line)] divide-y divide-[var(--line)]">
            {pessoas.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[var(--bg-panel-alt)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={individuaisSelecionados.has(p.id) || gruposSelecionados.includes(p.tipo)}
                  disabled={gruposSelecionados.includes(p.tipo)}
                  onChange={() => toggleIndividual(p.id)}
                />
                <span className="flex-1">{p.nome}</span>
                <Badge tone="neutral">{p.tipo}</Badge>
                {!p.telefone && <span className="text-[11px] text-[var(--rust)]">sem telefone</span>}
              </label>
            ))}
          </div>
        </div>

        <Textarea
          placeholder="Escreve a mensagem..."
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={4}
        />

        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--ink-soft)]">{destinatarios.length} destinatário(s) selecionado(s)</p>
          <Button onClick={enviar} disabled={aEnviar || !mensagem.trim() || destinatarios.length === 0}>
            <Send size={15} /> {aEnviar ? "A enviar..." : "Enviar por WhatsApp"}
          </Button>
        </div>

        {resultado && (
          <p className="text-sm text-[var(--sage)]">
            Registado para {resultado.destinatarios} pessoa(s)
            {resultado.configurado ? ` — ${resultado.enviadas} enviada(s)` : " — WhatsApp por configurar, nada foi enviado ainda"}
            {resultado.semTelefone > 0 && `, ${resultado.semTelefone} sem número de telefone`}.
          </p>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3 flex items-center gap-2"><History size={17} /> Histórico</h3>
        {!historico?.length ? (
          <EmptyState title="Ainda sem comunicações enviadas" />
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {historico.map((h) => (
              <div key={h.id} className="py-2.5">
                <p className="text-sm">{h.mensagem}</p>
                <p className="text-xs text-[var(--ink-soft)] mt-1">
                  {h.destinatarios} destinatário(s) · {h.enviadas} enviada(s)
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
