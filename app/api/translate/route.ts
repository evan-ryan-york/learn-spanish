import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TranslationTurn = {
  id: string;
  text: string;
};

type ResponsesPayload = {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

const MAX_TURNS = 100;
const MAX_TURN_LENGTH = 4_000;
const MAX_TOTAL_LENGTH = 30_000;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta OPENAI_API_KEY en el servidor." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as { turns?: unknown } | null;
  const turns = parseTurns(body?.turns);

  if (!turns) {
    return NextResponse.json(
      { error: "La transcripción no es válida." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-4o-mini",
        store: false,
        instructions:
          "Translate every transcript turn faithfully into natural English. Preserve meaning, tone, names, prices, and hesitations. Do not add explanations. If a turn is already in English, reproduce it unchanged. Return exactly one translation for every supplied ID.",
        input: JSON.stringify({ turns }),
        text: {
          format: {
            type: "json_schema",
            name: "transcript_translations",
            strict: true,
            schema: {
              type: "object",
              properties: {
                translations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      translation: { type: "string" },
                    },
                    required: ["id", "translation"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["translations"],
              additionalProperties: false,
            },
          },
        },
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as ResponsesPayload | null;

    if (!response.ok) {
      console.error("OpenAI translation error:", response.status, payload);
      return NextResponse.json(
        { error: "No se pudo traducir la transcripción." },
        { status: response.status },
      );
    }

    const outputText = payload?.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === "output_text")?.text;
    const translated = outputText ? parseTranslationOutput(outputText, turns) : null;

    if (!translated) {
      console.error("OpenAI returned an invalid translation payload.");
      return NextResponse.json(
        { error: "La traducción recibida no es válida." },
        { status: 502 },
      );
    }

    return NextResponse.json({ translations: translated });
  } catch (error) {
    console.error("OpenAI translation connection error:", error);
    return NextResponse.json(
      { error: "No se pudo conectar con el servicio de traducción." },
      { status: 502 },
    );
  }
}

function parseTurns(value: unknown): TranslationTurn[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_TURNS) {
    return null;
  }

  const turns: TranslationTurn[] = [];
  let totalLength = 0;

  for (const turn of value) {
    if (!turn || typeof turn !== "object") return null;

    const candidate = turn as Partial<TranslationTurn>;
    const id = candidate.id?.trim();
    const text = candidate.text?.trim();

    if (!id || !text || text.length > MAX_TURN_LENGTH) return null;

    totalLength += text.length;
    if (totalLength > MAX_TOTAL_LENGTH) return null;

    turns.push({ id, text });
  }

  if (new Set(turns.map((turn) => turn.id)).size !== turns.length) return null;

  return turns;
}

function parseTranslationOutput(
  outputText: string,
  sourceTurns: TranslationTurn[],
): Array<{ id: string; translation: string }> | null {
  try {
    const parsed = JSON.parse(outputText) as {
      translations?: Array<{ id?: unknown; translation?: unknown }>;
    };

    if (!Array.isArray(parsed.translations)) return null;

    const sourceIds = new Set(sourceTurns.map((turn) => turn.id));
    const translations = parsed.translations
      .filter(
        (item): item is { id: string; translation: string } =>
          typeof item.id === "string" &&
          sourceIds.has(item.id) &&
          typeof item.translation === "string" &&
          item.translation.trim().length > 0,
      )
      .map((item) => ({
        id: item.id,
        translation: item.translation.trim(),
      }));

    if (
      translations.length !== sourceTurns.length ||
      new Set(translations.map((translation) => translation.id)).size !== sourceTurns.length
    ) {
      return null;
    }

    return translations;
  } catch {
    return null;
  }
}
