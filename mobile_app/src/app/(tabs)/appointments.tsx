import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { getPatientAppointments, toDate, Appointment } from '../../services/appointmentService'
import colors from '../../constants/colors'

const STATUS_COLORS: Record<string, string> = {
  scheduled: colors.amber,
  confirmed: colors.blue,
  'in-progress': '#2D9C9C',
  completed: colors.green,
  cancelled: colors.red,
  'no-show': colors.grey,
}

const FILTERS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'all', label: 'All' },
] as const

type FilterKey = (typeof FILTERS)[number]['key']

function labelize(s?: string) {
  return (s || '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function AppointmentsScreen() {
  const { userProfile } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterKey>('upcoming')

  const load = useCallback(async () => {
    if (!userProfile?.uid) return
    try {
      const data = await getPatientAppointments(userProfile.uid)
      setAppointments(data)
    } catch (err) {
      console.error('Failed to load appointments:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userProfile])

  useEffect(() => {
    load()
  }, [load])

  const filtered = appointments.filter((a) => {
    if (filter === 'all') return true
    const d = toDate(a.appointmentDate)
    if (!d) return true
    return filter === 'upcoming' ? d >= new Date() : d < new Date()
  })

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>My appointments</Text>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.navy} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                load()
              }}
              tintColor={colors.navy}
            />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No {filter === 'all' ? '' : filter} appointments.</Text>}
          renderItem={({ item }) => {
            const date = toDate(item.appointmentDate)
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.doctor}>{item.doctor || 'Doctor TBD'}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${STATUS_COLORS[item.status || ''] || colors.grey}22` },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: STATUS_COLORS[item.status || ''] || colors.grey }]}>
                      {labelize(item.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.type}>{item.type || 'Appointment'}</Text>
                <View style={styles.cardBottom}>
                  <Text style={styles.dateText}>
                    {date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || '—'}
                  </Text>
                  {item.appointmentTime ? <Text style={styles.timeText}>{item.appointmentTime}</Text> : null}
                </View>
                {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 14 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterChipText: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  filterChipTextActive: { color: colors.white },
  listContent: { padding: 20, paddingTop: 4, paddingBottom: 120 },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 13.5, marginTop: 40 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doctor: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '700' },
  type: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  cardBottom: { flexDirection: 'row', gap: 10, marginTop: 12 },
  dateText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  timeText: { fontSize: 13, fontWeight: '600', color: colors.blue },
  notes: { fontSize: 12.5, color: colors.textMuted, marginTop: 8, lineHeight: 17 },
})
