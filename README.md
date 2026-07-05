# Medic

Medic is a clinic management system with separate portals for patients, clinical staff (doctors, nurses, receptionists), and administrators, plus a public queue/check-in flow and a lobby display screen.

Feel free to access our website link here `https://the-medic-system.vercel.app`, and read through our README, to get a grasp on what to expect and look out for.

---

## Meet the Team

Built by **FlowState**.

| Name | ID Number | School Email | Role |
|---|---|---|---|
| Jilian Budd | 620162142 | jilian.budd@mymona.uwi.edu | Team Lead — UAT & Documentation |
| Omelia Hamilton | 620156615 | omelia.hamilton@mymona.uwi.edu | UAT & Documentation |
| Josiah-John Green | 620149044 | josiah-john.green@mymona.uwi.edu | Team Lead — Frontend & Backend Development; Stakeholder Liaison, Public Hospital (UWI Hospital) |
| Willando Blair | 620165358 | willando.blair@mymona.uwi.edu | Frontend & Backend Development; Stakeholder Liaison, Private Clinic (Dr. Eikens) |

---

## Tech Stack

**Frontend**
- React (Vite)
- React Router
- Firebase SDK — Authentication, Firestore, Storage
- Plain CSS per component (no framework)

**Backend**
- Flask (Python)
- Firebase Admin SDK (Firestore, Storage, Auth)
- SMTP-based email service (queue verification codes, etc.)

**Infrastructure**
- Firebase Authentication, Firestore, and Storage as the primary data layer
- Firestore security rules + Storage rules committed alongside the app (`firestore.rules`, `storage.rules`, `firestore.indexes.json`)
- Frontend deploys to Vercel (`vercel.json`)
- Backend is Procfile/`render.yaml`-based (Render or any Heroku-style host)

---

## Features

- **Public queue & check-in** — join without an account, get auto-triaged (levels A–E) from a symptom intake form, receive a verification code by email, and track a live queue position with an estimated wait time.
- **Lobby display** — an unauthenticated, auto-refreshing TV screen showing who's currently being served and who's waiting, by priority.
- **Patient portal** — appointments, a connected visual overview of diagnosis/visits/labs, messaging with your care team, a combined documents/lab-results/imaging feed, and notifications.
- **Staff portal** — a shared portal for doctors, nurses, and receptionists with role-based permissions (e.g. doctors see only their own appointments; reassigning a doctor or editing appointment details is reserved for reception/nursing/admin). Covers Patients, Appointments, Notes, Documents, Imaging, Labs, and Messaging.
- **Consultation-linked records** — labs and imaging can't be created independently; they're always tied back to a specific consultation, so there's always a clinical reason on file for why a test exists.
- **Admin portal** — a daily operations summary (queue size by priority, patients seen, patient growth), and a Finances section with separate Income/Expense views, filterable by time period/type/patient, plus a pricing table that drives automatic billing when appointments/labs/imaging complete.
- **Notifications** — in-app alerts for new messages, lab results, and appointment activity, with per-category on/off preferences in Settings.

---

## Project Structure

```
medic/
├── frontend/
│   └── src/
│       ├── assets/          # icons and images (black / inverted variants, etc.)
│       ├── components/      # shared UI: modals, Calendar, form components, shared record views
│       ├── contexts/        # AuthContext
│       ├── display/         # QueueDisplay — the public lobby screen
│       ├── pages/
│       │   ├── admin/       # AdminOverview, AdminFinances, AdminPatients, AdminMessaging, AdminNotifications, AdminSettings, AdminSidebar
│       │   ├── auth/        # Login, ForgotPasswordForm, QueueForm
│       │   ├── patient/     # PatientOverview, PatientAppointments, PatientMessaging, PatientDocuments, PatientNotifications, PatientSettings, PatientSidebar
│       │   └── staff/       # NurseOverview, NursePatients, NurseAppointments, NurseMessaging, NurseNotes, NurseDocuments, NurseImaging, NurseLabs, NurseNotifications, NurseSettings, NurseSidebar
│       └── services/        # one file per Firestore collection/concern — appointmentService, patientService, labService, imagingService, noteService, documentService, messagingService, notificationService, billingService, pricingService, queueService, staffService, activityService, reportService, authService, firebase.js, api.js
│
└── backend/
    └── app/
        ├── assets/          # icons, stores
        ├── config/          # firebase.py, smtp.py
        ├── middleware/      # authRequired.py, roleRequired.py
        ├── routes/          # admin.py, auth.py, health.py, patient_linking.py, queue.py, staff.py, user.py
        └── utils/           # emailTemplates.py, passwordReset.py, triage.py
```

---

## Test Accounts

| Role | Email | Password |
|---|---|---|
| Patient | `josiahjohngreen@gmail.com` | `test1234` |
| Doctor | `doctor@medic.com` | `password123` |
| Receptionist | `receptionist@medic.com` | `password123` |
| Admin | `admin@medic.com` | `password123` |

Log in through the normal sign-in screen — the system reads each account's role and routes you to the correct portal automatically (patient → `/patient/*`, staff → `/staff/*`, admin → `/admin/*`).

## Lobby Display

`https://the-medic-system.vercel.app/display`

This is a public, unauthenticated screen meant to run full-screen on a physical TV in a waiting room — it shows who's currently being served and who's waiting, colored by triage priority. It doesn't require login and refreshes on its own every few seconds.

