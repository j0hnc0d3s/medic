# Medic Clinic - Complete Setup Guide

## 🚀 Project Overview
Private clinic management system with:
- Patient database & records
- Appointment scheduling  
- Financial tracking (income/expenditure)
- Weekly reports & analytics
- Birthday greetings automation

## 📋 Tech Stack
- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Backend**: Node.js + Railway
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **File Storage**: Firebase Storage
- **Email**: Resend
- **Deployment**: Vercel

## 📁 Project Structure
```
medic-clinic/
├── src/
│   ├── components/
│   │   ├── Sidebar/          # Navigation sidebar
│   │   └── ProtectedRoute/   # Auth route guard
│   ├── contexts/
│   │   └── AuthContext.jsx   # Authentication state
│   ├── pages/
│   │   ├── Auth/             # Login/Register
│   │   ├── Dashboard/        # Main overview
│   │   ├── Appointments/     # Calendar & scheduling
│   │   ├── Patients/         # Patient list & search
│   │   ├── PatientProfile/   # Individual patient view
│   │   ├── Financial/        # Income/Expenditure tracking
│   │   ├── Reports/          # Weekly reports & analytics
│   │   └── Settings/         # User preferences
│   ├── services/
│   │   └── firebase.js       # Firebase config
│   ├── utils/                # Helper functions
│   ├── hooks/                # Custom React hooks
│   └── assets/               # Images, icons
└── public/
```

## ⚙️ Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project: "medic-clinic"
3. Enable Google Analytics (optional)

### 2. Enable Authentication
1. Go to Authentication > Sign-in method
2. Enable Email/Password
3. (Optional) Enable Google sign-in

### 3. Create Firestore Database
1. Go to Firestore Database
2. Create database in production mode
3. Set rules (see below)

### 4. Enable Storage
1. Go to Storage
2. Create default bucket
3. Set rules (see below)

### 5. Get Firebase Config
1. Project Settings > General
2. Scroll to "Your apps"
3. Click Web app icon (</>)
4. Copy config object

### 6. Add Config to Project
Create `.env` file in project root:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
```

## 🔐 Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Patients
    match /patients/{patientId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                      (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'doctor', 'nurse']);
      allow update, delete: if request.auth != null && 
                              (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'doctor']);
    }
    
    // Appointments
    match /appointments/{appointmentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'doctor', 'nurse', 'staff']);
    }
    
    // Financial records (admin/doctor only)
    match /financial/{recordId} {
      allow read, write: if request.auth != null && 
                           (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'doctor']);
    }
    
    // Reports
    match /reports/{reportId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'doctor']);
    }
  }
}
```

## 📊 Firestore Data Structure

### Users Collection
```javascript
users/{userId}
{
  email: "john@example.com",
  name: "Dr. John Doe",
  role: "doctor", // admin, doctor, nurse, staff, patient
  phone: "+1876...",
  createdAt: "2026-03-23T...",
  lastLogin: "2026-03-23T..."
}
```

### Patients Collection
```javascript
patients/{patientId}
{
  name: "Jane Smith",
  email: "jane@example.com",
  phone: "+1876...",
  dateOfBirth: "1990-05-15",
  gender: "female",
  address: "123 Main St, Kingston",
  emergencyContact: {
    name: "John Smith",
    relationship: "Husband",
    phone: "+1876..."
  },
  medicalHistory: {
    conditions: ["Diabetes", "Hypertension"],
    allergies: ["Peanuts", "Penicillin"],
    medications: ["Metformin", "Lisinopril"],
    surgeries: ["Appendectomy - 2015"]
  },
  insurance: {
    provider: "Sagicor",
    policyNumber: "SAG123456"
  },
  createdAt: "2026-01-15T...",
  lastVisit: "2026-03-20T..."
}
```

### Appointments Collection
```javascript
appointments/{appointmentId}
{
  patientId: "patient123",
  patientName: "Jane Smith",
  doctorId: "doctor456",
  doctorName: "Dr. John Doe",
  date: "2026-03-25",
  time: "10:00",
  duration: 30, // minutes
  reason: "Follow-up consultation",
  status: "scheduled", // scheduled, completed, cancelled, no-show
  notes: "Patient reports improvement in symptoms",
  createdAt: "2026-03-20T..."
}
```

### Financial Collection
```javascript
financial/{recordId}
{
  type: "income", // income or expenditure
  category: "consultation", // consultation, medication, supplies, salary, etc.
  amount: 5000,
  currency: "JMD",
  description: "Consultation fee - Jane Smith",
  patientId: "patient123", // if income from patient
  date: "2026-03-23",
  paymentMethod: "cash", // cash, card, insurance
  recordedBy: "doctor456",
  createdAt: "2026-03-23T..."
}
```

### Reports Collection
```javascript
reports/{reportId}
{
  type: "weekly", // weekly, monthly, custom
  startDate: "2026-03-17",
  endDate: "2026-03-23",
  stats: {
    totalPatients: 45,
    newPatients: 8,
    totalAppointments: 52,
    completedAppointments: 48,
    cancelledAppointments: 4,
    totalIncome: 260000,
    totalExpenditure: 85000,
    netIncome: 175000
  },
  generatedAt: "2026-03-23T...",
  generatedBy: "admin123"
}
```

## 🎨 Color Palette (Already in CSS)
- **Primary**: #1F4788 (Deep Blue)
- **Secondary**: #2D9C9C (Teal)
- **Accent**: #FF6B6B (Coral)
- **Backgrounds**: #2C2C31, #232328, #1C1C20
- **Success**: #10B981
- **Warning**: #F59E0B
- **Error**: #EF4444

## 🚀 Development Commands
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 Next Steps After Setup
1. ✅ Firebase project created
2. ✅ Environment variables set
3. ✅ Dependencies installed
4. Create first admin user
5. Build out remaining pages
6. Test authentication flow
7. Implement patient CRUD
8. Build appointment scheduler
9. Add financial tracking
10. Generate reports

## 🔑 Creating First Admin User
Use Firebase Console:
1. Authentication > Users > Add user
2. Email: admin@medic.com, Password: (set secure password)
3. Copy the UID
4. Firestore > users > Add document
5. Document ID: (paste UID)
6. Fields:
   - email: "admin@medic.com"
   - name: "Admin User"
   - role: "admin"
   - createdAt: (current timestamp)

## 📚 Key Features to Implement

### Dashboard
- Overview stats (patients, appointments, income)
- Recent appointments list
- Quick actions (new patient, new appointment)
- Alerts/notifications

### Appointments
- Calendar view with time slots
- Drag-and-drop scheduling
- Appointment details modal
- Status updates (scheduled → completed)
- SMS reminders integration (Twilio)

### Patients
- Searchable patient list
- Patient profile view
- Medical history tracking
- Document upload (ID, insurance, records)
- Birthday tracking for greetings

### Financial
- Income/Expenditure forms
- Daily totals
- Category breakdown
- Payment method tracking
- Export to CSV

### Reports
- Weekly patient count
- Financial summary
- Appointment completion rate
- Export to PDF

## 🐛 Common Issues & Fixes

### Firebase Connection Error
- Check `.env` file exists and has correct values
- Verify Firebase project is active
- Check browser console for specific error

### Authentication Not Working
- Verify Email/Password is enabled in Firebase Console
- Check Firestore rules allow user creation
- Clear browser cache and try again

### Build Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node version (should be 18+)

## 📞 Support
For help with this project, contact Josiah-John Green:
- Email: josiahjohn.green@mymona.uwi.edu
- GitHub: @j0hnc0d3s

---
Built with ❤️ for better healthcare in Jamaica
