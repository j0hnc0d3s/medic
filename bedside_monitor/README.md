# Medic — Bedside Monitor

A standalone, wall-mounted-screen display of a single patient's live vitals,
styled like an actual clinical monitor (black background, bright per-channel
colors, large tabular numerals) rather than the rest of the Medic product's
paper/teal look — on purpose, since that's what this device genuinely is.

Separate folder from `wearable/` by design — the wearable is the data
source, this is a pure viewer, and in a real deployment they're two
different pieces of hardware at the bedside.

## How it works

Pair by entering a patient's queue entry ID, or deep-link a specific bed's
screen straight to a patient with `?entry=<id>` in the URL. Polls the
backend every 3 seconds:

- `GET /api/vitals/<entryId>/latest` — current reading
- `GET /api/vitals/<entryId>/history` — last 30 readings, drawn as a small
  trend line under each vital

Out-of-normal-range vitals get a red outline. The live dot goes grey and
the header reads "No recent signal" if nothing's come in for 15 seconds
(e.g. the wearable stopped streaming).

Reads from the same `web_app` backend vitals routes `wearable/` writes to
— no backend changes needed beyond what `wearable/` already added.

## Dev

```bash
npm install
npm run dev   # http://localhost:5177
```

## Deploy

Vercel project, Root Directory `bedside_monitor/`, env var
`VITE_PUBLIC_API_URL` set to the Railway backend URL. Add the deployed
domain to the backend's `ALLOWED_ORIGINS` on Railway.
