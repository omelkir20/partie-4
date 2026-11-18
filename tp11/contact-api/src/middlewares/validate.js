export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || issue.keys?.join(",") || "body",
        message: issue.message,
      }));
      return res.status(400).json({ error: "VALIDATION_ERROR", details });
    }
    req.body = result.data; // données nettoyées (trim)
    next();
  };
}
