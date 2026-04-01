// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfigPage } from "../../src/dashboard/src/pages/ConfigPage";

vi.mock("../../src/dashboard/src/api", () => ({
  getConfig: vi.fn().mockResolvedValue({
    defaultMaxItems: 20,
    defaultMinScore: 0.1,
    filterCacheTtlMs: 120000,
    sessionTtlMs: 180000
  }),
  updateConfig: vi.fn().mockImplementation(async (payload) => payload)
}));

import { updateConfig } from "../../src/dashboard/src/api";

describe("config page", () => {
  it("submits updated values and confirms save", async () => {
    render(<ConfigPage />);

    const maxItemsInput = (await screen.findByLabelText("Default Max Items")) as HTMLInputElement;
    fireEvent.change(maxItemsInput, { target: { value: "33" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Config" }));

    await waitFor(() => {
      expect(updateConfig).toHaveBeenCalled();
    });

    expect(screen.getByText("Config saved.")).toBeInTheDocument();
  });
});
