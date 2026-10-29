// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/records/mockData.js
// Shared mock data — swap for real Firestore queries later
// ─────────────────────────────────────────────────────────
import doctor1 from '../assets/images/doctor1.png'

export const MOCK_PATIENT = {
  id: 'PA1001', firstName: 'H.', lastName: 'Evans',
  gender: 'Male', age: 25, avatar: doctor1,
}

export const MOCK_APPOINTMENTS = [
  {
    id: 1, patientName: 'Mr. Harry Evans', gender: 'Male', age: 24,
    reason: 'Having headaches and fevers.', tags: ['Peanut', 'Apples'],
    date: 'June 9th', time: '09:00 PM', avatar: doctor1,
  },
]

export const MOCK_APPOINTMENT_DETAIL = {
  title: 'Follow Up', assignedDoctor: 'Dr. Zane Brooks',
  date: 'June 6th 2026', time: '9:00 PM',
  tags: ['C. Urgent', 'C002', 'Confirmed'],
  body: 'Follow-up after chest X-Ray — shortness of breath',
  documents: [1, 2],
  medication: [
    { name: 'Montelukast', dose: '10mg', sub: 'Tablet, Oral, OD' },
    { name: 'Salbutamol',  dose: '100mcg', sub: 'Inhaler, Inhaled, PRN' },
  ],
  allergies: [
    { name: 'Penicillin', type: 'Drug', reaction: 'Hives, Swelling; Severe' },
  ],
  notes: 'X-Ray clear. Symptoms likely asthma-related. Review current inhaler usage and technique. Consider referral to pulmonologist if no improvement after medication adjustment.',
  editedBy: 'Dr. Jessica Forbes', editedOn: 'June 6th \'26',
}

export const MOCK_NOTES = [
  {
    id: 1, title: 'On Hypertension', lastEditedBy: 'Dr. Kunett',
    context: 'Notes for Tameka Vincent',
    preview: 'Miss Tameka Vincent shows symptoms of acute hypertension. After a thorough analysis I recommended medicine that should ease any escalate realities caused by high blood pressure.',
    avatar: doctor1, thumbs: [1, 2],
  },
]

export const MOCK_NOTE_DETAIL = {
  title: 'Note Title', createdBy: 'Dr. Zane Brooks', createdOn: 'June 6th \'26',
  body: [
    "Miss Tameka Vincent shows symptoms of acute hypertension. After a thorough analysis, recommended medicine that should address any vascular realities caused by high blood pressure.",
    "Patient advised to reduce sodium intake and follow up in two weeks. Prescribed Lisinopril 10mg once daily.",
  ],
  images: [1, 2],
  editedBy: 'Dr. Jessica Forbes', editedOn: 'June 6th \'26',
}

export const MOCK_DOCUMENTS = [
  {
    id: 1, title: 'Insurance Coverage', from: 'Matteo Vincent',
    avatar: doctor1, previewImg: true,
  },
]

export const MOCK_IMAGING = [
  {
    id: 1, title: 'Cardiogram', lastEditedBy: 'Dr. Kunett',
    context: 'Results for Cardiogram',
    preview: 'Shows an enlarge heart from her condition that constricts it, to less than it\'s normal size. Immediate surgery is recommended.',
    avatar: doctor1, thumbs: [1, 2],
  },
]

export const MOCK_IMAGING_DETAIL = {
  title: 'X-ray Chest', orderedBy: 'Dr. Zane Brooks', tags: ['Thoracic'],
  body: [
    'Cardiac silhouette normal in size and contour. Lung fields clear bilaterally. No pleural effusion or pneumothorax identified.',
    'Costophrenic angles sharp. Bony thorax intact. No acute cardiopulmonary process identified.',
  ],
  images: [1, 2],
  history: {
    datePerformed: 'June 10th, 2026',
    performedBy: 'Dr. A Reid, Radiologist',
    dateOrdered: 'June 10th, 2026',
  },
  results: {
    findings: 'Abnormality Detected, Early Appendicitis',
    status: 'Reviewed, not yet released to patient',
    series: '34 slices',
  },
  editedBy: 'Dr. Jessica Forbes', editedOn: 'June 6th \'26',
}

export const MOCK_LABS = [
  {
    id: 1, title: 'Blood Pressure', lastEditedBy: 'Dr. Kunett',
    context: 'Results for Blood Pressure',
    preview: 'The results denoted a systolic pressure of 138/90, and a diastolic pressure of 150/20. The patient is in critical condition.',
    avatar: doctor1, liveReading: { value: 523, unit: 'mmHg' },
  },
]

export const MOCK_LAB_DETAIL = {
  title: 'Complete Blood Count', orderedBy: 'Dr. Zane Brooks', tags: ['Haematology'],
  body: [
    'Routine complete blood count ordered as part of follow-up evaluation for reported fatigue and intermittent fever.',
  ],
  images: [1, 2],
  history: {
    datePerformed: 'June 11th, 2026',
    performedBy: 'Dr. A Reid, Radiologist',
    dateOrdered: 'June 11th, 2026',
  },
  results: [
    { label: 'WBC',         value: '11.2 × 10³/μL', sub: '(Normal: 4.5–11.0)' },
    { label: 'RBC',         value: '4.8 × 10⁶/μL',  sub: '(Normal: 4.5–5.5)'  },
    { label: 'Hemoglobin',  value: '13.9 g/dL',      sub: '(Normal: 13.5–17.5)' },
    { label: 'Haematocrit', value: '41%',            sub: '(Normal: 38.3–48.6%)' },
    { label: 'Platelets',   value: '245 × 10³/μL',   sub: '(Normal: 150–400)' },
    { label: 'Status',      value: 'Abnormal, Elevated WBC', danger: true },
    { label: 'Patient Notified', value: 'Yes, June 11th, 2026', success: true },
  ],
  editedBy: 'Dr. Jessica Forbes', editedOn: 'June 6th \'26',
}
