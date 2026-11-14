// TP10 : application corrigée (SAST). Ne jamais l'exposer hors du lab.
const express = require("express");
const { execFile } = require("child_process");
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");
const config = require("./config");

const app = express();
app.use(express.json({ limit: "10kb" }));

const db = new sqlite3.Database(":memory:");
db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT)");
  db.run("INSERT INTO users (name, role) VALUES ('alice', 'admin'), ('bob', 'user')");
});

// [FIXED] Injection SQL : requête paramétrée
app.get("/users", (req, res) => {
  const name = String(req.query.name || "");
  db.all("SELECT id, name FROM users WHERE name = ?", [name], (err, rows) => {
    if (err) return res.status(500).json({ error: "erreur interne" });
    res.json(rows);
  });
});

// [FIXED] Injection de commande : execFile (pas de shell) + validation du host
app.get("/ping", (req, res) => {
  const host = String(req.query.host || "");
  if (!/^[a-zA-Z0-9.-]{1,253}$/.test(host) || host.startsWith("-")) {
    return res.status(400).json({ error: "host invalide" });
  }
  execFile("ping", ["-c", "1", host], { timeout: 5000 }, (err, stdout) => {
    if (err) return res.status(500).json({ error: "ping échoué" });
    res.json({ output: stdout });
  });
});

// [FIXED] XSS réfléchi : réponse JSON, plus de HTML construit à la main
app.get("/hello", (req, res) => {
  const name = String(req.query.name || "");
  res.json({ message: `Bonjour ${name}` });
});

// [FIXED] Prototype pollution : plus de merge récursif, seules les clés autorisées sont copiées
app.post("/settings", (req, res) => {
  const allowed = ["theme", "language"];
  const settings = {};
  for (const key of allowed) {
    if (typeof req.body[key] === "string") settings[key] = req.body[key];
  }
  res.json(settings);
});

// [FIXED] JWT : secret externalisé (config.js lit process.env) et expiration
app.post("/login", (req, res) => {
  const token = jwt.sign(
    { user: String(req.body.user || ""), role: "user" },
    config.jwt_secret,
    { expiresIn: "1h", algorithm: "HS256" }
  );
  res.json({ token });
});

app.listen(config.port, () => console.log(`vuln-app écoute sur ${config.port}`));
