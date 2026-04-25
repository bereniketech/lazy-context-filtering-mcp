import { useEffect, useState } from "react";
import { deleteContext, getContext } from "../api";
import type { ContextItem } from "../types";

const PAGE_SIZE = 50;

export function ContextPage(): JSX.Element {
  const [items, setItems] = useState<ContextItem[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = async (searchTerm: string) => {
    try {
      const response = await getContext(1, PAGE_SIZE, searchTerm);
      setItems(response.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load context items");
    }
  };

  useEffect(() => {
    load(search).catch(() => undefined);
  }, [search]);

  const onDelete = async (id: string) => {
    try {
      await deleteContext(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete context item");
    }
  };

  return (
    <section>
      <h1>Context</h1>
      <p className="subtitle">Search and prune indexed context records.</p>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by content, source, or metadata"
          aria-label="Search context"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        <span>{items.length} results</span>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Source</th>
              <th>Tokens</th>
              <th>Content</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.source}</td>
                <td>{item.tokenCount}</td>
                <td>{item.content}</td>
                <td>
                  <button type="button" onClick={() => onDelete(item.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
