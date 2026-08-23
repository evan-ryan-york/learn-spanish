"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { PracticeSession } from "./session-history";

export type TranscriptChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  status?: "pending" | "error";
};

type ChatResponse = {
  reply?: string;
  error?: string;
};

const SUGGESTIONS = [
  "How would I say “I'll have the water, please”?",
  "What did the server ask me, word by word?",
  "How could I have answered more naturally?",
];

export default function TranscriptChat({
  session,
  messages,
  onMessagesChange,
}: {
  session: PracticeSession;
  messages: TranscriptChatMessage[];
  onMessagesChange: (sessionId: string, messages: TranscriptChatMessage[]) => void;
}) {
  const [question, setQuestion] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const logRef = useRef<HTMLOListElement | null>(null);
  const isWaiting = messages.some((message) => message.status === "pending");

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }, [question]);

  useLayoutEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);

  const ask = async (rawQuestion: string) => {
    const text = rawQuestion.trim();
    if (!text || isWaiting) return;

    setQuestion("");

    const history: TranscriptChatMessage[] = [
      ...messages.filter((message) => !message.status),
      { id: createId(), role: "user", text },
    ];
    const replyId = createId();
    onMessagesChange(session.id, [
      ...history,
      { id: replyId, role: "assistant", text: "", status: "pending" },
    ]);

    const settle = (reply: TranscriptChatMessage) =>
      onMessagesChange(session.id, [...history, reply]);

    try {
      const response = await fetch("/api/transcript-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level: session.level,
          turns: session.turns.map((turn) => ({
            role: turn.role,
            text: turn.text,
            translation: turn.translation,
          })),
          messages: history.map((message) => ({
            role: message.role,
            text: message.text,
          })),
        }),
      });
      const payload = (await response.json().catch(() => null)) as ChatResponse | null;

      if (!response.ok || !payload?.reply) {
        throw new Error(payload?.error ?? "No se pudo responder la pregunta.");
      }

      settle({ id: replyId, role: "assistant", text: payload.reply });
    } catch (error) {
      console.error("Transcript chat error:", error);
      settle({
        id: replyId,
        role: "assistant",
        text: "Something went wrong. Ask again in a moment.",
        status: "error",
      });
    }
  };

  return (
    <section className="transcript-chat" aria-label="Preguntas sobre la transcripción">
      <div className="transcript-chat-heading">
        <h4>¿Tienes dudas?</h4>
        <p lang="en">Ask anything about this conversation — in English.</p>
      </div>

      {messages.length === 0 ? (
        <div className="transcript-chat-suggestions" lang="en">
          {SUGGESTIONS.map((suggestion) => (
            <button
              className="transcript-chat-suggestion"
              key={suggestion}
              type="button"
              onClick={() => void ask(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : (
        <ol className="transcript-chat-log" lang="en" ref={logRef}>
          {messages.map((message) => (
            <li
              className={`transcript-chat-message transcript-chat-message--${message.role}`}
              key={message.id}
            >
              <span>{message.role === "user" ? "Tú" : "Rato"}</span>
              <div
                className={
                  message.status
                    ? `transcript-chat-bubble transcript-chat-bubble--${message.status}`
                    : "transcript-chat-bubble"
                }
              >
                {message.status === "pending" ? "Thinking…" : message.text}
              </div>
            </li>
          ))}
        </ol>
      )}

      <form
        className="transcript-chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(question);
        }}
      >
        <textarea
          ref={inputRef}
          lang="en"
          rows={1}
          value={question}
          placeholder="How do I say “I'll have the water, please”?"
          aria-label="Tu pregunta sobre la transcripción"
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void ask(question);
            }
          }}
        />
        <button
          type="submit"
          disabled={isWaiting || question.trim().length === 0}
          aria-label="Enviar pregunta"
        >
          <SendIcon />
        </button>
      </form>
    </section>
  );
}

function createId() {
  return typeof crypto.randomUUID === "function"
    ? `chat-${crypto.randomUUID()}`
    : `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Enviar">
      <path
        d="M4 12h13M11.5 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
