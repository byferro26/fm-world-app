import { apiFetch } from "./api";

export async function estadoComunicacoes() {
  return apiFetch("/comunicacoes/estado");
}

export async function enviarComunicacao(destinatarioIds, mensagem) {
  return apiFetch("/comunicacoes/enviar", { method: "POST", body: { destinatarioIds, mensagem } });
}

export async function historicoComunicacoes() {
  return apiFetch("/comunicacoes/historico");
}
