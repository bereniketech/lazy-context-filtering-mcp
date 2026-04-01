import { type FormEvent, useEffect, useState } from "react";
import { getConfig, updateConfig } from "../api";
import type { DashboardConfig } from "../types";

const INITIAL_CONFIG: DashboardConfig = {
  defaultMaxItems: 20,
  defaultMinScore: 0,
  filterCacheTtlMs: 300000,
  sessionTtlMs: 3600000
};

export function ConfigPage(): JSX.Element {
  const [form, setForm] = useState<DashboardConfig>(INITIAL_CONFIG);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const config = await getConfig();
        setForm(config);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load config");
      }
    };

    load().catch(() => undefined);
  }, []);

  const onChange = (key: keyof DashboardConfig, value: number) => {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
    setSaved(false);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const updated = await updateConfig(form);
      setForm(updated);
      setSaved(true);
      setError("");
    } catch (err) {
      setSaved(false);
      setError(err instanceof Error ? err.message : "Unable to save config");
    }
  };

  return (
    <section>
      <h1>Config</h1>
      <p className="subtitle">Tune filtering thresholds and retention windows.</p>
      <form className="config-form panel" onSubmit={onSubmit}>
        <label>
          Default Max Items
          <input
            type="number"
            value={form.defaultMaxItems}
            min={0}
            onChange={(event) => onChange("defaultMaxItems", Number(event.currentTarget.value))}
          />
        </label>
        <label>
          Default Min Score
          <input
            type="number"
            value={form.defaultMinScore}
            min={0}
            step={0.01}
            onChange={(event) => onChange("defaultMinScore", Number(event.currentTarget.value))}
          />
        </label>
        <label>
          Cache TTL (ms)
          <input
            type="number"
            value={form.filterCacheTtlMs}
            min={0}
            onChange={(event) => onChange("filterCacheTtlMs", Number(event.currentTarget.value))}
          />
        </label>
        <label>
          Session TTL (ms)
          <input
            type="number"
            value={form.sessionTtlMs}
            min={0}
            onChange={(event) => onChange("sessionTtlMs", Number(event.currentTarget.value))}
          />
        </label>
        <button type="submit">Save Config</button>
      </form>
      {saved ? <p className="ok">Config saved.</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
