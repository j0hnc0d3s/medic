# Medic — Queue Display

Standalone, unauthenticated queue display for the waiting room TV/kiosk
screen. Moved out of `web_app/frontend`'s old `/display` route into its
own app, since it's a public screen with nothing else in common with
the staff portal.

Polls `GET /api/queue/display` on the shared Medic backend (same
Railway backend as `web_app`) every 8s — no auth, no personal info by
design (see the comment at the top of `src/QueueDisplay.jsx`).

## Dev

    npm install
    npm run dev          # http://localhost:5174

## Deploy

Deploy as its own Vercel project (or any static host) with
`VITE_PUBLIC_API_URL` set to the backend URL. Once it has a domain,
add that domain to the backend's `ALLOWED_ORIGINS` env var on Railway,
or its queue-display calls will be blocked by CORS.
