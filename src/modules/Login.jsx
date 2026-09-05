import { useState } from "react";
import { Leaf } from "lucide-react";
import { entrar, registar } from "../lib/auth";
import { Button, Card, Field, Input } from "../components/ui";

export default function Login({ onLogin }) {
  const [modo, setModo] = useState("entrar"); // "entrar" | "criar"
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function submeter(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      let user;
      if (modo === "entrar") {
        user = await entrar(email, password);
      } else {
        if (!nome.trim()) throw new Error("Indica o teu nome.");
        user = await registar(nome.trim(), email, password);
      }
      onLogin?.({ uid: user.id, ...user });
    } catch (err) {
      setErro(err.message || "Ocorreu um erro. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <Card className="w-full max-w-sm p-7">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-11 w-11 rounded-full bg-[var(--wine)] text-white flex items-center justify-center mb-3">
            <Leaf size={20} />
          </div>
          <h1 className="font-display text-xl text-[var(--ink)]">FM World</h1>
          <p className="text-sm text-[var(--ink-soft)]">Gestão de Negócio</p>
        </div>

        <form onSubmit={submeter} className="space-y-4">
          {modo === "criar" && (
            <Field label="Nome">
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="O teu nome" required />
            </Field>
          )}
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@exemplo.com"
              required
            />
          </Field>
          <Field label="Palavra-passe">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </Field>

          {erro && <p className="text-sm text-[var(--rust)]">{erro}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Aguarda..." : modo === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <button
          className="mt-4 w-full text-center text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]"
          onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
        >
          {modo === "entrar" ? "Ainda não tens conta? Cria uma" : "Já tens conta? Entra"}
        </button>
      </Card>
    </div>
  );
}
