import type { SupabaseClient } from "@supabase/supabase-js";

export type SavedPhrase = {
  id: string;
  spanish: string;
  english: string;
  scenario: string;
  createdAt: string;
};

type SavedPhraseRow = {
  id: string;
  spanish: string;
  english: string;
  scenario: string;
  created_at: string;
};

const STORAGE_KEY = "rato:saved-phrases:v1";

function isSavedPhrase(value: unknown): value is SavedPhrase {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<SavedPhrase>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.spanish === "string" &&
    typeof candidate.english === "string" &&
    typeof candidate.scenario === "string" &&
    typeof candidate.createdAt === "string"
  );
}

function sortNewestFirst(phrases: SavedPhrase[]) {
  return phrases.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function writePhrases(phrases: SavedPhrase[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(phrases));
  } catch {
    // Keep the phrases visible in memory if storage is unavailable.
  }
}

export function loadSavedPhrases(): SavedPhrase[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as unknown;
    return Array.isArray(parsed) ? sortNewestFirst(parsed.filter(isSavedPhrase)) : [];
  } catch {
    return [];
  }
}

export function saveSavedPhrase(phrase: SavedPhrase): SavedPhrase[] {
  const nextPhrases = sortNewestFirst([
    phrase,
    ...loadSavedPhrases().filter((savedPhrase) => savedPhrase.id !== phrase.id),
  ]);
  writePhrases(nextPhrases);
  return nextPhrases;
}

export function removeSavedPhrase(id: string): SavedPhrase[] {
  const nextPhrases = loadSavedPhrases().filter((phrase) => phrase.id !== id);
  writePhrases(nextPhrases);
  return nextPhrases;
}

export function replaceSavedPhrases(phrases: SavedPhrase[]): SavedPhrase[] {
  const nextPhrases = sortNewestFirst(phrases);
  writePhrases(nextPhrases);
  return nextPhrases;
}

export async function saveCloudPhrase(client: SupabaseClient, phrase: SavedPhrase) {
  const { error } = await client
    .from("saved_phrases")
    .upsert(toRow(phrase), { onConflict: "id" });

  if (error) throw error;
}

export async function deleteCloudPhrase(client: SupabaseClient, id: string) {
  const { error } = await client.from("saved_phrases").delete().eq("id", id);

  if (error) throw error;
}

export async function syncSavedPhrases(
  client: SupabaseClient,
  localPhrases: SavedPhrase[],
) {
  if (localPhrases.length > 0) {
    const { error } = await client
      .from("saved_phrases")
      .upsert(localPhrases.map(toRow), { onConflict: "id" });

    if (error) throw error;
  }

  const { data, error } = await client
    .from("saved_phrases")
    .select("id,spanish,english,scenario,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as SavedPhraseRow[]).map(fromRow);
}

function toRow(phrase: SavedPhrase): SavedPhraseRow {
  return {
    id: phrase.id,
    spanish: phrase.spanish,
    english: phrase.english,
    scenario: phrase.scenario,
    created_at: phrase.createdAt,
  };
}

function fromRow(row: SavedPhraseRow): SavedPhrase {
  return {
    id: row.id,
    spanish: row.spanish,
    english: row.english,
    scenario: row.scenario,
    createdAt: row.created_at,
  };
}
