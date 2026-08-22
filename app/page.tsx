"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SessionState = "idle" | "connecting" | "connected" | "error";

const statusCopy: Record<Exclude<SessionState, "error">, string> = {
  idle: "Cuando quieras, empezamos.",
  connecting: "Preparando la conversación…",
  connected: "Te escucho.",
};

export default function Home() {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [status, setStatus] = useState(statusCopy.idle);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

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
    releaseConnection();
    setSessionState("idle");
    setStatus("Hasta la próxima.");
  }, [releaseConnection]);

  const startConversation = useCallback(async () => {
    if (sessionState === "connecting" || sessionState === "connected") return;

    setSessionState("connecting");
    setStatus(statusCopy.connecting);

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
                "Inicia la conversación ahora con un saludo mexicano breve y natural. Pregunta cómo está el usuario o qué hizo hoy.",
            },
          }),
        );
      });

      dataChannel.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data) as { type?: string };

          if (message.type === "input_audio_buffer.speech_started") {
            setStatus("Te escucho…");
          } else if (message.type === "input_audio_buffer.speech_stopped") {
            setStatus("Pensando…");
          } else if (message.type === "response.created") {
            setStatus("Pensando…");
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

      const response = await fetch("/api/session", {
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
      releaseConnection();
      setSessionState("error");

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setStatus("Necesito permiso para usar tu micrófono.");
      } else {
        setStatus(error instanceof Error ? error.message : "No se pudo empezar.");
      }
    }
  }, [releaseConnection, sessionState]);

  useEffect(() => releaseConnection, [releaseConnection]);

  const isActive = sessionState === "connecting" || sessionState === "connected";

  return (
    <main className="home-shell notranslate" translate="no">
      <div className="grain" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="#top" aria-label="Rato, inicio">
          rato<span>.</span>
        </a>
        <div className="locale-pill">
          <span aria-hidden="true">🇲🇽</span>
          Español de México
        </div>
      </header>

      <section id="top" className="conversation-card" aria-labelledby="page-title">
        <div className="eyebrow">CONVERSACIÓN LIBRE</div>
        <h1 id="page-title">
          Un ratito para
          <br />
          <em>hablar español.</em>
        </h1>
        <p className="intro">
          Sin lecciones ni presión. Solo una conversación tranquila, a tu ritmo.
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

      <footer>
        <span className="privacy-dot" aria-hidden="true" />
        El micrófono solo está activo durante la conversación
      </footer>
    </main>
  );
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
