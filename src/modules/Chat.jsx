import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useCollection, addItem } from "../lib/db";
import { Button, Card, EmptyState, Input, Spinner } from "../components/ui";

export default function Chat({ user }) {
  const { items, loading } = useCollection("chat", { orderByField: "criadoEm" });
  const [texto, setTexto] = useState("");
  const fimRef = useRef(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length]);

  async function enviar() {
    if (!texto.trim()) return;
    const t = texto;
    setTexto("");
    await addItem("chat", { texto: t, autorNome: user?.nome || user?.email, autorId: user?.uid });
  }

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col fm-fade-in">
      <Card className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex h-full items-center justify-center"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState title="Ainda sem mensagens" hint="Escreve à equipa abaixo." />
        ) : (
          items.map((m) => {
            const minha = m.autorId === user?.uid;
            return (
              <div key={m.id} className={`flex ${minha ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs rounded-[var(--radius-sm)] px-3 py-2 ${minha ? "bg-[var(--wine)] text-white" : "bg-[var(--bg-panel-alt)]"}`}>
                  {!minha && <p className="text-[11px] font-medium opacity-70 mb-0.5">{m.autorNome}</p>}
                  <p className="text-sm whitespace-pre-wrap">{m.texto}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={fimRef} />
      </Card>
      <div className="mt-3 flex gap-2">
        <Input
          placeholder="Escreve uma mensagem..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
        />
        <Button onClick={enviar}><Send size={16} /></Button>
      </div>
    </div>
  );
}
