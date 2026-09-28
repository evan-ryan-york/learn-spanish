"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  deleteCloudPhrase,
  loadSavedPhrases,
  removeSavedPhrase,
  replaceSavedPhrases,
  syncSavedPhrases,
  type SavedPhrase,
} from "../phrases";
import { findScenario } from "../scenarios";
import { getSupabaseBrowserClient } from "../supabase";

export default function Phrases() {
  const [phrases, setPhrases] = useState<SavedPhrase[]>([]);

  useEffect(() => {
    setPhrases(loadSavedPhrases());

    const client = getSupabaseBrowserClient();
    if (!client) return;

    void syncSavedPhrases(client, loadSavedPhrases())
      .then((cloudPhrases) => setPhrases(replaceSavedPhrases(cloudPhrases)))
      .catch((error) => console.error("Saved phrase sync error:", error));
  }, []);

  const deletePhrase = useCallback((id: string) => {
    setPhrases(removeSavedPhrase(id));

    const client = getSupabaseBrowserClient();
    if (client) {
      void deleteCloudPhrase(client, id).catch((error) => {
        console.error("Saved phrase cloud delete error:", error);
      });
    }
  }, []);

  return (
    <main className="home-shell notranslate" translate="no">
      <div className="grain" aria-hidden="true" />

      <header className="topbar">
        <Link className="brand" href="/" aria-label="Rato, inicio">
          rato<span>.</span>
        </Link>
        <div className="locale-pill">
          <span aria-hidden="true">🇲🇽</span>
          Español de México
        </div>
      </header>

      <section className="session-history" aria-labelledby="page-title">
        <Link className="back-link" href="/">
          ← Escenarios
        </Link>
        <div className="session-history-heading">
          <div className="eyebrow">PARA RECORDAR</div>
          <h2 id="page-title">Mis frases</h2>
          <p lang="en">
            In English mode, say “Add that to my phrases” and it lands here.
          </p>
        </div>

        {phrases.length === 0 ? (
          <div className="session-history-empty">
            Todavía no hay frases guardadas.
          </div>
        ) : (
          <ul className="phrase-list">
            {phrases.map((phrase) => (
              <li key={phrase.id}>
                <div className="phrase-copy">
                  <p className="phrase-spanish" lang="es">{phrase.spanish}</p>
                  {phrase.english ? (
                    <p className="phrase-english" lang="en">{phrase.english}</p>
                  ) : null}
                  <span className="phrase-meta">
                    {findScenario(phrase.scenario)?.title ?? phrase.scenario} ·{" "}
                    {formatPhraseDate(phrase.createdAt)}
                  </span>
                </div>
                <button
                  className="phrase-delete"
                  type="button"
                  onClick={() => deletePhrase(phrase.id)}
                  aria-label={`Borrar “${phrase.spanish}”`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function formatPhraseDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(value));
}
