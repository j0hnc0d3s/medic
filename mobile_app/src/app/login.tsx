import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { Redirect } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { post } from '../services/api'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../services/firebase'
import colors from '../constants/colors'

export default function Login() {
  const { currentUser, signIn } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (currentUser) return <Redirect href="/(tabs)/overview" />

  const handleSignIn = async () => {
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      await signIn(email.trim(), password)
    } catch (err: any) {
      setError(mapAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) {
      setError('Please fill in your name, email, and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Same two-step flow as the web app's Login.jsx: the backend
      // creates the Firebase Auth user + Firestore record in one shot,
      // then the client signs in with the same credentials.
      await post('/api/auth/register', {
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        role: 'patient',
      })
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (err: any) {
      setError(mapAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>M</Text>
        </View>
        <Text style={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'signin'
            ? 'Sign in to see your appointments, records, and messages.'
            : 'Set up patient access to your care at Medic.'}
        </Text>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {mode === 'signup' && (
          <View style={styles.row}>
            <View style={[styles.field, styles.half]}>
              <Text style={styles.label}>First name</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
            </View>
            <View style={[styles.field, styles.half]}>
              <Text style={styles.label}>Last name</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
            </View>
          </View>
        )}

        {mode === 'signup' && (
          <View style={styles.field}>
            <Text style={styles.label}>Phone number</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+1 (876) 555-0199" placeholderTextColor={colors.textMuted} />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          disabled={loading}
          onPress={mode === 'signin' ? handleSignIn : handleSignUp}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchModeButton}
          onPress={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
            setError('')
          }}
        >
          <Text style={styles.switchModeText}>
            {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function mapAuthError(err: any): string {
  const code = err?.code || ''
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Incorrect email or password.'
  }
  if (code === 'auth/email-already-in-use') return 'An account with this email already exists.'
  if (code === 'auth/weak-password') return 'Password must be at least 6 characters.'
  if (code === 'auth/invalid-email') return 'That email address looks invalid.'
  return err?.message || 'Something went wrong. Please try again.'
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  scroll: { padding: 24, paddingTop: 72, paddingBottom: 48 },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  brandMarkText: { color: colors.white, fontSize: 22, fontWeight: '800' },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 8, marginBottom: 28, lineHeight: 20 },
  errorBanner: {
    backgroundColor: '#FBEAE8',
    borderWidth: 1,
    borderColor: '#F0C7C2',
    borderRadius: 12,
    padding: 13,
    marginBottom: 18,
  },
  errorText: { color: colors.red, fontSize: 13.5 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 7 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15.5,
    color: colors.textPrimary,
    backgroundColor: colors.card,
  },
  primaryButton: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonText: { color: colors.white, fontWeight: '700', fontSize: 15.5 },
  switchModeButton: { marginTop: 18, alignItems: 'center' },
  switchModeText: { color: colors.blue, fontSize: 13.5, fontWeight: '600' },
})
