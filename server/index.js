import express from "express";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { pool, migrate } from "./db.js";
import { registerUser, loginUser, signToken, authMiddleware, requireAdmin } from "./auth.js";
import { jaTemDados, seedDados } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const COLLECTIONS = ["pessoas", "produtos", "vendas", "financeiro", "agenda", "tarefas", "documentos", "chat"];
const PLANO_ID = "00000000-0000-0000-0000-000000000001";
const LIMITES_FREE = { pessoas: 15, produtos: 5 };
const MODULOS_PRO = ["chat", "documentos"];

async function obterPlano() {
  const r = await pool.query("SELECT data FROM documents WHERE collection='settings' AND id=$1", [PLANO_ID]);
  return r.rows[0]?.data?.plano || "free";
}

function checkCollection(req, res, next) {
  if (!COLLECTIONS.includes(req.params.name)) return res.status(404).json({ error: "unknown_collection" });
  next();
}

// ---------- Auth ----------
app.post("/api/auth/register", async (req, res) => {
  try {
    const { nome, email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email e palavra-passe são obrigatórios." });
    if (String(password).length < 6) return res.status(400).json({ error: "A palavra-passe deve ter pelo menos 6 caracteres." });
    const user = await registerUser({ nome, email, password });
    res.json({ token: signToken(user), user });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Já existe uma conta com este email." });
    console.error(e);
    res.status(500).json({ error: "Erro ao criar conta." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await loginUser({ email, password });
    res.json({ token: signToken(user), user: { id: user.id, email: user.email, nome: user.nome, papel: user.papel } });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Erro ao entrar." });
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  const r = await pool.query("SELECT id, email, nome, papel FROM users WHERE id=$1", [req.auth.uid]);
  if (!r.rows[0]) return res.status(404).json({ error: "not_found" });
  res.json({ user: r.rows[0] });
});

// Pedido de reposição de password: sem servidor de email disponível, o pedido
// fica visível para um administrador tratar em Administração → Pedidos de acesso.
app.post("/api/auth/request-reset", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Indica o teu email." });
  const userRes = await pool.query("SELECT id FROM users WHERE email=$1", [String(email).toLowerCase().trim()]);
  if (!userRes.rows[0]) {
    // Não revela se o email existe ou não.
    return res.json({ ok: true });
  }
  const id = crypto.randomUUID();
  await pool.query("INSERT INTO documents (collection, id, data) VALUES ('reset_requests',$1,$2)", [
    id,
    { email: String(email).toLowerCase().trim(), userId: userRes.rows[0].id, estado: "Pendente" },
  ]);
  res.json({ ok: true });
});

// ---------- Administração (apenas admin) ----------
app.get("/api/admin/users", authMiddleware, requireAdmin, async (req, res) => {
  const r = await pool.query("SELECT id, email, nome, papel, created_at FROM users ORDER BY created_at ASC");
  res.json(r.rows);
});

app.patch("/api/admin/users/:id", authMiddleware, requireAdmin, async (req, res) => {
  const { papel, nome } = req.body || {};
  if (papel && !["admin", "parceiro"].includes(papel)) return res.status(400).json({ error: "Papel inválido." });
  if (req.params.id === req.auth.uid && papel === "parceiro") {
    return res.status(400).json({ error: "Não podes remover o teu próprio acesso de administrador." });
  }
  const r = await pool.query(
    "UPDATE users SET papel = COALESCE($1, papel), nome = COALESCE($2, nome) WHERE id=$3 RETURNING id, email, nome, papel, created_at",
    [papel || null, nome || null, req.params.id]
  );
  if (!r.rows[0]) return res.status(404).json({ error: "not_found" });
  res.json(r.rows[0]);
});

app.post("/api/admin/users/:id/reset-password", authMiddleware, requireAdmin, async (req, res) => {
  const { novaPassword } = req.body || {};
  const senha = novaPassword && String(novaPassword).length >= 6 ? String(novaPassword) : crypto.randomBytes(4).toString("hex");
  const hash = await bcrypt.hash(senha, 10);
  const r = await pool.query("UPDATE users SET password_hash=$1 WHERE id=$2 RETURNING email", [hash, req.params.id]);
  if (!r.rows[0]) return res.status(404).json({ error: "not_found" });
  // Resolve automaticamente qualquer pedido de reposição pendente para este utilizador.
  await pool.query(
    "UPDATE documents SET data = data || '{\"estado\":\"Resolvido\"}'::jsonb WHERE collection='reset_requests' AND data->>'userId' = $1",
    [req.params.id]
  );
  res.json({ ok: true, password: senha });
});

app.delete("/api/admin/users/:id", authMiddleware, requireAdmin, async (req, res) => {
  if (req.params.id === req.auth.uid) return res.status(400).json({ error: "Não podes remover a tua própria conta." });
  await pool.query("DELETE FROM users WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

app.get("/api/admin/reset-requests", authMiddleware, requireAdmin, async (req, res) => {
  const r = await pool.query(
    "SELECT id, data, created_at FROM documents WHERE collection='reset_requests' ORDER BY created_at DESC"
  );
  res.json(r.rows.map((row) => ({ id: row.id, ...row.data, criadoEm: row.created_at })));
});

app.delete("/api/admin/reset-requests/:id", authMiddleware, requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM documents WHERE collection='reset_requests' AND id=$1", [req.params.id]);
  res.json({ ok: true });
});

app.get("/api/admin/seed-status", authMiddleware, requireAdmin, async (req, res) => {
  res.json({ jaTemDados: await jaTemDados() });
});

app.post("/api/admin/seed", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const resumo = await seedDados();
    res.json({ ok: true, resumo });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao gerar dados de teste." });
  }
});

// ---------- Plano (gratuito / pago) ----------
app.get("/api/settings/plano", authMiddleware, async (req, res) => {
  const plano = await obterPlano();
  const contagens = {};
  for (const nome of Object.keys(LIMITES_FREE)) {
    const r = await pool.query("SELECT COUNT(*)::int AS n FROM documents WHERE collection=$1", [nome]);
    contagens[nome] = r.rows[0].n;
  }
  res.json({ plano, limites: LIMITES_FREE, modulosPro: MODULOS_PRO, contagens });
});

app.patch("/api/settings/plano", authMiddleware, requireAdmin, async (req, res) => {
  const { plano } = req.body || {};
  if (!["free", "pro"].includes(plano)) return res.status(400).json({ error: "Plano inválido." });
  await pool.query(
    "UPDATE documents SET data = data || $1::jsonb, updated_at = now() WHERE collection='settings' AND id=$2",
    [JSON.stringify({ plano }), PLANO_ID]
  );
  res.json({ plano });
});

// ---------- Coleções genéricas (pessoas, produtos, agenda, tarefas, documentos, chat, financeiro, vendas) ----------
app.get("/api/collections/:name", authMiddleware, checkCollection, async (req, res) => {
  const plano = await obterPlano();
  if (plano === "free" && MODULOS_PRO.includes(req.params.name)) {
    return res.status(402).json({ error: "Este módulo está disponível apenas no plano Pro.", pro: true });
  }
  const r = await pool.query(
    "SELECT id, data, created_at, updated_at FROM documents WHERE collection=$1 ORDER BY created_at ASC",
    [req.params.name]
  );
  res.json(r.rows.map((row) => ({ id: row.id, ...row.data, criadoEm: row.created_at, atualizadoEm: row.updated_at })));
});

app.post("/api/collections/:name", authMiddleware, checkCollection, async (req, res) => {
  const plano = await obterPlano();
  if (plano === "free" && MODULOS_PRO.includes(req.params.name)) {
    return res.status(402).json({ error: "Este módulo está disponível apenas no plano Pro.", pro: true });
  }
  if (plano === "free" && LIMITES_FREE[req.params.name] != null) {
    const r = await pool.query("SELECT COUNT(*)::int AS n FROM documents WHERE collection=$1", [req.params.name]);
    if (r.rows[0].n >= LIMITES_FREE[req.params.name]) {
      return res.status(402).json({
        error: `O plano gratuito permite até ${LIMITES_FREE[req.params.name]} registos em ${req.params.name}. Passa a Pro para continuares.`,
        pro: true,
      });
    }
  }
  const id = crypto.randomUUID();
  const data = req.body || {};
  await pool.query("INSERT INTO documents (collection, id, data) VALUES ($1,$2,$3)", [req.params.name, id, data]);
  res.json({ id, ...data });
});

app.patch("/api/collections/:name/:id", authMiddleware, checkCollection, async (req, res) => {
  const r = await pool.query(
    "UPDATE documents SET data = data || $1::jsonb, updated_at = now() WHERE collection=$2 AND id=$3 RETURNING id, data",
    [JSON.stringify(req.body || {}), req.params.name, req.params.id]
  );
  if (!r.rows[0]) return res.status(404).json({ error: "not_found" });
  res.json({ id: r.rows[0].id, ...r.rows[0].data });
});

app.delete("/api/collections/:name/:id", authMiddleware, checkCollection, async (req, res) => {
  await pool.query("DELETE FROM documents WHERE collection=$1 AND id=$2", [req.params.name, req.params.id]);
  res.json({ ok: true });
});

// ---------- Venda com baixa de stock atómica ----------
app.post("/api/vendas-com-stock", authMiddleware, async (req, res) => {
  const { pessoaId, data, itens, total, estado } = req.body || {};
  if (!Array.isArray(itens) || itens.length === 0) return res.status(400).json({ error: "Sem artigos." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const it of itens) {
      const stockRes = await client.query(
        "SELECT data FROM documents WHERE collection='produtos' AND id=$1 FOR UPDATE",
        [it.produtoId]
      );
      const produto = stockRes.rows[0]?.data;
      const atual = Number(produto?.stock || 0);
      if (!produto || atual < Number(it.quantidade)) {
        throw Object.assign(new Error(`Stock insuficiente de "${it.nome || "produto"}".`), { status: 409 });
      }
      await client.query(
        "UPDATE documents SET data = jsonb_set(data, '{stock}', to_jsonb($1::int)), updated_at = now() WHERE collection='produtos' AND id=$2",
        [atual - Number(it.quantidade), it.produtoId]
      );
    }
    const id = crypto.randomUUID();
    const vendaData = { pessoaId, data, itens, total, estado: estado || "Pendente" };
    await client.query("INSERT INTO documents (collection, id, data) VALUES ('vendas',$1,$2)", [id, vendaData]);
    await client.query("COMMIT");
    res.json({ id, ...vendaData });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(e.status || 500).json({ error: e.message || "Erro ao registar venda." });
  } finally {
    client.release();
  }
});

// ---------- Frontend estático (build do Vite) ----------
const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 8080;
migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`FM World a correr na porta ${PORT}`));
  })
  .catch((e) => {
    console.error("Falha na migração da base de dados:", e);
    process.exit(1);
  });
