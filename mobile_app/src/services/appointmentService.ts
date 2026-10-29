// Patient-scoped subset of web_app/frontend's appointmentService.js —
// same collection, same fields, same query shape. A patient only ever
// reads their own appointments (Firestore rules enforce that server-side
// too), so this intentionally doesn't carry the staff create/update/
// cancel/conflict-check methods from the original service.
import { collection, getDocs, orderBy, query, where, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

export type Appointment = {
  id: string
  doctor?: string
  type?: string
  notes?: string
  status?: string
  appointmentDate?: Timestamp | string
  appointmentTime?: string
  [key: string]: unknown
}

export async function getPatientAppointments(patientId: string): Promise<Appointment[]> {
  const q = query(
    collection(db, 'appointments'),
    where('patientId', '==', patientId),
    orderBy('appointmentDate', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment)
}

export function toDate(value: Timestamp | string | undefined): Date | null {
  if (!value) return null
  if (typeof value === 'object' && 'toDate' in value) return value.toDate()
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}
