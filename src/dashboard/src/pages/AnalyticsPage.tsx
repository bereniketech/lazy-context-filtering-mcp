import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAnalytics } from "../api";
import type { AnalyticsResponse } from "../types";

export function AnalyticsPage(): JSX.Element {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const analytics = await getAnalytics();
        setData(analytics);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load analytics");
      }
    };

    load().catch(() => undefined);
  }, []);

  return (
    <section>
      <h1>Analytics</h1>
      <p className="subtitle">Token usage heat map across active sessions.</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="panel">
        <h2>Totals</h2>
        <p>
          Tokens: {data?.totals.tokenUsage ?? 0} | Cache Entries: {data?.totals.cacheEntries ?? 0} | Sessions: {data?.totals.sessionCount ?? 0}
        </p>
      </div>
      <div className="panel chart-panel" aria-label="Token usage chart">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data?.sessions ?? []}>
            <CartesianGrid strokeDasharray="5 5" />
            <XAxis dataKey="sessionId" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="tokenUsage" fill="#146bff" name="Token Usage" />
            <Bar dataKey="queryCount" fill="#f28f3b" name="Query Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