---

## What to Expect: Patient Portal

Log in as the patient account above.

- **Overview** — a visual summary of your active diagnosis (if you have a consultation on file), linked visits, labs, and any current allergies/medications, plus an upcoming-appointments panel.
- **Appointments** — a read-only list of your appointments (upcoming/past), their status, and which doctor they're with. You can't edit or cancel from here — that's a staff action.
- **Messaging** — message a doctor you have an appointment or referral with. You can only start a *new* conversation with a doctor who's already shown up in your contacts list (via an appointment, referral, or them messaging you first) — there's no open directory browse of every doctor in the system. Existing conversations, however many you have, can be switched between freely from the list on the left.
- **Documents** — a combined view of your uploaded documents, completed lab results, and imaging. A lab only shows up here once it's actually been completed — if a test has just been *requested*, it won't appear yet, since there's nothing to show.
- **Notifications** — messages, appointment reminders, and "your results are ready" alerts land here, with a live unread-count badge in the sidebar.
- **Settings** — turn notification categories on/off, and change your password.

## What to Expect: Staff Portal (Doctor / Nurse / Receptionist)

Log in as the doctor or receptionist account above — the portal is the same for all clinical/front-desk roles, with a few permissions that differ by role (noted below).

- **Overview** — select a patient from the sidebar to see their diagnosis, linked visits/labs/procedures as a connected flow, current allergies and medications, and a calendar/task panel.
- **Patients** — the patient directory. Add or edit a patient record, including vitals, medications, allergies, and medical history. Adding a **Consultation** here is what everything else (labs, imaging, notes) links back to — nothing downstream can be created for a patient until they have at least one consultation on file.
- **Appointments** — the full appointment list.
  - **Doctors** see only appointments assigned to them, and can move their own appointments through Confirm → Start → Complete.
  - **Receptionist/Nurse/Admin** see every appointment, and can additionally reassign which doctor an appointment belongs to, edit its details, or delete it — doctors can't do either of those two things themselves.
  - Every appointment must be linked to a real patient record — there's no free-text "just type a name" option anymore.
- **Messaging** — same messaging system as the patient side, from the staff perspective: a full conversation list, plus a quick-info panel on the right showing that patient's current diagnosis and medications, with shortcuts to their Notes/Documents/Labs/Imaging.
- **Notes / Documents / Imaging / Labs** — each of these is its own tab with a searchable list and an "Add" flow. Labs and Imaging both require linking to a specific consultation (same reasoning as above — a test doesn't exist independently of the visit that ordered it); Notes and Documents don't have that requirement, since they're not "ordered tests."
  - **Labs** has a full library of common test types (vitals, blood panels, imaging-as-a-test, cardiac, microbiology, etc.), each with its own relevant result fields, plus a "Custom" option for anything not on the list.
  - Every lab starts as **Requested** and needs to be marked **Completed** once results are in — that's also the moment it becomes visible to the patient and the moment it gets billed (see Finances, below).
- **Notifications** — messages, task reminders, and lab requested/completed alerts for you specifically.
- **Settings** — notification toggles, password change, and a couple of display preferences.

## What to Expect: Admin Portal

Log in as the admin account above.

- **Overview** — a daily summary: how many people are currently queued (broken down by critical/high-priority), total patient count with a day-over-day change, and how many patients were seen today (appointments that reached "in progress") also with a day-over-day change. There's a fourth card reserved for a time-based metric that's still being defined — it's visibly marked as a placeholder rather than showing a guessed number.
- **Finances** — Income and Expenses are separate views, each with its own running total for the selected time period (week/month/year) and a filterable transaction table (by type of service, or by a specific patient).
  - Every completed appointment, lab, or imaging record automatically generates the relevant transactions — an appointment or lab charge is recorded as income, and if a cost is set for that category (e.g. lab equipment/reagents), a matching expense is recorded too.
  - Expenses need to be **approved** before they count as final — they show up as "pending" until you either approve (✓) or reject (🗑) them from the Expenses tab.
  - Nothing is billed until you set actual prices under the **Pricing** tab — every category starts at $0 by design, so nothing here reflects invented numbers.
- **Patients / Messaging** — same directory and messaging system as the staff portal.
- **Notifications / Settings** — same pattern as the other portals.

## What to Expect: Public Queue (No Login Required)

Anyone can join the queue without an account by filling out the intake form, which asks about symptoms, pain level, and history. Based on that, they're automatically assigned a starting triage priority (A–E) and emailed a 6-digit code. Entering that code (or searching by name/DOB/phone if the code is lost) puts them in the live queue with a running position and estimated wait time. Staff can override the automatic triage level once they've actually assessed the patient.

---

## Known Limitations

A few things are intentionally incomplete rather than silently guessed at:

- **Email notifications** aren't wired up yet — the toggle exists in Settings and is saved, but only in-app notifications currently send.
- **"Tasks due" and "appointments upcoming" reminders** only check in when a staff member has the app open — there's no background job (Cloud Function or cron) driving a true scheduled push yet.
- **The admin Overview's fourth stat card** ("minutes") is a placeholder — its exact meaning hasn't been finalized.
- **The lobby display** doesn't show patient names by default, even though an earlier mockup did — that's a deliberate privacy choice already built into the backend (`/api/queue/display` strips personal info on purpose). Turning names on requires an explicit backend change, documented in the relevant commit.
