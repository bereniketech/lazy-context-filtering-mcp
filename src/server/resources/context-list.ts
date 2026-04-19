import type { Store } from "../store.js";

export async function contextListResourceHandler(
  store: Store
): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
  const items = await store.contextItems.list(1000, 0);
  return {
    contents: [
      {
        uri: "context://items",
        mimeType: "application/json",
        text: JSON.stringify(items)
      }
    ]
  };
}
