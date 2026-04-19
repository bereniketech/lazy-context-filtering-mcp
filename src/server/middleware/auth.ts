import type { Request, Response, NextFunction } from "express";

const SKIP_AUTH_ENVS = new Set(["test"]);

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    next();
    return;
  }

  if (SKIP_AUTH_ENVS.has(process.env.NODE_ENV ?? "")) {
    next();
    return;
  }

  const providedKey = req.headers["x-api-key"];
  if (providedKey !== apiKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
