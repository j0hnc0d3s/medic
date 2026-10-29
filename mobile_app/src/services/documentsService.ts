// Mirrors PatientDocuments.jsx's combined feed: documents + completed
// labs + imaging, same three collections and fields as the web app's
// documentService/labService/imagingService.
import { collection, getDocs, orderBy, query, where, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

export type FeedKind = 'documents' | 'labs' | 'imaging'

export type FeedItem = {
  kind: FeedKind
  id: string
  title: string
  date?: Timestamp | string | null
  data: Record<string, unknown>
}

async function fetchCollection(name: string, orderField: string, patientId: string) {
  const q = query(collection(db, name), where('patientId', '==', patientId), orderBy(orderField, 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, any>)
}

export async function getPatientRecordsFeed(patientId: string): Promise<FeedItem[]> {
  const [docs, labs, imaging] = await Promise.all([
    fetchCollection('documents', 'uploadedAt', patientId),
    fetchCollection('labs', 'createdAt', patientId),
    fetchCollection('imaging', 'createdAt', patientId),
  ])

  const items: FeedItem[] = [
    ...docs.map((d) => ({ kind: 'documents' as const, id: d.id, title: d.name || 'Document', date: d.uploadedAt, data: d })),
    // Only completed labs are real results — a 'requested' one has nothing to show yet.
    ...labs.filter((l) => l.status === 'completed').map((l) => ({ kind: 'labs' as const, id: l.id, title: l.title || 'Lab result', date: l.updatedAt || l.createdAt, data: l })),
    ...imaging.map((i) => ({ kind: 'imaging' as const, id: i.id, title: i.title || 'Imaging', date: i.createdAt, data: i })),
  ]

  return items.sort((a, b) => {
    const da = toMillis(a.date)
    const db_ = toMillis(b.date)
    return db_ - da
  })
}

function toMillis(value: Timestamp | string | null | undefined): number {
  if (!value) return 0
  if (typeof value === 'object' && 'toDate' in value) return value.toDate().getTime()
  const d = new Date(value)
  return isNaN(d.getTime()) ? 0 : d.getTime()
}
