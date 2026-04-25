// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContextPage } from "../../src/dashboard/src/pages/ContextPage";

vi.mock("../../src/dashboard/src/api", () => ({
  getContext: vi.fn(),
  deleteContext: vi.fn().mockResolvedValue(undefined)
}));

import { getContext, deleteContext } from "../../src/dashboard/src/api";

const ALL_ITEMS = [
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
];

describe("context page", () => {
  it("fetches with search term on input change and deletes an item", async () => {
    vi.mocked(getContext).mockResolvedValueOnce({
      items: ALL_ITEMS,
      page: 1,
      perPage: 50,
      total: 2,
      totalPages: 1
    });

    render(<ContextPage />);

    await screen.findByText("Alpha context");

    vi.mocked(getContext).mockResolvedValueOnce({
      items: [ALL_ITEMS[1]],
      page: 1,
      perPage: 50,
      total: 1,
      totalPages: 1
    });

    fireEvent.change(screen.getByLabelText("Search context"), {
      target: { value: "beta" }
    });

    await waitFor(() => {
      expect(getContext).toHaveBeenCalledWith(1, 50, "beta");
    });

    await screen.findByText("Beta context");

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteContext).toHaveBeenCalledWith("ctx-2");
    });
  });
});
