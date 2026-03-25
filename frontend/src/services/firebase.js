import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// TODO: Replace with your Firebase config
// Get this from Firebase Console > Project Settings > General

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCyUUzd4XvdHCnxCWay7L97hynidvEIuE0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "medic-5b04c.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://medic-5b04c-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ||"medic-5b04c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "medic-5b04c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "466347367932",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:466347367932:web:65c28ef549f3ea9c6de679",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-04S12ZK56P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app
