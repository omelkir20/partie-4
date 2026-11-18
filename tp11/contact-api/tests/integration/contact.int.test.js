import { describe, it, beforeAll, afterAll } from "vitest";
import pg from "pg";
import { createApp } from "../../src/app.js";
import { createPgContactRepository } from "../../src/repositories/contactRepository.js";

// Prérequis : docker compose up -d --wait && npm run migrate (variables PG* exportées).
describe("Intégration API ↔ PostgreSQL", () => {
  let pool;
  // eslint-disable-next-line no-unused-vars
  let app;

  beforeAll(() => {
    pool = new pg.Pool();
    app = createApp({ contactRepository: createPgContactRepository(pool) });
  });

  afterAll(async () => {
    await pool.end();
  });

  // TODO (partie 5) :
  //  - envoyer un contact valide avec supertest puis vérifier par une requête SQL qu'il est en base
  //  - envoyer une tentative d'injection SQL dans "name" et vérifier :
  //      * que la table contacts existe toujours
  //      * que la valeur est stockée telle quelle
  it.todo("enregistre un contact dans PostgreSQL");
  it.todo("résiste à une tentative d'injection SQL");
});
