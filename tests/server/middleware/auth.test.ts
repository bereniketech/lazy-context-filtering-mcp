import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { apiKeyMiddleware } from "../../../src/server/middleware/auth.js";

function makeMocks(headers: Record<string, string> = {}): {
  req: Request;
  res: Response;
  next: NextFunction;
  jsonFn: ReturnType<typeof vi.fn>;
  statusFn: ReturnType<typeof vi.fn>;
} {
  const jsonFn = vi.fn();
  const statusFn = vi.fn().mockReturnValue({ json: jsonFn });
  const req = { headers } as unknown as Request;
  const res = { status: statusFn, json: jsonFn } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next, jsonFn, statusFn };
}

beforeEach(() => {
  delete process.env.API_KEY;
  delete process.env.NODE_ENV;
});

afterEach(() => {
  delete process.env.API_KEY;
  delete process.env.NODE_ENV;
});

describe("apiKeyMiddleware", () => {
  it("calls next() when API_KEY env var is not set (dev mode)", () => {
    const { req, res, next } = makeMocks();
    apiKeyMiddleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("calls next() when correct API key is provided", () => {
    process.env.API_KEY = "secret-key";
    const { req, res, next } = makeMocks({ "x-api-key": "secret-key" });
    apiKeyMiddleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("returns 401 with { error: 'Unauthorized' } when API key is missing", () => {
    process.env.API_KEY = "secret-key";
    const { req, res, next, statusFn, jsonFn } = makeMocks();
    apiKeyMiddleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(statusFn).toHaveBeenCalledWith(401);
    expect(jsonFn).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  it("returns 401 when API key is wrong", () => {
    process.env.API_KEY = "correct-key";
    const { req, res, next, statusFn } = makeMocks({ "x-api-key": "wrong-key" });
    apiKeyMiddleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(statusFn).toHaveBeenCalledWith(401);
  });

  it("calls next() in test environment even with API_KEY set", () => {
    process.env.API_KEY = "secret-key";
    process.env.NODE_ENV = "test";
    const { req, res, next } = makeMocks();
    apiKeyMiddleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
