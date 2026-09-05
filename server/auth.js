import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-troca-em-producao";

export async function registerUser({ nome, email, password }) {
  const countRes = await pool.query("SELECT COUNT(*)::int AS n FROM users");
  const isFirst = countRes.rows[0].n === 0;
  const hash = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();
  const papel = isFirst ? "admin" : "parceiro";
  await pool.query(
    "INSERT INTO users (id, email, password_hash, nome, papel) VALUES ($1,$2,$3,$4,$5)",
    [id, email.toLowerCase().trim(), hash, nome, papel]
  );
  return { id, email: email.toLowerCase().trim(), nome, papel };
}

export async function loginUser({ email, password }) {
  const res = await pool.query("SELECT * FROM users WHERE email=$1", [String(email).toLowerCase().trim()]);
  const user = res.rows[0];
  if (!user) throw Object.assign(new Error("Email ou palavra-passe incorretos."), { status: 401 });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw Object.assign(new Error("Email ou palavra-passe incorretos."), { status: 401 });
  return user;
}

export function signToken(user) {
  return jwt.sign({ uid: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "not_authenticated" });
  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}
