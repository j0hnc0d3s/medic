# Medic

Medic is a clinic and hospital management system built around one idea: nobody should have to guess where they are in the line, and nobody on staff should have to guess who needs help first. It has separate portals for patients, clinical staff (doctors, nurses, and triage nurses), front-desk receptionists, and administrators, plus a public check-in and queue flow, a lobby display screen, a self-check-in kiosk, and a live vitals feed from a wearable to a bedside monitor.

Feel free to access our website link here `https://the-medic-system.vercel.app`, and read through our README, to get a grasp on what to expect and look out for.

---

## The Story So Far

Medic has grown in three stages.

**1. The capstone (team FlowState, UWI Mona).** Medic began as our final-year capstone project. The first version, "Medic Hospital", was a queue management system for the emergency department at UWI Hospital (UHWI). Patients join a queue from a symptom form, get a starting priority from A (most urgent) to E (least urgent), and staff run the queue from role-based portals. We wrote a full Software Requirements Specification (SRS) alongside it and talked to two real stakeholders: a public hospital (UWI Hospital) and a private clinic (Dr. Eikens). The capstone team is listed under "Meet the Team" below.

**2. CariSurg MedTech Pathways, with Med AI.** Josiah then took Medic into the CariSurg MedTech Pathways 2026 programme, a 13-week clinical AI engineering intensive based in an emergency department, and worked on it with his CariSurg group. There, the idea behind "Med AI" grew: an AI model that helps spot the most urgent emergency patients (the ESI-1 level, the top of a five-level emergency scale). It is built as a flag that supports a nurse's judgment, not a system that decides on its own. Med AI started from concern for a friend, became a capstone project with supervisory backing, and then a project inside CariSurg. The capstone's queue and hospital system and Med AI's triage work are being combined into one product.

**3. Future Caribbean, solo.** Josiah is now pursuing Medic on his own through Future Caribbean, pitching it as a digital queue and hospital management system that uses AI to support emergency department triage. His strongest asset is a live, fully working demo. As part of that, the project was reorganised from one web app into a set of connected apps that all share one backend (see "Project Structure").

An honest note on where the AI stands today: the automatic A–E priority in this repository is a rule-based starting score (keywords and pain level) that staff can override. The Med AI triage model is the AI layer being combined with it, and is not yet wired into this codebase.

---

## What Medic Aims to Solve

Many emergency departments and clinics still run waiting rooms and triage by hand. In practice that means:

- **Patients can't see where they are in line.** They wait without knowing how long it will take, and ask the front desk over and over.
- **Staff have no single live picture.** Who is waiting, how urgent each person is, and who has been seen are spread across paper, memory, and separate tools.
- **Different jobs need different tools.** A receptionist, a nurse, a doctor, and an administrator each need a different view of the same patient, and mixing them creates mistakes (for example, an administrator who can message patients directly, or a receptionist who can see clinical notes).
- **Double-booking and no-shows waste time.** Two patients get the same slot, or a missed appointment leaves an empty slot nobody fills.
- **Deterioration can go unnoticed.** A waiting patient's vitals can change with nobody watching.

Medic's answer, point by point:

- **Self check-in.** A walk-in joins the queue without an account (on the web, or at a kiosk or tablet) and gets a starting priority, a queue position, and an estimated wait.
- **One live view for staff.** Everyone in the queue, sorted by priority, with a lobby screen for the waiting room.
- **Role-specific portals.** Each role sees only what its job needs.
- **Schedule protection.** Doctors set their own working hours, bookings can't collide or fall outside those hours, and a no-show frees its slot right away.
- **Live vitals for triage nurses.** A wearable sends readings that triage nurses watch on a bedside monitor, with out-of-range values flagged.
- **One connected record.** Consultations, labs, imaging, notes, and billing all link back to each other, so there is always a reason on file for every test.

---

## Meet the Team

The original capstone was built by **FlowState**.

