import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { getPatientAppointments, toDate, Appointment } from '../../services/appointmentService'
import { getMedicalRecord, Allergy, Medication } from '../../services/patientRecordService'
import colors from '../../constants/colors'

const SEVERITY_COLOR: Record<string, string> = {
  severe: colors.red,
  moderate: colors.amber,
  mild: colors.green,
  unknown: colors.grey,
}

export default function Overview() {
  const { userProfile } = useAuth()
  const router = useRouter()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [allergies, setAllergies] = useState<Allergy[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!userProfile?.uid) return
    try {
      const [appts, med] = await Promise.all([
        getPatientAppointments(userProfile.uid),
        getMedicalRecord(userProfile),
      ])
      setAppointments(appts.filter((a) => a.status !== 'cancelled'))
      setAllergies(med.allergies.filter((a) => a.status === 'active'))
      setMedications(med.medications.filter((m) => m.status === 'active'))
    } catch (err) {
      console.error('Failed to load overview:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userProfile])

  useEffect(() => {
    load()
  }, [load])

  const onRefresh = () => {
    setRefreshing(true)
    load()
  }

  const upcoming = appointments
    .filter((a) => {
      const d = toDate(a.appointmentDate)
      return d && d >= new Date()
    })
    .sort((a, b) => (toDate(a.appointmentDate)?.getTime() || 0) - (toDate(b.appointmentDate)?.getTime() || 0))[0]

  const firstName = userProfile?.firstName || 'there'

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
    >
      <Text style={styles.greeting}>Hi, {firstName}</Text>
      <Text style={styles.subGreeting}>Here's where things stand with your care.</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Next appointment</Text>
        {upcoming ? (
          <>
            <Text style={styles.heroDoctor}>{upcoming.doctor || 'Doctor to be assigned'}</Text>
            <Text style={styles.heroMeta}>
              {toDate(upcoming.appointmentDate)?.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
              {upcoming.appointmentTime ? ` · ${upcoming.appointmentTime}` : ''}
            </Text>
            {upcoming.type ? <Text style={styles.heroTag}>{upcoming.type}</Text> : null}
          </>
        ) : (
          <Text style={styles.heroEmpty}>Nothing scheduled right now.</Text>
        )}
        <View style={styles.heroButtonRow}>
          <Text style={styles.heroLink} onPress={() => router.push('/(tabs)/appointments')}>
            View all appointments
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.onNavyMuted} />
        </View>
      </View>

      <SectionHeader title="Allergies" count={allergies.length} />
      {allergies.length === 0 ? (
        <EmptyNote text="No active allergies on file." />
      ) : (
        allergies.map((a) => (
          <View key={a.id} style={styles.infoRow}>
            <View style={[styles.dot, { backgroundColor: SEVERITY_COLOR[a.severity.toLowerCase()] || colors.grey }]} />
            <View style={styles.infoBody}>
              <Text style={styles.infoTitle}>{a.name}</Text>
              <Text style={styles.infoSub}>{a.desc}</Text>
            </View>
            <Text style={styles.infoBadge}>{a.severity}</Text>
          </View>
        ))
      )}

      <SectionHeader title="Current medications" count={medications.length} />
      {medications.length === 0 ? (
        <EmptyNote text="No active medications on file." />
      ) : (
        medications.map((m) => (
          <View key={m.id} style={styles.infoRow}>
            <View style={[styles.dot, { backgroundColor: colors.blue }]} />
            <View style={styles.infoBody}>
              <Text style={styles.infoTitle}>{m.name}</Text>
              <Text style={styles.infoSub}>
                {m.dose} · {m.freq}
              </Text>
            </View>
          </View>
        ))
      )}

      <View style={{ height: 110 }} />
    </ScrollView>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count > 0 && <Text style={styles.sectionCount}>{count}</Text>}
    </View>
  )
}

function EmptyNote({ text }: { text: string }) {
  return <Text style={styles.emptyNote}>{text}</Text>
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  content: { padding: 20, paddingTop: 64 },
  greeting: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  subGreeting: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 22 },
  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: 20,
    padding: 22,
    marginBottom: 28,
  },
  heroLabel: { color: colors.onNavyMuted, fontSize: 12.5, fontWeight: '700', marginBottom: 10 },
  heroDoctor: { color: colors.onNavy, fontSize: 20, fontWeight: '800' },
  heroMeta: { color: colors.onNavyMuted, fontSize: 14, marginTop: 6 },
  heroTag: {
    color: colors.onNavy,
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 12,
  },
  heroEmpty: { color: colors.onNavyMuted, fontSize: 14.5, marginTop: 2 },
  heroButtonRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  heroLink: { color: colors.onNavy, fontSize: 13.5, fontWeight: '700', marginRight: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sectionCount: { marginLeft: 8, fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  emptyNote: { color: colors.textMuted, fontSize: 13.5, marginBottom: 20 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: 12 },
  infoBody: { flex: 1 },
  infoTitle: { fontSize: 14.5, fontWeight: '700', color: colors.textPrimary },
  infoSub: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  infoBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
})
