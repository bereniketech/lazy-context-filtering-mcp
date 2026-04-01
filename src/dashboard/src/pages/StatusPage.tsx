import { useEffect, useState } from "react";
import { getStatus } from "../api";
import type { DashboardStatus } from "../types";

const REFRESH_MS = 10_000;

export function StatusPage(): JSX.Element {
  const [data, setData] = useState<DashboardStatus | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const result = await getStatus();
        if (mounted) {
          setData(result);
          setError("");
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to load status");
        }
      }
    };

    load().catch(() => undefined);
    const id = window.setInterval(() => {
      load().catch(() => undefined);
    }, REFRESH_MS);

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <section>
      <h1>Status</h1>
      <p className="subtitle">Live service signals across the MCP stack.</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="status-grid">
        <article className="panel card-glow">
          <h2>Uptime</h2>
          <p>{data ? `${data.uptime}s` : "..."}</p>
        </article>
        <article className="panel card-glow">
          <h2>Context Items</h2>
          <p>{data ? String(data.contextCount) : "..."}</p>
        </article>
        <article className="panel card-glow">
          <h2>Active Sessions</h2>
          <p>{data ? String(data.activeSessions) : "..."}</p>
        </article>
        <article className="panel card-glow">
          <h2>Engine</h2>
          <p className={data?.engineHealth === "healthy" ? "ok" : "warn"}>
            {data?.engineHealth ?? "checking"}
          </p>
        </article>
      </div>
    </section>
  );
}
