// Direct port of web_app/frontend's messagingService.js real-time
// listener + send/read methods — same `conversations` collection,
// same `conversations/{id}/messages` subcollection, same fields.
// Create/admin-only methods from the original aren't needed here.
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

export type Conversation = {
  id: string
  participants: string[]
  participantDetails?: Record<string, { name?: string; role?: string }>
  lastMessage?: string
  lastMessageAt?: Timestamp
  unreadCount?: Record<string, number>
}

export type Message = {
  id: string
  text: string
  senderId: string
  senderName: string
  senderRole: string
  timestamp: Timestamp
  read?: boolean
}

export function listenToConversations(userId: string, callback: (c: Conversation[]) => void) {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc'),
    )
    return onSnapshot(
      q,
      (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversation)),
      (err) => {
        console.error('Conversations listener error:', err)
        callback([])
      },
    )
  } catch (err) {
    console.error('Listen to conversations setup error:', err)
    callback([])
    return () => {}
  }
}

export function listenToMessages(conversationId: string, callback: (m: Message[]) => void) {
  try {
    const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('timestamp', 'asc'))
    return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message)))
  } catch (err) {
    console.error('Listen to messages error:', err)
    return () => {}
  }
}

export async function sendMessage(
  conversationId: string,
  message: { text: string; senderId: string; senderName: string; senderRole: string },
) {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages')
  await addDoc(messagesRef, {
    text: message.text.trim(),
    senderId: message.senderId,
    senderName: message.senderName,
    senderRole: message.senderRole,
    timestamp: Timestamp.now(),
    read: false,
  })

  const convoRef = doc(db, 'conversations', conversationId)
  const convoSnap = await getDoc(convoRef)
  const convoData = convoSnap.data() as Conversation | undefined
  const otherUserId = convoData?.participants.find((id) => id !== message.senderId)

  await updateDoc(convoRef, {
    lastMessage: message.text.trim(),
    lastMessageAt: Timestamp.now(),
    ...(otherUserId ? { [`unreadCount.${otherUserId}`]: (convoData?.unreadCount?.[otherUserId] || 0) + 1 } : {}),
  })
}

export async function markAsRead(conversationId: string, userId: string) {
  await updateDoc(doc(db, 'conversations', conversationId), {
    [`unreadCount.${userId}`]: 0,
  })
}

export async function getOrCreateConversation(
  userId1: string,
  userId2: string,
  userData: { user1Name: string; user1Role: string; user2Name: string; user2Role: string },
): Promise<Conversation> {
  const conversationsRef = collection(db, 'conversations')
  const q = query(conversationsRef, where('participants', 'array-contains', userId1))
  const snapshot = await getDocs(q)
  const existing = snapshot.docs.find((d) => (d.data() as Conversation).participants.includes(userId2))
  if (existing) return { id: existing.id, ...existing.data() } as Conversation

  const newConvo = {
    participants: [userId1, userId2],
    participantDetails: {
      [userId1]: { name: userData.user1Name, role: userData.user1Role },
      [userId2]: { name: userData.user2Name, role: userData.user2Role },
    },
    lastMessage: '',
    lastMessageAt: Timestamp.now(),
    createdAt: Timestamp.now(),
    unreadCount: { [userId1]: 0, [userId2]: 0 },
  }
  const docRef = await addDoc(conversationsRef, newConvo)
  return { id: docRef.id, ...newConvo }
}

export function getConversationDisplayName(conversation: Conversation, currentUserId: string): string {
  const otherUserId = conversation.participants.find((id) => id !== currentUserId)
  return (otherUserId && conversation.participantDetails?.[otherUserId]?.name) || 'Unknown user'
}

export function getUnreadCount(conversation: Conversation, currentUserId: string): number {
  return conversation.unreadCount?.[currentUserId] || 0
}
