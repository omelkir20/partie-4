import pg from "pg";

/** Repository PostgreSQL : connexion configurée par PGHOST, PGUSER, PGPASSWORD, PGDATABASE. */
export function createPgContactRepository(pool = new pg.Pool()) {
  return {
    async create({ name, email, message }) {
      // Requête PARAMÉTRÉE : les valeurs ne sont jamais concaténées dans le SQL.
      const { rows } = await pool.query(
        "INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING id",
        [name, email, message]
      );
      return rows[0];
    },

    async list({ page, limit }) {
      const offset = (page - 1) * limit;
      const { rows } = await pool.query(
        "SELECT id, name, email, message, created_at FROM contacts ORDER BY id DESC LIMIT $1 OFFSET $2",
        [limit, offset]
      );
      return rows;
    },

    async count() {
      const { rows } = await pool.query("SELECT count(*)::int AS n FROM contacts");
      return rows[0].n;
    },
  };
}

/** Repository en mémoire, utilisé par les tests de routes. */
export function createMemoryContactRepository() {
  const items = [];
  return {
    items,

    async create(contact) {
      const saved = { id: items.length + 1, ...contact };
      items.push(saved);
      return saved;
    },

    async list({ page, limit }) {
      const offset = (page - 1) * limit;
      return [...items].reverse().slice(offset, offset + limit);
    },

    async count() {
      return items.length;
    },
  };
}
