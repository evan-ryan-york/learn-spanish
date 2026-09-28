"use client";

import Link from "next/link";
import { useState } from "react";
import type { Scenario } from "./scenarios";
import {
  DEFAULT_SPANISH_LEVEL,
  MAX_SPANISH_LEVEL,
  MIN_SPANISH_LEVEL,
  SPANISH_LEVEL_LABELS,
  type SpanishLevel,
} from "./spanish-level";

export default function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const [level, setLevel] = useState<SpanishLevel>(DEFAULT_SPANISH_LEVEL);

  const changeLevel = (amount: -1 | 1) => {
    setLevel((currentLevel) => {
      const nextLevel = Math.min(
        MAX_SPANISH_LEVEL,
        Math.max(MIN_SPANISH_LEVEL, currentLevel + amount),
      );

      return nextLevel as SpanishLevel;
    });
  };

  return (
    <article className="scenario-card">
      <Link
        className="scenario-link"
        href={{ pathname: `/${scenario.key}`, query: { level } }}
        aria-label={`Practicar: ${scenario.title}, nivel ${level}`}
      >
        <div className="scenario-art" aria-hidden="true">
          <ScenarioIcon scenarioKey={scenario.key} />
        </div>
        <div className="scenario-content">
          <div className="scenario-meta">
            <span>{SPANISH_LEVEL_LABELS[level]}</span>
            <span>Conversación libre</span>
          </div>
          <div className="scenario-heading">
            <h2>{scenario.title}</h2>
            <span className="scenario-arrow" aria-hidden="true">
              →
            </span>
          </div>
          <p>{scenario.blurb}</p>
        </div>
      </Link>

      <div className="level-control">
        <div className="level-copy">
          <span className="level-label">Nivel de español</span>
          <span className="level-description" aria-live="polite">
            {SPANISH_LEVEL_LABELS[level]}
          </span>
        </div>
        <div className="level-stepper" role="group" aria-label="Cambiar nivel de español">
          <button
            type="button"
            onClick={() => changeLevel(-1)}
            disabled={level === MIN_SPANISH_LEVEL}
            aria-label="Bajar nivel"
          >
            −
          </button>
          <output aria-label={`Nivel ${level}`}>{level}</output>
          <button
            type="button"
            onClick={() => changeLevel(1)}
            disabled={level === MAX_SPANISH_LEVEL}
            aria-label="Subir nivel"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}

const ICON_PATHS: Record<string, string[]> = {
  restaurant: [
    "M28 56h40M34 56c0-11 6-20 14-20s14 9 14 20M48 36v-5",
    "M25 62h46",
    "M19 32v16c0 4 3 7 7 7M26 32v31M74 32v31M69 32v12c0 3 2 5 5 5",
  ],
  frutas: [
    "M48 36c-5-4-20-4-22 10-2 14 8 26 15 26 3 0 5-2 7-2s4 2 7 2c7 0 17-12 15-26-2-14-17-14-22-10z",
    "M48 36c0-6 2-10 6-12",
    "M53 29c3-4 9-5 12-3-2 4-8 5-12 3z",
  ],
  tacos: [
    "M18 64c0-17 13-30 30-30s30 13 30 30z",
    "M28 64c0-11 9-20 20-20s20 9 20 20",
    "M24 47l5-3 4 4 5-4 4 3 6-3 4 3 6-3 4 4 5-2 4 3",
  ],
  super: [
    "M18 28h8l8 32h34l6-22H29",
    "M36 49h35",
    "M38 70a4 4 0 1 0 0.1 0M64 70a4 4 0 1 0 0.1 0",
  ],
  taxi: [
    "M20 62V50l7-14h42l7 14v12z",
    "M40 36v-6h16v6",
    "M22 50h52",
    "M32 63a5 5 0 1 0 0.1 0M64 63a5 5 0 1 0 0.1 0",
  ],
  gimnasio: [
    "M34 48h28",
    "M28 36v24M36 32v32M60 32v32M68 36v24",
    "M20 48h8M68 48h8",
  ],
};

function ScenarioIcon({ scenarioKey }: { scenarioKey: string }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      {(ICON_PATHS[scenarioKey] ?? []).map((path) => (
        <path
          key={path}
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
