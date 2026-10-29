// Same Firebase project as web_app/frontend — this app reuses that
// backend entirely rather than standing up its own. Patient data,
// auth, Firestore security rules: all identical to the web portal.
import { initializeApp, getApps, getApp } from 'firebase/app'
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

// Native (iOS/Android) needs explicit AsyncStorage persistence or the
// session doesn't survive an app restart. Web (Expo web / Metro web
// preview) uses the SDK's own default browser persistence instead —
// initializeAuth with RN persistence throws there.
let auth: Auth
if (Platform.OS === 'web') {
  auth = getAuth(app)
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  })
}

export { auth }
export const db = getFirestore(app)
export default app
