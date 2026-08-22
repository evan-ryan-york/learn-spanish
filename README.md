# Rato

A tiny, mobile-first Spanish conversation app using the OpenAI Realtime API over WebRTC.

## Run it locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Put your OpenAI API key in `.env.local`, then start the app:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and tap the microphone.

The API key is only read by the server route. Live audio travels directly between the browser and OpenAI over WebRTC.

## Try it on an iPhone

Microphone access requires a secure context. Deploy the app to an HTTPS host such as Vercel before testing it on your phone; opening a plain `http://` LAN address will not be enough. In Safari, use **Share → Add to Home Screen** to launch it like an app.

This first version is meant to validate foreground audio and AirPods behavior. Locked-screen and background microphone behavior still needs to be tested on the target iPhone.

## Configuration

- `OPENAI_API_KEY` — required and server-only.
- `OPENAI_REALTIME_MODEL` — defaults to `gpt-realtime-2.1`.
- `OPENAI_REALTIME_VOICE` — defaults to `marin`.

The `/api/session` route is intentionally minimal and has no user authentication. Add authentication and rate limiting before exposing it as a public product.

Implementation follows the [official OpenAI WebRTC guide](https://developers.openai.com/api/docs/guides/realtime-webrtc).
