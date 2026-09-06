import { useEffect, useState } from "react";
import { KeyRound, Trash2, ShieldCheck, Inbox, Gem, Check, Database } from "lucide-react";
import {
  listarUtilizadores,
  atualizarUtilizador,
  reporPassword,
  removerUtilizador,
  listarPedidosReposicao,
  dispensarPedidoReposicao,
  estadoDadosTeste,
  gerarDadosTeste,
} from "../lib/admin";
import { atualizarPlano } from "../lib/plano";
import { Badge, Button, Card, EmptyState, Modal, Select, Spinner } from "../components/ui";

export default function Administracao({ user, plano, onPlanoChange }) {
  const [utilizadores, setUtilizadores] = useState(null);
  const [pedidos, setPedidos] = useState(null);
  const [resetAlvo, setResetAlvo] = useState(null); // { id, nome } | null
  const [novaPassword, setNovaPassword] = useState(null); // string mostrada uma vez
  const [temDados, setTemDados] = useState(null);
  const [aGerar, setAGerar] = useState(false);
  const [resumoGerado, setResumoGerado] = useState(null);

  useEffect(() => {
    estadoDadosTeste().then((r) => setTemDados(r.jaTemDados));
  }, []);

  async function correrSeed() {
    setAGerar(true);
    try {
      const r = await gerarDadosTeste();
      setResumoGerado(r.resumo);
      setTemDados(true);
    } finally {
      setAGerar(false);
    }
  }

  async function carregar() {
    try {
      const [u, p] = await Promise.all([listarUtilizadores(), listarPedidosReposicao()]);
      setUtilizadores(u);
      setPedidos(p.filter((r) => r.estado !== "Resolvido"));
    } catch (e) {
      console.error("Erro ao carregar administração:", e);
    }
  }

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 5000);
    return () => clearInterval(t);
  }, []);

  async function mudarPapel(id, papel) {
    await atualizarUtilizador(id, { papel });
    carregar();
  }

  async function confirmarReset(novaPasswordEscolhida) {
    const r = await reporPassword(resetAlvo.id, novaPasswordEscolhida || undefined);
    setNovaPassword(r.password);
    setResetAlvo(null);
    carregar();
  }

  async function apagar(id) {
    if (!confirm("Remover esta conta? Esta ação não pode ser desfeita.")) return;
    await removerUtilizador(id);
    carregar();
  }

  async function mudarPlano(novo) {
    await atualizarPlano(novo);
    onPlanoChange?.();
  }

  if (!utilizadores) {
    return <div className="flex h-48 items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="space-y-6 fm-fade-in">
      <PlanoCard plano={plano} onMudar={mudarPlano} />

      <Card className="p-5">
        <h3 className="font-display text-lg mb-2 flex items-center gap-2">
          <Database size={18} /> Dados de teste
        </h3>
        <p className="text-sm text-[var(--ink-soft)] mb-3">
          Preenche todos os módulos (Pessoas, Produtos, Vendas, Financeiro, Agenda, Tarefas, Documentos, Chat) com exemplos realistas, incluindo uma pequena rede de parceiros já ligada por patrocinador — útil para veres cada ecrã preenchido antes de começares a introduzir dados reais.
        </p>
        <Button variant="secondary" onClick={correrSeed} disabled={aGerar}>
          {aGerar ? "A gerar..." : temDados ? "Gerar mais dados de exemplo" : "Gerar dados de teste"}
        </Button>
        {temDados === true && !resumoGerado && (
          <p className="text-xs text-[var(--ink-soft)] mt-2">Já existem dados nalgumas coleções — podes gerar mais na mesma, sem apagar o que já lá está.</p>
        )}
        {resumoGerado && (
          <p className="text-xs text-[var(--sage)] mt-2">
            Criado: {Object.entries(resumoGerado).map(([k, v]) => `${v} ${k}`).join(", ")}.
          </p>
        )}
      </Card>

      {pedidos?.length > 0 && (
        <Card className="p-5">
          <h3 className="font-display text-lg mb-3 flex items-center gap-2">
            <Inbox size={18} /> Pedidos de reposição de password
          </h3>
          <div className="space-y-2">
            {pedidos.map((p) => {
              const u = utilizadores.find((x) => x.id === p.userId);
              return (
                <div key={p.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--line)] px-3 py-2">
                  <span className="text-sm">{u?.nome || p.email}</span>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setResetAlvo(u || { id: p.userId, nome: p.email })}>
                      <KeyRound size={14} /> Repor password
                    </Button>
                    <Button variant="ghost" onClick={() => dispensarPedidoReposicao(p.id).then(carregar)}>Dispensar</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3 flex items-center gap-2">
          <ShieldCheck size={18} /> Utilizadores ({utilizadores.length})
        </h3>
        <div className="divide-y divide-[var(--line)]">
          {utilizadores.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--wine-soft)] text-xs font-semibold text-white">
                {u.nome?.slice(0, 1).toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.nome}{u.id === user?.uid && <span className="text-[var(--ink-soft)] font-normal"> (tu)</span>}</p>
                <p className="truncate text-xs text-[var(--ink-soft)]">{u.email}</p>
              </div>
              <Select
                className="w-auto text-xs py-1"
                value={u.papel}
                disabled={u.id === user?.uid}
                onChange={(e) => mudarPapel(u.id, e.target.value)}
              >
                <option value="parceiro">Parceiro</option>
                <option value="admin">Admin</option>
              </Select>
              <Button variant="ghost" onClick={() => setResetAlvo(u)} title="Repor password">
                <KeyRound size={15} />
              </Button>
              <Button variant="ghost" onClick={() => apagar(u.id)} disabled={u.id === user?.uid} title="Remover">
                <Trash2 size={15} className="text-[var(--rust)]" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {resetAlvo && (
        <ResetModal alvo={resetAlvo} onClose={() => setResetAlvo(null)} onConfirm={confirmarReset} />
      )}

      {novaPassword && (
        <Modal title="Nova palavra-passe" onClose={() => setNovaPassword(null)} footer={<Button onClick={() => setNovaPassword(null)}>Fechar</Button>}>
          <p className="text-sm text-[var(--ink-soft)] mb-3">
            Envia esta palavra-passe temporária à pessoa por um canal seguro. Só é mostrada uma vez.
          </p>
          <p className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-center font-mono text-lg tracking-wider select-all">
            {novaPassword}
          </p>
        </Modal>
      )}
    </div>
  );
}

function PlanoCard({ plano, onMudar }) {
  if (!plano) return null;
  const isFree = plano.plano === "free";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg flex items-center gap-2">
          <Gem size={18} /> Plano
        </h3>
        <Badge tone={isFree ? "neutral" : "gold"}>{isFree ? "Gratuito" : "Pro"}</Badge>
      </div>

      {isFree && (
        <div className="space-y-3 mb-4">
          {Object.entries(plano.limites || {}).map(([nome, limite]) => {
            const usado = plano.contagens?.[nome] ?? 0;
            const pct = Math.min(100, Math.round((usado / limite) * 100));
            return (
              <div key={nome}>
                <div className="flex items-center justify-between text-xs text-[var(--ink-soft)] mb-1">
                  <span className="capitalize">{nome}</span>
                  <span>{usado} / {limite}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--bg-panel-alt)] overflow-hidden">
                  <div className="h-full bg-[var(--gold)]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-[var(--ink-soft)]">Chat e Documentos ficam disponíveis a partir do plano Pro.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div className={`rounded-[var(--radius-sm)] border p-3 ${isFree ? "border-[var(--wine)]" : "border-[var(--line)]"}`}>
          <p className="font-medium text-sm flex items-center gap-1.5">{isFree && <Check size={14} className="text-[var(--wine)]" />} Gratuito</p>
          <p className="text-xs text-[var(--ink-soft)] mt-1">Até {plano.limites?.pessoas} pessoas, {plano.limites?.produtos} produtos. Sem Chat nem Documentos.</p>
          {!isFree && <Button variant="secondary" className="mt-2 w-full" onClick={() => onMudar("free")}>Voltar ao gratuito</Button>}
        </div>
        <div className={`rounded-[var(--radius-sm)] border p-3 ${!isFree ? "border-[var(--wine)]" : "border-[var(--line)]"}`}>
          <p className="font-medium text-sm flex items-center gap-1.5">{!isFree && <Check size={14} className="text-[var(--wine)]" />} Pro</p>
          <p className="text-xs text-[var(--ink-soft)] mt-1">Sem limites de registos, com Chat e Documentos incluídos.</p>
          {isFree && <Button className="mt-2 w-full" onClick={() => onMudar("pro")}>Passar a Pro</Button>}
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--ink-soft)]">
        Isto ainda não está ligado a um processador de pagamentos real — a mudança de plano aqui é imediata e sem cobrança. Para pagamentos a sério, é preciso ligar uma conta Stripe (ou semelhante).
      </p>
    </Card>
  );
}

function ResetModal({ alvo, onClose, onConfirm }) {
  const [valor, setValor] = useState("");
  return (
    <Modal
      title={`Repor password — ${alvo.nome}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onConfirm(valor)}>Repor</Button>
        </>
      }
    >
      <p className="text-sm text-[var(--ink-soft)] mb-3">
        Escreve uma palavra-passe nova, ou deixa em branco para gerar uma automaticamente.
      </p>
      <input
        className="w-full rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--wine-soft)]"
        placeholder="Gerar automaticamente"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        minLength={6}
      />
    </Modal>
  );
}
