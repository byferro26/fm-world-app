import { Moon, Sun, Monitor } from "lucide-react";
import { Badge, Button, Card, Field } from "../components/ui";

export default function Definicoes({ user, theme, onSetTheme }) {
  return (
    <div className="max-w-lg space-y-5 fm-fade-in">
      <Card className="p-5 space-y-4">
        <h3 className="font-display text-base">Conta</h3>
        <div className="text-sm space-y-1">
          <p><span className="text-[var(--ink-soft)]">Nome: </span>{user?.nome || "—"}</p>
          <p><span className="text-[var(--ink-soft)]">Email: </span>{user?.email}</p>
          <p className="flex items-center gap-2">
            <span className="text-[var(--ink-soft)]">Papel: </span>
            <Badge tone={user?.papel === "admin" ? "wine" : "neutral"}>{user?.papel || "parceiro"}</Badge>
          </p>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="font-display text-base">Aparência</h3>
        <Field label="Tema">
          <div className="flex gap-2">
            {[
              { id: "light", label: "Claro", icon: Sun },
              { id: "dark", label: "Escuro", icon: Moon },
              { id: "system", label: "Sistema", icon: Monitor },
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <Button
                  key={opt.id}
                  variant={theme === opt.id ? "primary" : "secondary"}
                  onClick={() => onSetTheme(opt.id)}
                  className="flex-1"
                >
                  <Icon size={15} /> {opt.label}
                </Button>
              );
            })}
          </div>
        </Field>
      </Card>

      <Card className="p-5 space-y-2">
        <h3 className="font-display text-base">Base de dados</h3>
        <p className="text-sm text-[var(--ink-soft)]">
          Ligado ao Postgres no Railway — os dados são partilhados em tempo quase real (poucos segundos) com toda a equipa, em qualquer dispositivo.
        </p>
      </Card>
    </div>
  );
}
