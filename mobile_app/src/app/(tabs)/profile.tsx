import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updatePassword } from 'firebase/auth'
import { db, auth } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'
import colors from '../../constants/colors'

type Channel = 'inApp' | 'email'
type Category = 'message' | 'appointment' | 'lab'

const NOTIF_CATEGORIES: { key: Category; label: string; hint: string }[] = [
  { key: 'message', label: 'Messages', hint: 'When your doctor messages you' },
  { key: 'appointment', label: 'Appointments', hint: 'Upcoming appointment reminders' },
  { key: 'lab', label: 'Labs', hint: 'When test results or imaging are ready' },
]

const DEFAULT_PREFS: Record<Category, Record<Channel, boolean>> = {
  message: { inApp: true, email: false },
  appointment: { inApp: true, email: true },
  lab: { inApp: true, email: true },
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function ProfileScreen() {
  const { userProfile, signOut } = useAuth()
  const router = useRouter()

  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!userProfile?.uid) return
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', userProfile.uid))
        if (snap.exists()) {
          const stored = (snap.data().notificationPreferences as Record<string, boolean>) || {}
          setPrefs((p) => {
            const next = { ...p }
            ;(Object.keys(next) as Category[]).forEach((k) => {
              if (typeof stored[k] === 'boolean') next[k] = { ...next[k], inApp: stored[k] }
            })
            return next
          })
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userProfile?.uid])

  const toggleChannel = (category: Category, channel: Channel) => {
    setPrefs((p) => ({ ...p, [category]: { ...p[category], [channel]: !p[category][channel] } }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!userProfile?.uid) return
    setSaving(true)
    try {
      const flat: Record<string, boolean> = {}
      ;(Object.entries(prefs) as [Category, Record<Channel, boolean>][]).forEach(([k, v]) => {
        flat[k] = v.inApp
      })
      await updateDoc(doc(db, 'users', userProfile.uid), {
        notificationPreferences: flat,
        notificationChannels: prefs,
      })
      setSaved(true)
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordMsg(null)
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' })
      return
    }
    try {
      if (!auth.currentUser) throw new Error('Not signed in')
      await updatePassword(auth.currentUser, newPassword)
      setPasswordMsg({ type: 'success', text: 'Password updated.' })
      setNewPassword('')
    } catch (err: any) {
      setPasswordMsg({
        type: 'error',
        text:
          err?.code === 'auth/requires-recent-login'
            ? 'For security, please sign out and back in before changing your password.'
            : 'Failed to update password.',
      })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  const fullName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Patient'

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.profileHead}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
        </View>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.email}>{userProfile?.email}</Text>
        {userProfile?.phone ? <Text style={styles.phone}>{userProfile.phone as string}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Notifications</Text>
      <Text style={styles.sectionSub}>Choose what you're notified about, and how.</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={colors.navy} />
      ) : (
        <View style={styles.card}>
          <View style={styles.notifHeadRow}>
            <Text style={styles.notifHeadLabel} />
            <Text style={styles.notifHeadChannel}>In-app</Text>
            <Text style={styles.notifHeadChannel}>Email</Text>
          </View>
          {NOTIF_CATEGORIES.map((cat) => (
            <View key={cat.key} style={styles.notifRow}>
              <View style={styles.notifLabelCol}>
                <Text style={styles.notifLabel}>{cat.label}</Text>
                <Text style={styles.notifHint}>{cat.hint}</Text>
              </View>
              {(['inApp', 'email'] as Channel[]).map((ch) => (
                <TouchableOpacity
                  key={ch}
                  style={[styles.toggle, prefs[cat.key][ch] && styles.toggleOn]}
                  onPress={() => toggleChannel(cat.key, ch)}
                >
                  <View style={[styles.toggleKnob, prefs[cat.key][ch] && styles.toggleKnobOn]} />
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <Text style={styles.note}>
            Email delivery isn't wired up yet — the toggle is saved, but only in-app notifications actually send right now.
          </Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Security</Text>
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="New password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        {passwordMsg && (
          <Text style={[styles.passwordMsg, passwordMsg.type === 'error' ? styles.passwordError : styles.passwordSuccess]}>
            {passwordMsg.text}
          </Text>
        )}
        <TouchableOpacity style={styles.secondaryButton} onPress={handlePasswordChange}>
          <Text style={styles.secondaryButtonText}>Update password</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, paddingTop: 64 },
  profileHead: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: colors.white, fontSize: 24, fontWeight: '800' },
  name: { fontSize: 19, fontWeight: '800', color: colors.textPrimary },
  email: { fontSize: 13.5, color: colors.textSecondary, marginTop: 3 },
  phone: { fontSize: 13.5, color: colors.textSecondary, marginTop: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 4, marginTop: 6 },
  sectionSub: { fontSize: 12.5, color: colors.textSecondary, marginBottom: 12 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginBottom: 24 },
  notifHeadRow: { flexDirection: 'row', marginBottom: 6 },
  notifHeadLabel: { flex: 1 },
  notifHeadChannel: { width: 54, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.textMuted },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  notifLabelCol: { flex: 1 },
  notifLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  notifHint: { fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  toggle: { width: 54, alignItems: 'center' },
  toggleKnob: { width: 36, height: 20, borderRadius: 10, backgroundColor: colors.border, justifyContent: 'center' },
  toggleOn: {},
  toggleKnobOn: { backgroundColor: colors.blue },
  note: { fontSize: 11.5, color: colors.textMuted, marginTop: 10, lineHeight: 16 },
  saveButton: { backgroundColor: colors.blue, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  saveButtonText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14.5, color: colors.textPrimary, marginBottom: 10 },
  passwordMsg: { fontSize: 12.5, marginBottom: 10 },
  passwordError: { color: colors.red },
  passwordSuccess: { color: colors.green },
  secondaryButton: { borderWidth: 1.5, borderColor: colors.navy, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: colors.navy, fontWeight: '700', fontSize: 13.5 },
  signOutButton: { alignItems: 'center', paddingVertical: 14 },
  signOutText: { color: colors.red, fontWeight: '700', fontSize: 14 },
})