| Name | ID Number | School Email | Role |
|---|---|---|---|
| Jilian Budd | 620162142 | jilian.budd@mymona.uwi.edu | Team Lead — UAT & Documentation |
| Omelia Hamilton | 620156615 | omelia.hamilton@mymona.uwi.edu | UAT & Documentation |
| Josiah-John Green | 620149044 | josiah-john.green@mymona.uwi.edu | Team Lead — Frontend & Backend Development; Stakeholder Liaison, Public Hospital (UWI Hospital) |
| Willando Blair | 620165358 | willando.blair@mymona.uwi.edu | Frontend & Backend Development; Stakeholder Liaison, Private Clinic (Dr. Eikens) |

Medic is now being taken forward by Josiah-John Green, Founder of 3urek4, as a solo venture through Future Caribbean.

---

## Tech Stack

**Web apps (portals, kiosk, display, wearable, bedside monitor)**
- React (Vite)
- React Router
- Firebase SDK — Authentication, Firestore, Storage
- Plain CSS per component (no framework)

**Mobile app (patient)**
- Expo and React Native (TypeScript), with Expo Router
- Same Firebase project and same backend as the web portals

**Backend**
- Flask (Python), served with Gunicorn
- Firebase Admin SDK (Firestore, Storage, Auth)
- SMTP-based email service (queue verification codes, etc.)

**Infrastructure**
- Firebase Authentication, Firestore, and Storage as the primary data layer
- Firestore security rules + Storage rules committed alongside the app (`firestore.rules`, `storage.rules`, `firestore.indexes.json`). Rules are not deployed automatically: after changing `firestore.rules`, paste the file into the Firebase console (Firestore Database, then Rules) and publish it.
- Web frontends deploy to Vercel (`vercel.json` in each app)
- Backend deploys to Railway from the `main` branch (`Procfile`, root directory `web_app/backend`)

---

## Features

- **Public queue & check-in** — join without an account, get auto-triaged (levels A–E) from a symptom intake form, receive a verification code by email, and track a live queue position with an estimated wait time.
- **Kiosk and handheld check-in** — the same walk-in intake as a self-service screen for a kiosk or a staff tablet, with a "Lookup Code" tab for people already in the queue and a "New Intake" tab for new arrivals.
- **Lobby display** — an unauthenticated, auto-refreshing TV screen showing who's currently being served and who's waiting, by priority.
- **Patient portal (web and native app)** — appointments, a connected visual overview of diagnosis/visits/labs, messaging with your care team, a combined documents/lab-results/imaging feed, and notifications.
- **Staff portal** — a shared portal for doctors, nurses, and triage nurses with role-based permissions (e.g. doctors see only their own appointments; reassigning a doctor or editing appointment details is reserved for nursing/admin). Covers Patients, Appointments, Notes, Documents, Imaging, Labs, Messaging, and Availability.
- **Triage vitals** — a wearable (simulated for now) sends heart rate, oxygen level, breathing rate, temperature, and blood pressure. Triage nurses see the latest reading for everyone in the queue on a **Vitals** tab, flagged when a value is out of range, and can open a full trend view for one patient on the bedside monitor.
- **Reception portal** — a separate, narrower front-desk portal: looking up a patient and telling them their queue position, booking appointments, and checking a doctor's booked slots for a day before offering a time.
- **Doctor availability & double-booking protection** — doctors set their own weekly hours and blocked dates; every appointment booking (staff or reception) is checked against that schedule and existing bookings, and a no-show frees its slot immediately for rebooking.
- **Consultation-linked records** — labs and imaging can't be created independently; they're always tied back to a specific consultation, so there's always a clinical reason on file for why a test exists.
- **Admin portal** — a daily operations summary (queue size by priority, patients seen, patient growth), and a Finances section with separate Income/Expense views, filterable by time period/type/patient, plus a pricing table that drives automatic billing when appointments/labs/imaging complete.
- **Notifications** — in-app alerts for new messages, lab results, and appointment activity, with per-category on/off preferences in Settings.

---

## Project Structure

Medic is a set of small apps that share one backend, so each screen type can be deployed and updated on its own.

