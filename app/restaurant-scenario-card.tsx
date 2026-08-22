"use client";

import Link from "next/link";
import { useState } from "react";
import {
  DEFAULT_SPANISH_LEVEL,
  MAX_SPANISH_LEVEL,
  MIN_SPANISH_LEVEL,
  SPANISH_LEVEL_LABELS,
  type SpanishLevel,
} from "./spanish-level";

export default function RestaurantScenarioCard() {
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
        href={{ pathname: "/restaurant", query: { level } }}
        aria-label={`Practicar en el restaurante, nivel ${level}`}
      >
        <div className="scenario-art" aria-hidden="true">
          <RestaurantIcon />
        </div>
        <div className="scenario-content">
          <div className="scenario-meta">
            <span>{SPANISH_LEVEL_LABELS[level]}</span>
            <span>Conversación libre</span>
          </div>
          <div className="scenario-heading">
            <h2>Restaurante</h2>
            <span className="scenario-arrow" aria-hidden="true">
              →
            </span>
          </div>
          <p>Pide una mesa, pregunta por los especiales y ordena algo para comer.</p>
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

function RestaurantIcon() {
  return (
    <svg viewBox="0 0 96 96" role="img" aria-label="Restaurante">
      <path
        d="M28 56h40M34 56c0-11 6-20 14-20s14 9 14 20M48 36v-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M25 62h46"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M19 32v16c0 4 3 7 7 7M26 32v31M74 32v31M69 32v12c0 3 2 5 5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
