import { useEffect, useState } from "react";
import { apiFetch } from "./api";

// Pequeno "pub-sub" em memória: quando qualquer parte da app altera uma coleção,
// todas as instâncias de useCollection() para essa coleção atualizam de imediato.
// Outros browsers/dispositivos recebem a mudança no próximo ciclo de polling.
const listeners = new Map();
function subscribe(name, fn) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(fn);
  return () => listeners.get(name)?.delete(fn);
}
function notify(name) {
  listeners.get(name)?.forEach((fn) => fn());
}

const POLL_MS = 3000;

export function useCollection(name, { orderByField } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await apiFetch(`/collections/${name}`);
        if (cancelled) return;
        const ordenado = orderByField
          ? [...data].sort((a, b) => String(a[orderByField] || "").localeCompare(String(b[orderByField] || "")))
          : data;
        setItems(ordenado);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e);
          setLoading(false);
        }
      }
    }

    load();
    const interval = setInterval(load, POLL_MS);
    const unsubscribe = subscribe(name, load);
    return () => {
      cancelled = true;
      clearInterval(interval);
      unsubscribe();
    };
  }, [name, orderByField]);

  return { items, loading, error };
}

export async function addItem(name, data) {
  const result = await apiFetch(`/collections/${name}`, { method: "POST", body: data });
  notify(name);
  return result;
}

export async function updateItem(name, id, data) {
  const result = await apiFetch(`/collections/${name}/${id}`, { method: "PATCH", body: data });
  notify(name);
  return result;
}

export async function removeItem(name, id) {
  const result = await apiFetch(`/collections/${name}/${id}`, { method: "DELETE" });
  notify(name);
  return result;
}

// Cria uma venda e dá baixa ao stock dos produtos, tudo numa única transação no servidor.
export async function criarVendaComStock(venda) {
  const result = await apiFetch(`/vendas-com-stock`, { method: "POST", body: venda });
  notify("vendas");
  notify("produtos");
  return result;
}