```
medic/
├── web_app/
│   ├── frontend/            # the main web site: patient, staff, triage, reception, and admin portals
│   │   └── src/
│   │       ├── assets/      # icons and images (black / inverted variants, etc.)
│   │       ├── components/  # shared UI: modals, Calendar, form components, shared record views
│   │       ├── contexts/    # AuthContext
│   │       ├── pages/
│   │       │   ├── admin/       # AdminOverview, AdminFinances, AdminPatients, AdminNotifications, AdminSettings, AdminSidebar (no messaging; see Roles at a Glance)
│   │       │   ├── auth/        # Login, ForgotPasswordForm, QueueForm
│   │       │   ├── patient/     # PatientOverview, PatientAppointments, PatientMessaging, PatientDocuments, PatientNotifications, PatientSettings, PatientSidebar
│   │       │   ├── staff/       # NurseOverview, NursePatients, NurseAppointments, NurseAvailability, NurseMessaging, NurseNotes, NurseDocuments, NurseImaging, NurseLabs, NurseNotifications, NurseSettings, NurseSidebar -- shared by doctor, nurse, and triage roles
│   │       │   ├── triage/      # TriageVitals -- the one page triage nurses get beyond the shared staff pages above
│   │       │   └── reception/   # StaffOverview, StaffPatients, StaffAppointments, StaffSettings, StaffSidebar -- the receptionist's own, narrower page set
│   │       └── services/    # one file per Firestore collection/concern — appointmentService, availabilityService, patientService, labService, imagingService, noteService, documentService, messagingService, notificationService, billingService, pricingService, queueService, staffService, activityService, reportService, authService, firebase.js, api.js
│   └── backend/             # the one backend every app talks to
│       └── app/
│           ├── assets/      # icons, stores
│           ├── config/      # firebase.py, smtp.py
│           ├── middleware/  # authRequired.py, roleRequired.py
│           ├── routes/      # admin.py, auth.py, health.py, patient_linking.py, queue.py, staff.py, user.py, vitals.py
│           └── utils/       # emailTemplates.py, passwordReset.py, triage.py
│
├── display/                 # the public lobby screen (its own app, port 5174)
├── kiosk_handheld/          # walk-in self check-in for kiosks and tablets (port 5175)
├── wearable/                # simulated wearable that sends vitals (port 5176)
├── bedside_monitor/         # live vitals screen for triage nurses (port 5177)
└── mobile_app/              # native patient app (Expo), same Firebase project and backend
```

---

## Roles at a Glance

| Role | Where they land after login | What they can do |
|---|---|---|
| Patient | `/patient/*` (or the mobile app) | Own appointments, records, messaging with their care team, notifications |
| Doctor | `/staff/*` | Own appointments, patients, notes, documents, imaging, labs, messaging, own Availability |
| Nurse | `/staff/*` | Everything a doctor has, plus all appointments and reassigning doctors |
| Triage nurse | `/staff/*` | Everything a nurse has, plus the **Vitals** tab and the bedside monitor |
| Receptionist | `/reception/*` | Queue position lookups, patient lookup, booking appointments, doctor availability, marking no-shows |
| Admin | `/admin/*` | Operations summary, finances, patient records. No direct patient messaging (it is a business role, not a clinical one) |

An admin assigns roles from the user-management flow (or with `PUT /api/admin/users/assign-role`).

---

## Running It Locally

Each app is run from its own folder. First time only, run `npm install`; after that, `npm run dev`.

| App | Folder | Address |
|---|---|---|
| Main web site | `web_app/frontend` | `http://localhost:5173` |
| Lobby display | `display` | `http://localhost:5174` |
| Kiosk / tablet check-in | `kiosk_handheld` | `http://localhost:5175` |
| Wearable simulator | `wearable` | `http://localhost:5176` |
| Bedside monitor | `bedside_monitor` | `http://localhost:5177` |
| Native patient app | `mobile_app` | `npx expo start`, then press `i` for the iOS simulator or scan the QR code in Expo Go |

**Backend:** `cd web_app/backend`, activate the virtual environment (`source venv/bin/activate`), then `python run.py`. It listens on port 5001. Each app points at a backend through its `.env` file (`VITE_PUBLIC_API_URL` for the web apps, `EXPO_PUBLIC_API_URL` for the mobile app).

