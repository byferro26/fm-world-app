import express from "express";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { pool, migrate } from "./db.js";
import { registerUser, loginUser, signToken, authMiddleware } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const COLLECTIONS = ["pessoas", "produtos", "vendas", "financeiro", "agenda", "tarefas", "documentos", "chat"];

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

// ---------- Coleções genéricas (pessoas, produtos, agenda, tarefas, documentos, chat, financeiro, vendas) ----------
app.get("/api/collections/:name", authMiddleware, checkCollection, async (req, res) => {
  const r = await pool.query(
    "SELECT id, data, created_at, updated_at FROM documents WHERE collection=$1 ORDER BY created_at ASC",
    [req.params.name]
  );
  res.json(r.rows.map((row) => ({ id: row.id, ...row.data, criadoEm: row.created_at, atualizadoEm: row.updated_at })));
});

app.post("/api/collections/:name", authMiddleware, checkCollection, async (req, res) => {
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
