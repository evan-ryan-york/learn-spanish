# Rato

A mobile-first web app for natural Mexican Spanish conversation practice. It uses the OpenAI Realtime API and WebRTC for low-latency, speech-to-speech conversations.

[Try the deployed app](https://learn-spanish-nu.vercel.app)

## What it does

- Starts a Spanish conversation with one tap.
- Adapts its vocabulary and pace to the speaker.
- Uses short, natural turns and everyday Mexican Spanish.
- Runs as an installable web app on desktop and mobile.
- Sends live audio directly between the browser and OpenAI over WebRTC.

## Local development

Requirements: Node.js 20+ and pnpm 10+.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Add your OpenAI API key to `.env.local`, then open [http://localhost:3019](http://localhost:3019).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | Creates Realtime sessions from the server. |
| `OPENAI_REALTIME_MODEL` | No | Defaults to `gpt-realtime-2.1`. |
| `OPENAI_REALTIME_VOICE` | No | Defaults to `marin`. |

Never commit `.env.local` or an API key. The standard OpenAI key remains on the server and is not sent to the browser.

## Testing on a phone

Microphone access requires HTTPS. Open the deployed app in Safari, allow microphone access, and optionally use **Share → Add to Home Screen**. Foreground audio is working; locked-screen and extended background behavior still needs device testing.

## Security

The current `/api/session` endpoint has no user authentication or rate limiting. The deployed app is suitable for personal testing, but those controls should be added before sharing it broadly because calls consume the configured OpenAI account's balance.

The Realtime implementation follows the [official OpenAI WebRTC guide](https://developers.openai.com/api/docs/guides/realtime-webrtc).
