"use client";

import { useMemo, useState } from "react";
import {
  CuratedWalkthroughSource,
  WalkthroughValidationError,
  type HydratedWalkthrough,
} from "@/lib/walkthrough";
import WalkthroughEngine from "./WalkthroughEngine";

type HydrateResult =
  | { ok: true; hydrated: HydratedWalkthrough }
  | { ok: false; issues: string[] };

export default function ReplayApp() {
  const summaries = useMemo(() => CuratedWalkthroughSource.list(), []);
  const [selectedId, setSelectedId] = useState<string>(
    () => summaries[0]?.id ?? ""
  );

  const result = useMemo<HydrateResult>(() => {
    try {
      return { ok: true, hydrated: CuratedWalkthroughSource.hydrate(selectedId) };
    } catch (error) {
      if (error instanceof WalkthroughValidationError) {
        return { ok: false, issues: error.issues };
      }
      throw error;
    }
  }, [selectedId]);

  const resetToCurated = () => {
    if (summaries[0]) {
      setSelectedId(summaries[0].id);
    }
  };

  return (
    <main className="app">
      <div className="toolbar">
        <label className="toolbar__field">
          <span className="toolbar__label">Example</span>
          <select
            className="toolbar__select"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {summaries.map((summary) => (
              <option key={summary.id} value={summary.id}>
                {summary.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {result.ok ? (
        <>
          <header className="hero">
            <p className="hero__brand">Replay</p>
            <h1 className="hero__title">{result.hydrated.example.title}</h1>
            <p className="hero__desc">{result.hydrated.example.description}</p>
          </header>

          <WalkthroughEngine
            key={result.hydrated.example.id}
            hydrated={result.hydrated}
          />
        </>
      ) : (
        <section className="error-state" role="alert">
          <h1 className="error-state__title">This walkthrough could not load</h1>
          <p className="error-state__lead">
            The selected example failed validation, so it was not rendered.
          </p>
          {result.issues.length > 0 ? (
            <ul className="error-state__issues">
              {result.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className="nav-btn"
            onClick={resetToCurated}
          >
            Reset to curated example
          </button>
        </section>
      )}
    </main>
  );
}
