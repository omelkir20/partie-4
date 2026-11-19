import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createMemoryContactRepository } from "../src/repositories/contactRepository.js";

const valid = { name: "Ada", email: "ada@example.com", message: "Bonjour le monde" };
let app, repo;

beforeEach(() => {
  repo = createMemoryContactRepository();
  app = createApp({ contactRepository: repo, rateLimitMax: 1000 });
});

describe("POST /api/contact", () => {
  it("crée un contact valide (201)", async () => {
    const res = await request(app).post("/api/contact").send(valid);
    expect(res.status).toBe(201);
  });

  it("refuse un email invalide (400)", async () => {
    const res = await request(app).post("/api/contact").send({ ...valid, email: "nope" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
    expect(res.body.details[0].field).toBe("email");
  });

  it("refuse les champs manquants", async () => {
    const res = await request(app).post("/api/contact").send({ name: "Ada" });
    expect(res.status).toBe(400);
  });

  it("refuse les champs en trop (mass assignment)", async () => {
    const res = await request(app).post("/api/contact").send({ ...valid, isAdmin: true });
    expect(res.status).toBe(400);
  });

  it("refuse les mauvais types", async () => {
    const res = await request(app).post("/api/contact").send({ ...valid, name: 123 });
    expect(res.status).toBe(400);
  });

  it("refuse un JSON tronqué (INVALID_JSON)", async () => {
    const res = await request(app)
      .post("/api/contact")
      .set("Content-Type", "application/json")
      .send('{"name": "Ada",');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_JSON");
  });

  it("refuse un corps trop gros (413)", async () => {
    const res = await request(app).post("/api/contact")
      .send({ ...valid, message: "x".repeat(20000) });
    expect(res.status).toBe(413);
    expect(res.body.error).toBe("PAYLOAD_TOO_LARGE");
  });

  it("injection SQL dans l'email : rejetée par la validation", async () => {
    const res = await request(app).post("/api/contact")
      .send({ ...valid, email: "' OR 1=1 --" });
    expect(res.status).toBe(400);
  });

  it("injection SQL dans le message : stockée comme simple texte", async () => {
    const payload = { ...valid, message: "x'); DROP TABLE contacts; --" };
    const res = await request(app).post("/api/contact").send(payload);
    expect(res.status).toBe(201); // le texte est valide, c'est le SQL paramétré qui protège
  });

  it("erreur interne : 500 sans fuite", async () => {
    const broken = { create: async () => { throw new Error("secret db password"); } };
    const app500 = createApp({ contactRepository: broken, rateLimitMax: 1000 });
    const res = await request(app500).post("/api/contact").send(valid);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "INTERNAL_ERROR" });
    expect(JSON.stringify(res.body)).not.toMatch(/secret|stack|at /);
  });

  it("route inconnue : 404 JSON", async () => {
    const res = await request(app).get("/nimporte");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("NOT_FOUND");
  });

  it("rate limit : 429 après 5 requêtes", async () => {
    const limited = createApp({ contactRepository: repo, rateLimitMax: 5 });
    let last;
    for (let i = 0; i < 6; i++) last = await request(limited).post("/api/contact").send(valid);
    expect(last.status).toBe(429);
  });

  it("headers de sécurité présents", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});
