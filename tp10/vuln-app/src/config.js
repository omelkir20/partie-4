// Les secrets sont lus dans les variables d'environnement (voir .env.example).
const required = ["JWT_SECRET", "PAYMENT_API_KEY", "DB_PASSWORD"];
for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  jwt_secret: process.env.JWT_SECRET,
  payment_api_key: process.env.PAYMENT_API_KEY,
  db_password: process.env.DB_PASSWORD,
};
