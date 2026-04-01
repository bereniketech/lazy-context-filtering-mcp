import { useEffect, useState } from "react";
import { getSessions } from "../api";
import type { SessionRecord } from "../types";

export function SessionsPage(): JSX.Element {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getSessions();
        setSessions(response.sessions);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load sessions");
      }
    };

    load().catch(() => undefined);
  }, []);

  return (
    <section>
      <h1>Sessions</h1>
      <p className="subtitle">Observe active session churn and query load.</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Session ID</th>
              <th>User</th>
              <th>Query Count</th>
              <th>Expires At</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td>{session.id}</td>
                <td>{session.userId ?? "anonymous"}</td>
                <td>{session.queryCount}</td>
                <td>{session.expiresAt ?? "n/a"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
