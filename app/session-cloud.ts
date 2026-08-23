import type { SupabaseClient } from "@supabase/supabase-js";
import type { PracticeSession, TranscriptTurn } from "./session-history";
import type { SpanishLevel } from "./spanish-level";

type PracticeSessionRow = {
  id: string;
  scenario: string;
  level: number;
  started_at: string;
  ended_at: string;
  turns: TranscriptTurn[];
};

export async function saveCloudPracticeSession(
  client: SupabaseClient,
  session: PracticeSession,
) {
  const { error } = await client
    .from("practice_sessions")
    .upsert(toRow(session), { onConflict: "id" });

  if (error) throw error;
}

export async function syncPracticeSessions(
  client: SupabaseClient,
  scenario: string,
  localSessions: PracticeSession[],
) {
  if (localSessions.length > 0) {
    const { error } = await client
      .from("practice_sessions")
      .upsert(localSessions.map(toRow), { onConflict: "id" });

    if (error) throw error;
  }

  const { data, error } = await client
    .from("practice_sessions")
    .select("id,scenario,level,started_at,ended_at,turns")
    .eq("scenario", scenario)
    .order("started_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as PracticeSessionRow[]).map(fromRow);
}

function toRow(session: PracticeSession): PracticeSessionRow {
  return {
    id: session.id,
    scenario: session.scenario,
    level: session.level,
    started_at: session.startedAt,
    ended_at: session.endedAt,
    turns: session.turns,
  };
}

function fromRow(row: PracticeSessionRow): PracticeSession {
  return {
    id: row.id,
    scenario: row.scenario,
    level: row.level as SpanishLevel,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    turns: row.turns,
  };
}
