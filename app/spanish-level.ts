export const MIN_SPANISH_LEVEL = 1;
export const MAX_SPANISH_LEVEL = 5;
export const DEFAULT_SPANISH_LEVEL = 1;

export type SpanishLevel = 1 | 2 | 3 | 4 | 5;

export const SPANISH_LEVEL_LABELS: Record<SpanishLevel, string> = {
  1: "Muy básico",
  2: "Básico",
  3: "Intermedio",
  4: "Avanzado",
  5: "Fluido",
};

export function parseSpanishLevel(
  value: string | string[] | null | undefined,
): SpanishLevel {
  const candidate = Array.isArray(value) ? value[0] : value;
  const level = Number(candidate);

  if (
    Number.isInteger(level) &&
    level >= MIN_SPANISH_LEVEL &&
    level <= MAX_SPANISH_LEVEL
  ) {
    return level as SpanishLevel;
  }

  return DEFAULT_SPANISH_LEVEL;
}
