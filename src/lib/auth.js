import { apiFetch, getToken, setToken } from "./api";

export async function entrar(email, password) {
  const { token, user } = await apiFetch("/auth/login", { method: "POST", body: { email, password } });
  setToken(token);
  return user;
}

export async function registar(nome, email, password) {
  const { token, user } = await apiFetch("/auth/register", { method: "POST", body: { nome, email, password } });
  setToken(token);
  return user;
}

export async function pedirRecuperacao(email) {
  await apiFetch("/auth/request-reset", { method: "POST", body: { email } });
}

export async function sair() {
  setToken(null);
}

// Mantém a mesma assinatura da versão anterior (Firebase) para não obrigar a mudar o App.jsx:
// devolve uma função de "unsubscribe" e chama callback(null | user).
export function watchAuth(callback) {
  let cancelled = false;
  (async () => {
    const token = getToken();
    if (!token) {
      if (!cancelled) callback(null);
      return;
    }
    try {
      const { user } = await apiFetch("/auth/me");
      if (!cancelled) callback({ uid: user.id, ...user });
    } catch {
      setToken(null);
      if (!cancelled) callback(null);
    }
  })();
  return () => {
    cancelled = true;
  };
}
