import { NextResponse } from "next/server";
import { parseSpanishLevel, type SpanishLevel } from "../../spanish-level";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TranscriptTurnInput = {
  role: "user" | "assistant";
  text: string;
  translation?: string;
};

type ChatMessageInput = {
  role: "user" | "assistant";
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

const MAX_TURNS = 200;
const MAX_TURN_LENGTH = 4_000;
const MAX_TRANSCRIPT_LENGTH = 40_000;
const MAX_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 2_000;

function createTutorPrompt(level: SpanishLevel, transcript: string) {
  return `
# Who you are
You are a warm, precise Spanish tutor. The learner just finished a spoken practice conversation in Mexican Spanish and is now reviewing the transcript. They ask you questions about it afterwards, in English.

# Level
The conversation ran at level ${level} of 5, where 1 is a near-beginner and 5 is fluent. Pitch your Spanish suggestions at or just above that level: give them something they can actually say next time.

# How to answer
- Answer in English. Keep Spanish words, phrases and examples in Spanish.
- Be brief and concrete: usually two to five sentences. No preamble, no lecture, no bullet-point essays. Never restate the question.
- When the learner asks what something in the transcript meant, quote the exact Spanish from the transcript, translate it, and explain only the part that was confusing.
- When they ask how to say something, give the phrasing a real person in Mexico would use, then a literal gloss in parentheses when the wording is not obvious word-for-word. Mention register (formal / informal) only when it would change what they should say.
- When they ask why a word appeared instead of another one they expected (for example "bebida" versus "tomar"), explain the actual distinction plainly and give one example of each.
- Correct mistakes they made in the transcript gently and only when relevant to what they asked.
- If a question is not about Spanish or this conversation, answer it briefly if you can, and otherwise say so in one sentence.
- If the transcript does not contain what they are asking about, say that plainly instead of inventing it.
- Never claim you heard audio: you only have the transcript below.

# The transcript
Roles: "Learner" is the person you are helping. "Server" is the café or restaurant worker they practiced with. Lines marked "EN:" are an English translation that was generated afterwards.

${transcript}
`.trim();
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta OPENAI_API_KEY en el servidor." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    turns?: unknown;
    messages?: unknown;
    level?: unknown;
  } | null;

  const turns = parseTurns(body?.turns);
  const messages = parseMessages(body?.messages);
  const level = parseSpanishLevel(
    typeof body?.level === "number" ? String(body.level) : undefined,
  );

  if (!turns || !messages) {
    return NextResponse.json({ error: "La pregunta no es válida." }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TRANSCRIPT_CHAT_MODEL ?? "gpt-4o",
        store: false,
        instructions: createTutorPrompt(level, formatTranscript(turns)),
        input: messages.map((message) => ({
          role: message.role,
          content: message.text,
        })),
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as ResponsesPayload | null;

    if (!response.ok) {
      console.error("OpenAI transcript chat error:", response.status, payload);
      return NextResponse.json(
        { error: "No se pudo responder la pregunta." },
        { status: response.status },
      );
    }

    const reply = payload?.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === "output_text")
      ?.text?.trim();

    if (!reply) {
      console.error("OpenAI returned an empty transcript chat reply.");
      return NextResponse.json(
        { error: "La respuesta recibida no es válida." },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("OpenAI transcript chat connection error:", error);
    return NextResponse.json(
      { error: "No se pudo conectar con el servicio de preguntas." },
      { status: 502 },
    );
  }
}

function formatTranscript(turns: TranscriptTurnInput[]) {
  return turns
    .map((turn, index) => {
      const speaker = turn.role === "user" ? "Learner" : "Server";
      const translation = turn.translation ? `\n   EN: ${turn.translation}` : "";

      return `${index + 1}. ${speaker}: ${turn.text}${translation}`;
    })
    .join("\n");
}

function parseTurns(value: unknown): TranscriptTurnInput[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_TURNS) {
    return null;
  }

  const turns: TranscriptTurnInput[] = [];
  let totalLength = 0;

  for (const turn of value) {
    if (!turn || typeof turn !== "object") return null;

    const candidate = turn as Partial<TranscriptTurnInput>;
    const text = candidate.text?.trim();
    const translation = candidate.translation?.trim();

    if (candidate.role !== "user" && candidate.role !== "assistant") return null;
    if (!text || text.length > MAX_TURN_LENGTH) return null;
    if (translation && translation.length > MAX_TURN_LENGTH) return null;

    totalLength += text.length + (translation?.length ?? 0);
    if (totalLength > MAX_TRANSCRIPT_LENGTH) return null;

    turns.push({ role: candidate.role, text, translation: translation || undefined });
  }

  return turns;
}

function parseMessages(value: unknown): ChatMessageInput[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
    return null;
  }

  const messages: ChatMessageInput[] = [];

  for (const message of value) {
    if (!message || typeof message !== "object") return null;

    const candidate = message as Partial<ChatMessageInput>;
    const text = candidate.text?.trim();

    if (candidate.role !== "user" && candidate.role !== "assistant") return null;
    if (!text || text.length > MAX_MESSAGE_LENGTH) return null;

    messages.push({ role: candidate.role, text });
  }

  if (messages[messages.length - 1].role !== "user") return null;

  return messages;
}
