import { Gem } from "lucide-react";
import { Button, Card } from "./ui";

export default function UpgradeGate({ titulo, mensagem, isAdmin, onUpgrade }) {
  return (
    <div className="flex h-[60vh] items-center justify-center fm-fade-in">
      <Card className="max-w-sm p-6 text-center space-y-3">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--brass)] text-[var(--gold)]">
          <Gem size={19} />
        </div>
        <p className="font-display text-xl">{titulo}</p>
        <p className="text-sm text-[var(--ink-soft)]">{mensagem}</p>
        {isAdmin ? (
          <Button onClick={onUpgrade} className="mx-auto">Passar a Pro</Button>
        ) : (
          <p className="text-xs text-[var(--ink-soft)]">Pede a um administrador para atualizar o plano em Administração.</p>
        )}
      </Card>
    </div>
  );
}
