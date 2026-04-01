// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { App } from "../../src/dashboard/src/App";

vi.mock("../../src/dashboard/src/api", () => ({
  getStatus: vi.fn().mockResolvedValue({ uptime: 1, contextCount: 1, activeSessions: 1, engineHealth: "healthy" }),
  getContext: vi.fn().mockResolvedValue({ items: [], page: 1, perPage: 50, total: 0, totalPages: 1 }),
  deleteContext: vi.fn().mockResolvedValue(undefined),
  getSessions: vi.fn().mockResolvedValue({ sessions: [] }),
  getConfig: vi.fn().mockResolvedValue({ defaultMaxItems: 20, defaultMinScore: 0, filterCacheTtlMs: 1, sessionTtlMs: 1 }),
  updateConfig: vi.fn().mockResolvedValue({ defaultMaxItems: 20, defaultMinScore: 0, filterCacheTtlMs: 1, sessionTtlMs: 1 }),
  getAnalytics: vi.fn().mockResolvedValue({
    sessions: [{ sessionId: "s-1", queryCount: 2, tokenUsage: 99, cacheEntries: 3 }],
    totals: { tokenUsage: 99, cacheEntries: 3, sessionCount: 1 }
  })
}));

describe("dashboard app routing", () => {
  it("navigates to analytics page and renders chart container", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("link", { name: "Analytics" }));

    expect(await screen.findByRole("heading", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.getByLabelText("Token usage chart")).toBeInTheDocument();
  });
});
