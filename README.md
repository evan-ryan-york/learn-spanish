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

Add your OpenAI and Supabase credentials to `.env.local`, then open [http://localhost:3019](http://localhost:3019).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | Creates Realtime sessions and transcript translations from the server. |
| `OPENAI_REALTIME_MODEL` | No | Defaults to `gpt-realtime-2.1`. |
| `OPENAI_REALTIME_VOICE` | No | Defaults to `marin`. |
| `OPENAI_TRANSCRIPTION_MODEL` | No | Defaults to `gpt-4o-mini-transcribe` for user transcripts. |
| `OPENAI_TRANSLATION_MODEL` | No | Defaults to `gpt-4o-mini` for English transcript translations. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL used for authentication and session sync. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser-safe Supabase publishable key; RLS protects session rows. |

Never commit `.env.local` or an API key. The standard OpenAI key remains on the server and is not sent to the browser.

## Testing on a phone

Microphone access requires HTTPS. Open the deployed app in Safari, allow microphone access, and optionally use **Share → Add to Home Screen**. Foreground audio is working; locked-screen and extended background behavior still needs device testing.

Completed conversation transcripts and their English translations are cached locally. After passwordless email sign-in, they are also synced through Supabase and appear on every device using the same account. Existing local sessions are migrated on the first sign-in.

## Security

The current `/api/session` and `/api/translate` endpoints have no user authentication or rate limiting. The deployed app is suitable for personal testing, but those controls should be added before sharing it broadly because calls consume the configured OpenAI account's balance. Supabase session rows are protected separately with per-user Row Level Security policies in the checked-in migration.

The Realtime implementation follows the [official OpenAI WebRTC guide](https://developers.openai.com/api/docs/guides/realtime-webrtc).
