import type { SpanishLevel } from "./spanish-level";

export type TranscriptRole = "user" | "assistant";

export type TranscriptTurn = {
  id: string;
  role: TranscriptRole;
  text: string;
  translation?: string;
  createdAt: string;
};

export type PracticeSession = {
  id: string;
  scenario: string;
  level: SpanishLevel;
  startedAt: string;
  endedAt: string;
  turns: TranscriptTurn[];
};

export type DraftPracticeSession = Omit<PracticeSession, "endedAt">;

const STORAGE_KEY = "rato:practice-sessions:v1";

function isPracticeSession(value: unknown): value is PracticeSession {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<PracticeSession>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.scenario === "string" &&
    Number.isInteger(candidate.level) &&
    candidate.level! >= 1 &&
    candidate.level! <= 5 &&
    typeof candidate.startedAt === "string" &&
    Number.isFinite(Date.parse(candidate.startedAt)) &&
    typeof candidate.endedAt === "string" &&
    Number.isFinite(Date.parse(candidate.endedAt)) &&
    Array.isArray(candidate.turns) &&
    candidate.turns.every(
      (turn) =>
        turn &&
        typeof turn.id === "string" &&
        (turn.role === "user" || turn.role === "assistant") &&
        typeof turn.text === "string" &&
        (turn.translation === undefined || typeof turn.translation === "string") &&
        typeof turn.createdAt === "string",
    )
  );
}

function readAllSessions(): PracticeSession[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isPracticeSession) : [];
  } catch {
    return [];
  }
}

export function loadPracticeSessions(scenario: string): PracticeSession[] {
  return readAllSessions()
    .filter((session) => session.scenario === scenario)
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
}

export function savePracticeSession(session: PracticeSession): PracticeSession[] {
  const nextSessions = [
    session,
    ...readAllSessions().filter((savedSession) => savedSession.id !== session.id),
  ];

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
  } catch {
    // Keep the newly completed session visible in memory if storage is unavailable.
  }

  return nextSessions
    .filter((savedSession) => savedSession.scenario === session.scenario)
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
}

export function replacePracticeSessions(
  scenario: string,
  sessions: PracticeSession[],
) {
  const untouchedSessions = readAllSessions().filter(
    (session) => session.scenario !== scenario,
  );
  const nextSessions = [...sessions, ...untouchedSessions];

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
  } catch {
    // Keep the cloud sessions visible in memory if storage is unavailable.
  }

  return sessions
    .slice()
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
}
