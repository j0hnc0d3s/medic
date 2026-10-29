# Medic — Wearable Vitals Simulator

A standalone vitals **data source**, not a viewing dashboard. Simulates a
PPG wearable (heart rate, SpO2, respiratory rate, temperature, blood
pressure) and streams readings to the existing `web_app` backend for a
specific patient, identified by their queue entry ID (the same ID assigned
at check-in in `kiosk_handheld` or the patient app).

A real wearable device would call the same endpoint this app calls —
`POST /api/vitals/<entryId>` — so swapping this simulator for real hardware
later is a drop-in change, not a rework.

## How it works

1. Enter the patient's queue entry ID to pair.
2. Pick a simulated condition (Normal / Elevated / Critical) — each has its
   own realistic vitals range.
3. Press **Start streaming**. A new reading is generated every 2.5s with a
   small random drift from the last one (so it looks like a live sensor,
   not random noise) and pushed to the backend.

`bedside_monitor/` (and later, the TriageNurse view in `web_app`) reads
these back via `GET /api/vitals/<entryId>/latest` and
`GET /api/vitals/<entryId>/history`.

## Backend

Added one new route file, `web_app/backend/app/routes/vitals.py`, registered
alongside the existing routes — no changes to anything that already worked.
Readings are stored per patient under `queueEntries/{id}/vitals`, with the
most recent one mirrored onto the parent document for a fast "latest" read.

## Dev

```bash
npm install
npm run dev   # http://localhost:5176
```

## Deploy

Vercel project, Root Directory `wearable/`, env var `VITE_PUBLIC_API_URL`
set to the Railway backend URL — same pattern as `display/` and
`kiosk_handheld/`. Add the deployed domain to the backend's
`ALLOWED_ORIGINS` on Railway.
