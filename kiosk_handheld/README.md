# Medic — Kiosk / Handheld Check-In

Walk-in self-registration app for the Emergency Department: fixed kiosk screens
and handheld tablets used by overflow/critical patients without the Medic app.

Two tabs only:

- **Lookup Code** — find your existing queue position by full name, date of
  birth, and phone number (`POST /api/queue/find`).
- **New Intake** — a 7-step registration wizard that ends by emailing a
  6-digit verification code, then confirms it on-screen (`POST /api/queue/join`
  followed by `POST /api/queue/verify-code`) and shows your queue code.
  No "My Ticket" tab — once confirmed, the screen loops back to the two tabs
  for the next person in line.

Reuses the existing `web_app/backend` (Flask on Railway) — no backend changes
needed, these routes already exist in `app/routes/queue.py`.

## Dev

```bash
npm install
npm run dev   # http://localhost:5175
```

## Deploy

Deploy as its own Vercel project with Root Directory set to `kiosk_handheld/`.
Set `VITE_PUBLIC_API_URL` in Vercel's project env vars to the Railway backend URL.

Once the production domain is known, add it to the backend's `ALLOWED_ORIGINS`
env var on Railway (comma-separated) or `/api/queue/*` calls will be
CORS-blocked from this app.

## Idle reset

Since this runs on shared, unattended hardware, the app resets to the two
starting tabs after 90 seconds of no touch input — so a half-filled intake
form or a stranger's search results never sit on screen for the next patient.
