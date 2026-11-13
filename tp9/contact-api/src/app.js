import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { healthRouter } from "./routes/health.js";
import { contactRouter } from "./routes/contact.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export function createApp({ contactRepository, rateLimitMax = 5 }) {
  const app = express();

  // Partie 3 : durcissement HTTP
   app.disable("x-powered-by");
   app.use(helmet());

  // Partie 3 : taille du corps limitée à 10 ko
  app.use(express.json({ limit: "10kb" }));

  // Partie 3 : rate limiter uniquement sur /api/contact
  const contactLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: rateLimitMax, // sur une ancienne version d'express-rate-limit : "max"
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "TOO_MANY_REQUESTS" },
  });

  app.use("/api/health", healthRouter);
  app.use("/api/contact", contactLimiter, contactRouter({ contactRepository }));

  // Partie 2 : 404 JSON pour toutes les autres URL
  app.use((req, res) => res.status(404).json({ error: "NOT_FOUND" }));

  // Le middleware d'erreur doit être déclaré EN DERNIER, une seule fois.
  app.use(errorHandler);

  return app;
}
// test rate limit config