**Allowed origins:** the backend only accepts requests from addresses listed in its `ALLOWED_ORIGINS` setting. Add each app's address (local or deployed) there, or the browser will block its requests.

**Trying the vitals feature end to end:**
1. Check someone in through the kiosk (or the web queue form).
2. Copy that queue entry's ID (the document ID in the `queueEntries` collection in Firestore).
3. Open the wearable app, paste the ID, pick Normal, Elevated or Critical, and press Start.
4. Open the bedside monitor with `?entry=<that id>` on the end of its address, or open the **Vitals** tab as a triage nurse.

---

## Test Accounts

| Role | Email | Password |
|---|---|---|
| Patient | `josiahjohngreen@gmail.com` | `test1234` |
| Doctor | `doctor@medic.com` | `password123` |
| Receptionist | `receptionist@medic.com` | `password123` |
| Admin | `admin@medic.com` | `password123` |

There is no seeded triage nurse account yet. To try one, have an admin change a test user's role to `triage`.

Log in through the normal sign-in screen — the system reads each account's role and routes you to the correct portal automatically (patient → `/patient/*`, doctor/nurse/triage → `/staff/*`, receptionist → `/reception/*`, admin → `/admin/*`).

## Lobby Display

This is a public, unauthenticated screen meant to run full-screen on a physical TV in a waiting room — it shows who's currently being served and who's waiting, colored by triage priority. It doesn't require login and refreshes on its own every few seconds. It lives in the `display/` folder and is deployed as its own site (it is no longer a page inside the main web app).

---

## What to Expect: Patient Portal

Log in as the patient account above.

- **Overview** — a visual summary of your active diagnosis (if you have a consultation on file), linked visits, labs, and any current allergies/medications, plus an upcoming-appointments panel.
- **Appointments** — a read-only list of your appointments (upcoming/past), their status, and which doctor they're with. You can't edit or cancel from here — that's a staff action.
- **Messaging** — message a doctor you have an appointment or referral with. You can only start a *new* conversation with a doctor who's already shown up in your contacts list (via an appointment, referral, or them messaging you first) — there's no open directory browse of every doctor in the system. Existing conversations, however many you have, can be switched between freely from the list on the left.
- **Documents** — a combined view of your uploaded documents, completed lab results, and imaging. A lab only shows up here once it's actually been completed — if a test has just been *requested*, it won't appear yet, since there's nothing to show.
- **Notifications** — messages, appointment reminders, and "your results are ready" alerts land here, with a live unread-count badge in the sidebar.
- **Settings** — turn notification categories on/off, and change your password.

The native app (`mobile_app`) gives patients the same Overview, Appointments, Messaging, Documents, and Profile screens on a phone. Its Overview shows the same information as a simple scrolling list instead of the web version's draggable diagram, which suits a touch screen better.

## What to Expect: Staff Portal (Doctor / Nurse / Triage Nurse)

Log in as the doctor account above — the portal is the same for doctor, nurse, and triage roles, with a few permissions that differ by role (noted below). Receptionist has moved to its own portal — see "Reception Portal" below.

- **Overview** — select a patient from the sidebar to see their diagnosis, linked visits/labs/procedures as a connected flow, current allergies and medications, and a calendar/task panel.
- **Patients** — the patient directory. Add or edit a patient record, including vitals, medications, allergies, and medical history. Adding a **Consultation** here is what everything else (labs, imaging, notes) links back to — nothing downstream can be created for a patient until they have at least one consultation on file.
- **Appointments** — the full appointment list.
  - **Doctors** see only appointments assigned to them, and can move their own appointments through Confirm → Start → Complete.
  - **Nurse/Triage/Admin** see every appointment, and can additionally reassign which doctor an appointment belongs to, edit its details, or delete it — doctors can't do either of those two things themselves.
  - Every appointment must be linked to a real patient record — there's no free-text "just type a name" option anymore.
  - Booking (from either the staff or reception portal) is checked against the assigned doctor's declared Availability and existing bookings first, and is blocked on an exact double-booking or a time outside that doctor's working hours. Marking an appointment **No-show** frees its slot immediately — the check only treats `scheduled`/`confirmed` appointments as taken, so a receptionist can mark a no-show and rebook that same slot for someone else right away.
