import { useState } from "react";
import { Droplet } from "lucide-react";
import { entrar, registar, pedirRecuperacao } from "../lib/auth";
import { Button, Card, Field, Input } from "../components/ui";

export default function Login({ onLogin }) {
  const [modo, setModo] = useState("entrar"); // "entrar" | "criar" | "recuperar"
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [loading, setLoading] = useState(false);

  async function submeter(e) {
    e.preventDefault();
    setErro("");
    setAviso("");
    setLoading(true);
    try {
      if (modo === "recuperar") {
        await pedirRecuperacao(email);
        setAviso("Pedido enviado. Um administrador vai repor a tua palavra-passe em breve.");
        return;
      }
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
          <div className="h-11 w-11 rounded-full border-2 border-[var(--brass)] bg-[var(--wine)] text-white flex items-center justify-center mb-3">
            <Droplet size={19} />
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
          {modo !== "recuperar" && (
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
          )}

          {modo === "entrar" && (
            <button
              type="button"
              className="block text-xs text-[var(--ink-soft)] hover:text-[var(--wine)] -mt-2"
              onClick={() => { setModo("recuperar"); setErro(""); setAviso(""); }}
            >
              Esqueceste-te da palavra-passe?
            </button>
          )}

          {erro && <p className="text-sm text-[var(--rust)]">{erro}</p>}
          {aviso && <p className="text-sm text-[var(--sage)]">{aviso}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Aguarda..." : modo === "entrar" ? "Entrar" : modo === "criar" ? "Criar conta" : "Pedir reposição"}
          </Button>
        </form>

        <button
          className="mt-4 w-full text-center text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]"
          onClick={() => { setModo(modo === "entrar" ? "criar" : "entrar"); setErro(""); setAviso(""); }}
        >
          {modo === "criar" ? "Já tens conta? Entra" : modo === "recuperar" ? "Voltar a entrar" : "Ainda não tens conta? Cria uma"}
        </button>
      </Card>
    </div>
  );
}
