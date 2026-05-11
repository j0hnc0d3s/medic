# Medic

> Healthcare queue and clinic management system. Capstone project scoped to the UHWI Casualty Department.

🔒 **Private** · Built under **3urek4**.

## Overview

Medic is a healthcare workflow platform combining patient queue management with broader clinic operations (staff scheduling, visit logging, patient finance tracking). Originally scoped to the University Hospital of the West Indies (UHWI) Casualty Department, the system uses QR-based patient tracking to reduce wait times and streamline triage flow.

## Tech Stack

- **Frontend:** React
- **Backend / Database:** Firebase, Firestore
- **Auth:** Firebase Authentication with role-based access control

## Features

### Queue Management (Casualty Department)
- QR-based patient identification and tracking
- Real-time triage queue with status updates
- Wait-time visibility for patients and staff

### Clinic Management
- Dual **Admin** and **Staff** interfaces with role-based access
- Modal-driven Add Visit form
- Patient-linked finances tracking
- Staff calendar with shift color-coding
- Upcoming Birthdays widget for patient retention

### Architecture
- Service-layer abstraction cleanly separating UI concerns from data-access logic
- Firestore security rules for tenant isolation

## Project Structure

```
├── src/
│   ├── admin/        # Admin interface
│   ├── staff/        # Staff interface
│   ├── services/     # Firestore service layer
│   ├── components/   # Shared UI components
│   └── hooks/        # Custom hooks
├── firestore.rules   # Firestore security rules
└── firebase.json     # Firebase config
```

## Run Locally

```bash
npm install
npm run dev
```

Configure Firebase credentials via `.env.local` (see `.env.example`).

## Status

**Active** — Capstone scope complete; expanding toward patient-facing pages as the next development phase.

## Roadmap

- [ ] Patient-facing pages (appointment booking, queue position lookup)
- [ ] SMS notifications for queue position updates
- [ ] Multi-clinic tenancy

Built by [Josiah-John Green](https://github.com/j0hnc0d3s) — Founder & CTO, [3urek4](https://3urek4.vercel.app).
