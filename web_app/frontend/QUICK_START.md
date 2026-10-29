# Medic Clinic - Quick Start 🚀

Hey bestie! Here's your complete Medic clinic management system starter.

## ✅ What's Already Built

### Core Infrastructure
- ✅ **Project setup**: React + Vite configured
- ✅ **Design system**: Full Medic color palette + tokens
- ✅ **Sidebar navigation**: S-curve design from Aegis, adapted for Medic
- ✅ **Authentication**: Firebase Auth context + protected routes
- ✅ **Routing**: React Router with role-based access
- ✅ **Database config**: Firebase Firestore setup ready

### Components
- ✅ `Sidebar` - Beautiful navigation with active pill design
- ✅ `ProtectedRoute` - Route guarding with role permissions
- ✅ `AuthContext` - Global auth state management

### Pages (Starter Templates Created)
All pages need content, but routing and structure is done:
- Login
- Dashboard
- Appointments
- Patients
- PatientProfile
- Financial
- Reports
- Settings

## 🚀 Getting Started

### 1. Extract the Project
```bash
tar -xzf medic-clinic-starter.tar.gz
cd medic-clinic
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Firebase
1. Create Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Enable Storage
5. Get your config from Project Settings

### 4. Create .env File
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Start Development Server
```bash
npm run dev
```

Visit: http://localhost:5173

## 📋 Next Steps - What You Need to Build

### Priority 1: Authentication (Pages/Auth/)
**Login.jsx** needs:
- Email/password form
- Sign in with Firebase
- Redirect to dashboard on success
- Error handling

**Register.jsx** (optional) needs:
- Create account form
- Role selection (admin/doctor/nurse/staff)
- User profile creation in Firestore

### Priority 2: Dashboard (Pages/Dashboard/)
**Dashboard/index.jsx** needs:
- Stats cards (total patients, today's appointments, revenue)
- Recent appointments list
- Quick actions (Add Patient, New Appointment buttons)
- Use Firestore to fetch real data

### Priority 3: Patients (Pages/Patients/)
**Patients/index.jsx** needs:
- Patient list table
- Search functionality
- Add New Patient button
- Click to view profile

**Add/Edit Patient Form** needs:
- Personal info (name, DOB, gender, phone, email)
- Address
- Emergency contact
- Medical history (conditions, allergies, medications)
- Insurance details
- Document upload (ID, insurance card)

### Priority 4: Appointments (Pages/Appointments/)
**Appointments/index.jsx** needs:
- Calendar view (use `date-fns` or `react-big-calendar`)
- Time slot grid
- Add appointment modal
- Edit/Cancel functionality
- Status updates (scheduled → completed)

### Priority 5: Financial (Pages/Financial/)
**Financial/index.jsx** needs:
- Income/Expenditure tabs
- Add transaction form
- Transaction list
- Daily/weekly/monthly summary
- Category breakdown chart (use `recharts`)

### Priority 6: Reports (Pages/Reports/)
**Reports/index.jsx** needs:
- Date range selector
- Generate report button
- Weekly patient stats
- Financial summary
- Appointment completion rate
- Export to PDF functionality

## 🎨 Design System Tokens

### Colors (Already in CSS)
```css
--primary: #1F4788;        /* Deep Blue */
--secondary: #2D9C9C;      /* Teal */
--accent: #FF6B6B;         /* Coral */
--bg-primary: #2C2C31;     /* Main background */
--bg-secondary: #232328;   /* Cards */
--text-primary: #FFFFFF;
--text-secondary: rgba(255,255,255,0.7);
```

### Component Patterns

**Card:**
```jsx
<div style={{
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-lg)',
  boxShadow: 'var(--shadow-md)'
}}>
  {/* Content */}
</div>
```

**Primary Button:**
```jsx
<button style={{
  background: 'var(--secondary)',
  color: 'white',
  padding: '0.625rem 1.25rem',
  borderRadius: 'var(--radius-sm)',
  fontWeight: 500,
  cursor: 'pointer'
}}>
  Add Patient
