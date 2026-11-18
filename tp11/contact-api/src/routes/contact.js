import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { contactSchema, listQuerySchema } from "../schemas/contact.js";

export function contactRouter({ contactRepository }) {
  const router = Router();

  router.post("/", validate(contactSchema), async (req, res, next) => {
    try {
      // req.body contient uniquement les données validées par Zod
      const saved = await contactRepository.create(req.body);
      res.status(201).json({ id: saved.id, status: "received" });
    } catch (err) {
      next(err);
    }
  });

  router.get("/", async (req, res, next) => {
    const result = listQuerySchema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "query",
        message: issue.message,
      }));
      return res.status(400).json({ error: "VALIDATION_ERROR", details });
    }

    try {
      const { page, limit } = result.data;
      const items = await contactRepository.list({ page, limit });
      res.json({ page, limit, items });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
