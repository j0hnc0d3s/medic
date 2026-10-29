# Medic — Patient Mobile App

A true native Expo app (iOS/Android/web) for patients — the mobile
counterpart to `web_app/frontend`'s patient portal, with full feature
parity: overview, appointments, messaging, records, and profile/settings,
as five tabs.

Styled in the spirit of the FreshFoods mobile app (`mobile_app/frontend`
in that project) — a floating pill-shaped bottom tab bar, the same
`src/constants/colors.ts` convention, expo-router file-based routing —
but with Medic's own blue/white + black/grey identity (navy `#12255E`
instead of FreshFoods' green) rather than copying its look.

## Reuses the existing backend — nothing new stood up

This app talks to the **same Firebase project** `web_app/frontend` uses
(same `.env` values, copied over), the same way: Firebase Auth for
sign-in, and the Firestore client SDK directly for patient data —
matching the web app's own services file-for-file:

| Screen | Mirrors | Collections |
|---|---|---|
| Overview | `PatientOverview.jsx`'s real data (not its draggable staff-canvas UI — see note below) | `appointments`, `patients` |
| Appointments | `PatientAppointments.jsx` | `appointments` |
| Messaging | `PatientMessaging.jsx` + `PatientSidebar.jsx`'s eligibility rule | `conversations`, `conversations/{id}/messages`, `users` |
| Records (Documents) | `PatientDocuments.jsx` | `documents`, `labs`, `imaging` |
| Profile | `PatientSettings.jsx` + account header | `users` |

Sign-in mirrors `Login.jsx` exactly: Firebase client sign-in → ID token →
`POST /api/auth/login` to verify (this app rejects non-patient accounts,
since it's patient-only) → Firestore profile load. Account creation
mirrors it too: `POST /api/auth/register` with `role: 'patient'`, then
client sign-in.

**Note on Overview:** `PatientOverview.jsx` is actually a copy of the
staff `NurseOverview.jsx` canvas — a draggable, connector-line medical
history diagram. That's a desktop interaction pattern, not a mobile
one, so this app's Overview tab shows the same underlying data (next
appointment, active allergies, active medications) as a normal scrolling
list instead of porting the drag-and-drop canvas.

## Setup

```bash
npm install
npx expo start
```

`.env` already has this session's Firebase config and
`EXPO_PUBLIC_API_URL` copied from `web_app/frontend/.env` — update both
if either changes.

## Structure

```
src/
  app/              expo-router screens (file-based routing)
    (tabs)/          the 5 tabs + floating pill tab bar
    conversation/    chat thread screen
    login.tsx
  components/       TabBar
  constants/        colors.ts
  contexts/         AuthContext (same shape as the web app's)
  services/         firebase.ts, api.ts, + one file per feature area,
                     each a direct TypeScript port of the matching
                     web_app/frontend service (same collections, same
                     field names, same query shape)
```

## Verified

`npm install` + `npx tsc --noEmit` clean. Metro bundling itself needs a
simulator/device/EAS build to fully verify — not run in this environment.