- **Messaging** — same messaging system as the patient side, from the staff perspective: a full conversation list, plus a quick-info panel on the right showing that patient's current diagnosis and medications, with shortcuts to their Notes/Documents/Labs/Imaging.
- **Vitals** *(Triage nurse only)* — every active queue entry alongside its latest wearable reading (heart rate, SpO2, resp. rate, temp, blood pressure), flagged when a value is outside normal range, with a link out to the standalone bedside-monitor app for the full trend-line view of one patient.
- **Availability** — a doctor sets their own weekly working hours and any blocked (vacation/unavailable) dates; nurse/admin/triage get a doctor picker to manage it on someone's behalf. This is what every appointment booking now checks before going through.
- **Notes / Documents / Imaging / Labs** — each of these is its own tab with a searchable list and an "Add" flow. Labs and Imaging both require linking to a specific consultation (same reasoning as above — a test doesn't exist independently of the visit that ordered it); Notes and Documents don't have that requirement, since they're not "ordered tests."
  - **Labs** has a full library of common test types (vitals, blood panels, imaging-as-a-test, cardiac, microbiology, etc.), each with its own relevant result fields, plus a "Custom" option for anything not on the list.
  - Every lab starts as **Requested** and needs to be marked **Completed** once results are in — that's also the moment it becomes visible to the patient and the moment it gets billed (see Finances, below).
- **Notifications** — messages, task reminders, and lab requested/completed alerts for you specifically.
- **Settings** — notification toggles, password change, and a couple of display preferences.

## What to Expect: Reception Portal

Log in as the receptionist account above.

- **Overview** — the live queue, with a name-search so the front desk can tell a waiting patient their position without scanning the full board, plus today's appointment count.
- **Patients** — the same patient directory as the staff portal (look up, add, edit), with a one-click "Book appointment" shortcut per patient.
- **Appointments** — view/book appointments, plus a doctor-availability panel: pick a doctor and a date to see their booked slots for that day before offering a time. Booking is checked against that doctor's declared Availability (working hours + blocked dates) and existing bookings, and blocked on a collision. Each appointment row has a status dropdown, including **No-show** — marking one frees that slot immediately for a different patient.
- **Settings** — notification toggles (appointments only) and password change.

## What to Expect: Admin Portal

Log in as the admin account above.

- **Overview** — a daily summary: how many people are currently queued (broken down by critical/high-priority), total patient count with a day-over-day change, and how many patients were seen today (appointments that reached "in progress") also with a day-over-day change. There's a fourth card reserved for a time-based metric that's still being defined — it's visibly marked as a placeholder rather than showing a guessed number.
- **Finances** — Income and Expenses are separate views, each with its own running total for the selected time period (week/month/year) and a filterable transaction table (by type of service, or by a specific patient).
  - Every completed appointment, lab, or imaging record automatically generates the relevant transactions — an appointment or lab charge is recorded as income, and if a cost is set for that category (e.g. lab equipment/reagents), a matching expense is recorded too.
  - Expenses need to be **approved** before they count as final — they show up as "pending" until you either approve (✓) or reject (🗑) them from the Expenses tab.
  - Nothing is billed until you set actual prices under the **Pricing** tab — every category starts at $0 by design, so nothing here reflects invented numbers.
- **Patients** — same directory as the staff portal. (Admin deliberately has no direct patient-messaging — it's an HR/finance-facing role, not a clinical one.)
- **Notifications / Settings** — same pattern as the other portals.

## What to Expect: Public Queue and Kiosk (No Login Required)

Anyone can join the queue without an account by filling out the intake form, which asks about symptoms, pain level, and history — on the web, or at the kiosk/handheld app. Based on that, they're automatically assigned a starting triage priority (A–E) and emailed a 6-digit code. Entering that code (or searching by name/DOB/phone if the code is lost) puts them in the live queue with a running position and estimated wait time. Staff can override the automatic triage level once they've actually assessed the patient.
