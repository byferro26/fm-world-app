import { apiFetch } from "./api";

export async function listarUtilizadores() {
  return apiFetch("/admin/users");
}

export async function atualizarUtilizador(id, data) {
  return apiFetch(`/admin/users/${id}`, { method: "PATCH", body: data });
}

export async function reporPassword(id, novaPassword) {
  return apiFetch(`/admin/users/${id}/reset-password`, { method: "POST", body: { novaPassword } });
}

export async function removerUtilizador(id) {
  return apiFetch(`/admin/users/${id}`, { method: "DELETE" });
}

export async function listarPedidosReposicao() {
  return apiFetch("/admin/reset-requests");
}

export async function dispensarPedidoReposicao(id) {
  return apiFetch(`/admin/reset-requests/${id}`, { method: "DELETE" });
}
