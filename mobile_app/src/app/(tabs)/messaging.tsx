import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
import {
  listenToConversations,
  getConversationDisplayName,
  getUnreadCount,
  getOrCreateConversation,
  Conversation,
} from '../../services/messagingService'
import { getPatientAppointments } from '../../services/appointmentService'
import { getDoctors, DoctorUser } from '../../services/patientRecordService'
import colors from '../../constants/colors'

const normalizeDoctorName = (s?: string) => (s || '').replace(/^dr\.?\s*/i, '').trim().toLowerCase()

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function MessagingScreen() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const currentUserId = userProfile?.uid

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [eligibleDoctors, setEligibleDoctors] = useState<DoctorUser[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUserId) return
    const unsubscribe = listenToConversations(currentUserId, setConversations)
    return () => unsubscribe?.()
  }, [currentUserId])

  // A patient can only message a doctor they've had an appointment with,
  // or who already messaged them — same eligibility rule as the web
  // app's PatientSidebar (no open directory browse).
  useEffect(() => {
    if (!currentUserId) return
    const loadEligible = async () => {
      setLoadingDoctors(true)
      try {
        const [doctorsRes, appts] = await Promise.all([getDoctors(), getPatientAppointments(currentUserId)])
        const byName = new Map(doctorsRes.map((d) => [normalizeDoctorName(`${d.firstName || ''} ${d.lastName || ''}`), d]))
        const byId = new Map(doctorsRes.map((d) => [d.uid, d]))

        const eligible = new Map<string, DoctorUser>()
        appts.forEach((a) => {
          const match = byName.get(normalizeDoctorName(a.doctor as string))
          if (match) eligible.set(match.uid, match)
        })
        conversations.forEach((c) => {
          c.participants.forEach((pid) => {
            const d = byId.get(pid)
            if (d) eligible.set(d.uid, d)
          })
        })
        setEligibleDoctors([...eligible.values()])
      } catch (err) {
        console.error('Failed to load eligible doctors:', err)
      } finally {
        setLoadingDoctors(false)
      }
    }
    loadEligible()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, conversations.length])

  const doctorsWithoutConvo = useMemo(() => {
    const convoParticipantIds = new Set(conversations.flatMap((c) => c.participants))
    return eligibleDoctors.filter((d) => !convoParticipantIds.has(d.uid))
  }, [eligibleDoctors, conversations])

  const startConversation = async (doctor: DoctorUser) => {
    if (!currentUserId || !userProfile) return
    setStarting(doctor.uid)
    try {
      const convo = await getOrCreateConversation(currentUserId, doctor.uid, {
        user1Name: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim(),
        user1Role: 'patient',
        user2Name: `Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
        user2Role: 'doctor',
      })
      router.push(`/conversation/${convo.id}`)
    } catch (err) {
      console.error('Failed to start conversation:', err)
    } finally {
      setStarting(null)
    }
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          !loadingDoctors && doctorsWithoutConvo.length > 0 ? (
            <View style={styles.startSection}>
              <Text style={styles.startLabel}>Message your doctor</Text>
              {doctorsWithoutConvo.map((d) => (
                <TouchableOpacity key={d.uid} style={styles.startRow} onPress={() => startConversation(d)} disabled={starting === d.uid}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(`${d.firstName || ''} ${d.lastName || ''}`)}</Text>
                  </View>
                  <Text style={styles.startName}>
                    Dr. {d.firstName} {d.lastName}
                  </Text>
                  {starting === d.uid && <ActivityIndicator size="small" color={colors.navy} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loadingDoctors ? (
            <Text style={styles.emptyText}>
              No conversations yet. {doctorsWithoutConvo.length === 0 ? "They'll show up here once you have an appointment." : 'Message a doctor above to start one.'}
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const name = getConversationDisplayName(item, currentUserId || '')
          const unread = getUnreadCount(item, currentUserId || '')
          return (
            <TouchableOpacity style={styles.convoRow} onPress={() => router.push(`/conversation/${item.id}`)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(name)}</Text>
                {unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unread}</Text>
                  </View>
                )}
              </View>
              <View style={styles.convoBody}>
                <Text style={styles.convoName}>{name}</Text>
                <Text style={styles.convoPreview} numberOfLines={1}>
                  {item.lastMessage || 'No messages yet'}
                </Text>
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  listContent: { padding: 20, paddingTop: 4, paddingBottom: 120 },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 13.5, marginTop: 30, paddingHorizontal: 10 },
  startSection: { marginBottom: 18 },
  startLabel: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  startName: { fontSize: 14.5, fontWeight: '600', color: colors.textPrimary, marginLeft: 12 },
  convoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.red,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  convoBody: { marginLeft: 12, flex: 1 },
  convoName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  convoPreview: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
})
