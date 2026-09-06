import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import { getToken } from "./api";

export function usePlano(ativo = true) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    if (!ativo || !getToken()) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch("/settings/plano");
      setInfo(data);
    } catch {
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo]);

  return { info, loading, recarregar: carregar };
}

export async function atualizarPlano(plano) {
  return apiFetch("/settings/plano", { method: "PATCH", body: { plano } });
}
