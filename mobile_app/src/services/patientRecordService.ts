// Patient's own clinical snapshot (allergies, medications) + the doctor
// directory used for Overview display and for Messaging's "who can I
// message" eligibility check. Mirrors PatientOverview.jsx's loadMedicalRecord
// and PatientSidebar.jsx's doctor-contacts resolution.
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from './firebase'

export type Allergy = {
  id: string | number
  name: string
  severity: string
  desc: string
  status: string
  doctor: string | null
}

export type Medication = {
  id: string | number
  name: string
  dose: string
  freq: string
  desc: string
  status: string
  doctor: string | null
  progress: number | null
}

export type DoctorUser = {
  uid: string
  firstName?: string
  lastName?: string
  profilePictureUrl?: string
}

function mapAllergy(entry: any, i: number): Allergy {
  const a = typeof entry === 'string' ? { name: entry } : entry
  return {
    id: a.id ?? i,
    name: a.name || a.allergen || 'Unknown allergen',
    severity: a.severity || 'Unknown',
    desc: a.reaction || a.description || a.desc || 'No reaction details on file.',
    status: (a.status || 'active').toLowerCase(),
    doctor: a.diagnosedBy || a.prescribedBy || a.doctor || null,
  }
}

function computeMedProgress(m: any): number | null {
  const start = m.startDate?.toDate ? m.startDate.toDate() : m.startDate ? new Date(m.startDate) : null
  const end = m.endDate?.toDate ? m.endDate.toDate() : m.endDate ? new Date(m.endDate) : null
  if (!start || !end || end <= start) return null
  const now = new Date()
  const pct = ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100
  return Math.max(0, Math.min(100, Math.round(pct)))
}

function mapMedication(entry: any, i: number): Medication {
  const m = typeof entry === 'string' ? { name: entry } : entry
  return {
    id: m.id ?? i,
    name: m.name || 'Medication',
    dose: m.dosage || m.dose || '—',
    freq: m.frequency || m.freq || '—',
    desc: m.description || m.desc || 'No description on file.',
    status: (m.status || 'active').toLowerCase(),
    doctor: m.prescribedBy || m.doctor || null,
    progress: computeMedProgress(m),
  }
}

export async function getDoctors(): Promise<DoctorUser[]> {
  const q = query(collection(db, 'users'), where('role', '==', 'doctor'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as DoctorUser)
}

export async function getPatientByEmail(email: string) {
  const q = query(collection(db, 'patients'), where('email', '==', email.toLowerCase()), limit(5))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Record<string, any>
}

export async function getMedicalRecord(userProfile: { patientRecordId?: string; email?: string }) {
  let record: Record<string, any> | null = null

  if (userProfile.patientRecordId) {
    const snap = await getDoc(doc(db, 'patients', userProfile.patientRecordId))
    if (snap.exists()) record = { id: snap.id, ...snap.data() }
  }
  if (!record && userProfile.email) {
    record = await getPatientByEmail(userProfile.email)
  }

  const allergies: Allergy[] = (record?.allergies || []).map(mapAllergy)
  const medications: Medication[] = (record?.medications || []).map(mapMedication)

  return { record, allergies, medications }
}