</button>
```

**Input Field:**
```jsx
<input
  type="text"
  placeholder="Search patients..."
  style={{
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--neutral-700)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.625rem 0.875rem',
    color: 'var(--text-primary)',
    width: '100%'
  }}
/>
```

## 🔥 Firebase Quick Reference

### Read Patients
```javascript
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'

const patientsRef = collection(db, 'patients')
const snapshot = await getDocs(patientsRef)
const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
```

### Add Patient
```javascript
import { collection, addDoc } from 'firebase/firestore'

await addDoc(collection(db, 'patients'), {
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+1876...',
  createdAt: new Date().toISOString()
})
```

### Update Patient
```javascript
import { doc, updateDoc } from 'firebase/firestore'

const patientRef = doc(db, 'patients', patientId)
await updateDoc(patientRef, {
  phone: '+1876-NEW-NUMBER'
})
```

### Delete Patient
```javascript
import { doc, deleteDoc } from 'firebase/firestore'

await deleteDoc(doc(db, 'patients', patientId))
```

## 📊 Firestore Collections Structure

See `MEDIC_SETUP_GUIDE.md` for complete data structure examples.

**Key Collections:**
- `users` - Staff accounts (admin, doctor, nurse, staff)
- `patients` - Patient records
- `appointments` - Appointment scheduling
- `financial` - Income & expenditure tracking
- `reports` - Generated weekly/monthly reports

## 🐛 Common Issues

### "Module not found" errors
```bash
npm install
```

### Firebase connection issues
1. Check `.env` file exists in project root
2. Verify all VITE_FIREBASE_* variables are set
3. Restart dev server after adding .env

### Sidebar not showing
The sidebar uses absolute positioning. Make sure your layout wrapper is set up correctly:
```jsx
<div style={{ display: 'flex', gap: '20px', padding: '20px', height: '100%' }}>
  <Sidebar />
  <main style={{ flex: 1, overflow: 'auto' }}>
    {children}
  </main>
</div>
```

## 📝 Development Workflow

1. **Start with Firebase setup** - Get authentication working first
2. **Build Login page** - Test auth flow
3. **Create first admin user** - Use Firebase Console
4. **Build Dashboard** - Static layout first, then add data
5. **Patients CRUD** - Most important feature
6. **Appointments** - Calendar integration
7. **Financial tracking** - Income/expenditure
8. **Reports** - Analytics and summaries

## 🎯 MVP Checklist (For Capstone Demo)

Must-have for March/April demo:
- [ ] Login/Authentication
- [ ] Add new patient
- [ ] View patient list
- [ ] Patient profile with medical history
- [ ] Schedule appointment
- [ ] View appointments (calendar or list)
- [ ] Record income (consultation fees)
- [ ] Generate weekly patient report

Nice-to-have:
- [ ] Document upload (ID, insurance)
- [ ] Birthday greetings system
- [ ] Financial reports
- [ ] Export to PDF

## 🚀 Deployment

### Vercel (Frontend)
```bash
npm run build
# Upload dist/ folder to Vercel
```

### Railway (Backend - when needed)
Currently all logic is frontend + Firebase.
Backend needed for:
- Cron jobs (birthday emails)
- PDF generation
- SMS integration

## 💡 Tips

1. **Use the design tokens** - Don't hardcode colors/spacing
2. **Test with real data** - Create 5-10 test patients
3. **Mobile responsiveness** - Test on different screen sizes
4. **Error handling** - Always wrap Firebase calls in try-catch
5. **Loading states** - Show spinners while fetching data
6. **Validation** - Check required fields before submission

## 📞 Need Help?

Check `MEDIC_SETUP_GUIDE.md` for detailed Firebase setup, security rules, and data structure.

Good luck bestie! You got this! 🎉

---
**Note**: All page files are created as starter templates in `src/pages/`. They need content added - this gives you the structure to build on.
