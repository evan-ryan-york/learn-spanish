"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState } from "react";
import {
  loadPracticeSessions,
  savePracticeSession,
  type DraftPracticeSession,
  type PracticeSession,
  type TranscriptRole,
} from "../session-history";
import { parseSpanishLevel } from "../spanish-level";

type SessionState = "idle" | "connecting" | "connected" | "error";

type RealtimeMessage = {
  type?: string;
  item_id?: string;
  transcript?: string;
  response?: { id?: string };
};

type TranslationResponse = {
  translations?: Array<{
    id: string;
    translation: string;
  }>;
  error?: string;
};

const statusCopy: Record<Exclude<SessionState, "error">, string> = {
  idle: "Cuando quieras, entramos.",
  connecting: "Preparando el restaurante…",
  connected: "Te escucho.",
};

export default function Restaurant({
  searchParams,
}: {
  searchParams: Promise<{ level?: string | string[] }>;
}) {
  const level = parseSpanishLevel(use(searchParams).level);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [status, setStatus] = useState(statusCopy.idle);
  const [pastSessions, setPastSessions] = useState<PracticeSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [translationFailures, setTranslationFailures] = useState<Set<string>>(
    () => new Set(),
  );
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentSessionRef = useRef<DraftPracticeSession | null>(null);
  const translationRequestsRef = useRef<Set<string>>(new Set());

  const addPendingTurn = useCallback((role: TranscriptRole, id?: string) => {
    currentSessionRef.current?.turns.push({
      id: id ?? createId(role),
      role,
      text: "",
      createdAt: new Date().toISOString(),
    });
  }, []);

  const completePendingTurn = useCallback(
    (role: TranscriptRole, transcript: string | undefined, id?: string) => {
      const currentSession = currentSessionRef.current;
      if (!currentSession) return;

      const text = transcript?.trim() ?? "";
      const pendingIndex = currentSession.turns.findIndex(
        (turn) => turn.role === role && turn.text === "",
      );

      if (!text) {
        if (pendingIndex >= 0) currentSession.turns.splice(pendingIndex, 1);
        return;
      }

      if (pendingIndex >= 0) {
        currentSession.turns[pendingIndex] = {
          ...currentSession.turns[pendingIndex],
          id: id ?? currentSession.turns[pendingIndex].id,
          text,
        };
        return;
      }

      currentSession.turns.push({
        id: id ?? createId(role),
        role,
        text,
        createdAt: new Date().toISOString(),
      });
    },
    [],
  );

  const translateAndStoreSession = useCallback(async (session: PracticeSession) => {
    const untranslatedTurns = session.turns.filter(
      (turn) => !turn.translation?.trim(),
    );

    if (
      untranslatedTurns.length === 0 ||
      translationRequestsRef.current.has(session.id)
    ) {
      return;
    }

    translationRequestsRef.current.add(session.id);
    setTranslationFailures((failures) => {
      const nextFailures = new Set(failures);
      nextFailures.delete(session.id);
      return nextFailures;
    });

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          turns: untranslatedTurns.map((turn) => ({
            id: turn.id,
            text: turn.text,
          })),
        }),
      });
      const payload = (await response.json().catch(() => null)) as TranslationResponse | null;

      if (!response.ok || !payload?.translations) {
        throw new Error(payload?.error ?? "No se pudo traducir la transcripción.");
      }

      const translations = new Map(
        payload.translations.map((translation) => [
          translation.id,
          translation.translation,
        ]),
      );

      if (translations.size !== untranslatedTurns.length) {
        throw new Error("La traducción está incompleta.");
      }

      const translatedSession = {
        ...session,
        turns: session.turns.map((turn) => ({
          ...turn,
          translation: turn.translation ?? translations.get(turn.id),
        })),
      };
      const savedSessions = savePracticeSession(translatedSession);
      setPastSessions(savedSessions);
    } catch (error) {
      console.error("Transcript translation error:", error);
      setTranslationFailures((failures) => new Set(failures).add(session.id));
    } finally {
      translationRequestsRef.current.delete(session.id);
    }
  }, []);

  const finalizeSession = useCallback(
    (updateHistory = true) => {
      const draft = currentSessionRef.current;
      currentSessionRef.current = null;

      if (!draft) return;

      const turns = draft.turns
        .map((turn) => ({ ...turn, text: turn.text.trim() }))
        .filter((turn) => turn.text.length > 0);
      const hasUserTurn = turns.some((turn) => turn.role === "user");
      const hasAssistantTurn = turns.some((turn) => turn.role === "assistant");

      if (!hasUserTurn || !hasAssistantTurn) return;

      const completedSession: PracticeSession = {
        ...draft,
        endedAt: new Date().toISOString(),
        turns,
      };
      const savedSessions = savePracticeSession(completedSession);

      if (updateHistory) {
        setPastSessions(savedSessions);
        void translateAndStoreSession(completedSession);
      }
    },
    [translateAndStoreSession],
  );

  const releaseConnection = useCallback(() => {
    dataChannelRef.current?.close();
    peerConnectionRef.current?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.remove();
    }

    dataChannelRef.current = null;
    peerConnectionRef.current = null;
    localStreamRef.current = null;
    remoteAudioRef.current = null;
  }, []);

  const stopConversation = useCallback(() => {
    finalizeSession();
    releaseConnection();
    setSessionState("idle");
    setStatus("Hasta la próxima.");
  }, [finalizeSession, releaseConnection]);

  const startConversation = useCallback(async () => {
    if (sessionState === "connecting" || sessionState === "connected") return;

    setSessionState("connecting");
    setStatus(statusCopy.connecting);
    currentSessionRef.current = {
      id: createId("session"),
      scenario: "restaurant",
      level,
      startedAt: new Date().toISOString(),
      turns: [],
    };

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Este navegador no permite usar el micrófono.");
      }

      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      const remoteAudio = document.createElement("audio");
      remoteAudio.autoplay = true;
      remoteAudio.setAttribute("playsinline", "true");
      remoteAudioRef.current = remoteAudio;

      peerConnection.ontrack = (event) => {
        remoteAudio.srcObject = event.streams[0];
        void remoteAudio.play().catch(() => {
          setStatus("Toca otra vez para activar el audio.");
        });
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === "connected") {
          setSessionState("connected");
          setStatus("Te escucho.");
        }

        if (peerConnection.connectionState === "disconnected") {
          setStatus("Reconectando…");
        }

        if (peerConnection.connectionState === "failed") {
          setSessionState("error");
          setStatus("Se perdió la conexión. Toca para intentarlo otra vez.");
          finalizeSession();
          releaseConnection();
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;
      stream.getAudioTracks().forEach((track) => peerConnection.addTrack(track, stream));

      const dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;

      dataChannel.addEventListener("open", () => {
        setSessionState("connected");
        setStatus("Ya casi…");
        dataChannel.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions:
                `Empieza ya como una persona que trabaja en un café mexicano. Saluda brevemente y pregunta si el pedido es para comer aquí o para llevar. Mantén exactamente el ritmo y la complejidad del nivel ${level} configurado para la sesión.`,
            },
          }),
        );
      });

      dataChannel.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data) as RealtimeMessage;

          if (message.type === "input_audio_buffer.speech_started") {
            addPendingTurn("user", message.item_id);
            setStatus("Te escucho…");
          } else if (
            message.type === "conversation.item.input_audio_transcription.completed"
          ) {
            completePendingTurn("user", message.transcript, message.item_id);
          } else if (
            message.type === "conversation.item.input_audio_transcription.failed"
          ) {
            completePendingTurn("user", undefined, message.item_id);
          } else if (message.type === "input_audio_buffer.speech_stopped") {
            setStatus("Pensando…");
          } else if (message.type === "response.created") {
            addPendingTurn("assistant", message.response?.id);
            setStatus("Pensando…");
          } else if (message.type === "response.output_audio_transcript.done") {
            completePendingTurn("assistant", message.transcript, message.item_id);
          } else if (
            message.type === "response.output_audio.delta" ||
            message.type === "response.audio.delta"
          ) {
            setStatus("Hablando…");
          } else if (message.type === "response.done") {
            setStatus("Tu turno.");
          } else if (message.type === "error") {
            setStatus("Algo salió mal. Termina e inténtalo de nuevo.");
          }
        } catch {
          // Ignore non-JSON data channel messages.
        }
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const response = await fetch(`/api/session?level=${level}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          "Content-Type": "application/sdp",
        },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "No se pudo iniciar la sesión.");
      }

      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: await response.text(),
      });
    } catch (error) {
      finalizeSession();
      releaseConnection();
      setSessionState("error");

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setStatus("Necesito permiso para usar tu micrófono.");
      } else {
        setStatus(error instanceof Error ? error.message : "No se pudo empezar.");
      }
    }
  }, [
    addPendingTurn,
    completePendingTurn,
    finalizeSession,
    level,
    releaseConnection,
    sessionState,
  ]);

  useEffect(() => {
    setPastSessions(loadPracticeSessions("restaurant"));
  }, []);

  useEffect(
    () => () => {
      finalizeSession(false);
      releaseConnection();
    },
    [finalizeSession, releaseConnection],
  );

  const isActive = sessionState === "connecting" || sessionState === "connected";
  const selectedSession = pastSessions.find((session) => session.id === selectedSessionId);

  return (
    <main className="home-shell restaurant-shell notranslate" translate="no">
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

      <section className="conversation-card" aria-labelledby="page-title">
        <Link className="back-link" href="/">
          ← Escenarios
        </Link>
        <div className="eyebrow">EN EL RESTAURANTE · NIVEL {level}</div>
        <h1 id="page-title">
          Tu mesa está
          <br />
          <em>lista.</em>
        </h1>
        <p className="intro">
          Entra al café y habla con quien te atiende. La conversación seguirá tu dirección.
        </p>

        <div className={`voice-stage voice-stage--${sessionState}`}>
          <span className="voice-ring voice-ring--outer" aria-hidden="true" />
          <span className="voice-ring voice-ring--inner" aria-hidden="true" />
          <button
            className="voice-button"
            type="button"
            onClick={isActive ? stopConversation : startConversation}
            aria-label={isActive ? "Terminar conversación" : "Empezar conversación"}
            aria-pressed={isActive}
          >
            {isActive ? <StopIcon /> : <MicrophoneIcon />}
          </button>
        </div>

        <div className="session-copy" aria-live="polite">
          <p className="session-action">
            {isActive ? "Toca para terminar" : "Toca para empezar"}
          </p>
          <p className="session-status">{status}</p>
        </div>
      </section>

      <section className="session-history" aria-labelledby="session-history-title">
        <div className="session-history-heading">
          <div className="eyebrow">TUS PRÁCTICAS</div>
          <h2 id="session-history-title">Sesiones anteriores</h2>
          <p>Guardadas en este dispositivo.</p>
        </div>

        {pastSessions.length === 0 ? (
          <div className="session-history-empty">
            Las sesiones aparecerán aquí después de que tú y Rato hayan hablado.
          </div>
        ) : (
          <ul className="session-history-list">
            {pastSessions.map((session) => {
              const isSelected = session.id === selectedSessionId;
              const transcriptId = `transcript-${session.id}`;
              const preview =
                session.turns.find((turn) => turn.role === "user")?.text ??
                session.turns[0]?.text;

              return (
                <li key={session.id}>
                  <button
                    className="session-history-button"
                    type="button"
                    onClick={() => {
                      setSelectedSessionId(isSelected ? null : session.id);
                      if (!isSelected) void translateAndStoreSession(session);
                    }}
                    aria-expanded={isSelected}
                    aria-controls={isSelected ? transcriptId : undefined}
                  >
                    <span className="session-history-meta">
                      <span>{formatSessionDate(session.startedAt)}</span>
                      <span>Nivel {session.level}</span>
                      <span>{formatSessionDuration(session.startedAt, session.endedAt)}</span>
                    </span>
                    <span className="session-history-preview">{preview}</span>
                    <span className="session-history-arrow" aria-hidden="true">
                      {isSelected ? "−" : "+"}
                    </span>
                  </button>

                  {isSelected && selectedSession ? (
                    <article className="transcript" id={transcriptId}>
                      <div className="transcript-heading">
                        <h3>Transcripción</h3>
                        <span>{selectedSession.turns.length} turnos</span>
                      </div>
                      <ol>
                        {selectedSession.turns.map((turn) => (
                          <li className={`transcript-turn transcript-turn--${turn.role}`} key={turn.id}>
                            <span>{turn.role === "user" ? "Tú" : "Rato"}</span>
                            <div className="transcript-bubble">
                              <p className="transcript-original">{turn.text}</p>
                              <div className="transcript-translation" lang="en">
                                <span>English</span>
                                <p>
                                  {turn.translation ??
                                    (translationFailures.has(selectedSession.id)
                                      ? "Translation unavailable. Close and reopen this session to retry."
                                      : "Translating…")}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </article>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer>
        <span className="privacy-dot" aria-hidden="true" />
        El micrófono solo está activo durante la conversación · Historial local
      </footer>
    </main>
  );
}

function createId(prefix: string) {
  const uniquePart =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${uniquePart}`;
}

function formatSessionDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSessionDuration(startedAt: string, endedAt: string) {
  const elapsedMinutes = Math.max(
    1,
    Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 60_000),
  );

  return `${elapsedMinutes} min`;
}

function MicrophoneIcon() {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="Micrófono">
      <rect x="11" y="4" width="10" height="17" rx="5" fill="currentColor" />
      <path
        d="M7.5 16.5a8.5 8.5 0 0 0 17 0M16 25v4M11.5 29h9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="Terminar">
      <rect x="9" y="9" width="14" height="14" rx="3" fill="currentColor" />
    </svg>
  );
}
