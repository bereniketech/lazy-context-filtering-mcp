// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContextPage } from "../../src/dashboard/src/pages/ContextPage";

vi.mock("../../src/dashboard/src/api", () => ({
  getContext: vi.fn().mockResolvedValue({
    items: [
      {
        id: "ctx-1",
        content: "Alpha context",
        source: "docs",
        tokenCount: 11,
        metadata: { topic: "alpha" },
        createdAt: new Date().toISOString()
      },
      {
        id: "ctx-2",
        content: "Beta context",
        source: "notes",
        tokenCount: 7,
        metadata: { topic: "beta" },
        createdAt: new Date().toISOString()
      }
    ],
    page: 1,
    perPage: 50,
    total: 2,
    totalPages: 1
  }),
  deleteContext: vi.fn().mockResolvedValue(undefined)
}));

import { deleteContext } from "../../src/dashboard/src/api";

describe("context page", () => {
  it("filters rows by search and deletes an item", async () => {
    render(<ContextPage />);

    await screen.findByText("Alpha context");

    fireEvent.change(screen.getByLabelText("Search context"), {
      target: { value: "beta" }
    });

    expect(screen.queryByText("Alpha context")).not.toBeInTheDocument();
    expect(screen.getByText("Beta context")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteContext).toHaveBeenCalledWith("ctx-2");
    });
  });
});
