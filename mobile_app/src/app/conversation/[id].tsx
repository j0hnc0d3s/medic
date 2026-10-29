import { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { listenToMessages, sendMessage, markAsRead, Message } from '../../services/messagingService'
import colors from '../../constants/colors'

function formatTime(ts: any) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const { userProfile } = useAuth()
  const currentUserId = userProfile?.uid || ''

  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    if (!id) return
    const unsubscribe = listenToMessages(id, setMessages)
    markAsRead(id, currentUserId).catch(() => {})
    return () => unsubscribe?.()
  }, [id, currentUserId])

  useEffect(() => {
    navigation.setOptions({ title: 'Messages' })
  }, [navigation])

  const handleSend = async () => {
    if (!text.trim() || !id) return
    const body = text.trim()
    setText('')
    const senderName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Patient'
    try {
      await sendMessage(id, { text: body, senderId: currentUserId, senderName, senderRole: 'patient' })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const otherName = useMemo(() => {
    const fromOther = messages.find((m) => m.senderId !== currentUserId)
    return fromOther?.senderName || 'Conversation'
  }, [messages, currentUserId])

  useEffect(() => {
    navigation.setOptions({ title: otherName })
  }, [otherName, navigation])

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.senderId === currentUserId
          return (
            <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.text}</Text>
                <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>{formatTime(item.timestamp)}</Text>
              </View>
            </View>
          )
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No messages yet. Say hello.</Text>}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Send a message"
          placeholderTextColor={colors.textMuted}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={!text.trim()}>
          <Ionicons name="arrow-up" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  listContent: { padding: 16, paddingBottom: 24 },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 13.5, marginTop: 40 },
  bubbleRow: { flexDirection: 'row', marginBottom: 10 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleTheirs: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: colors.blue, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14.5, color: colors.textPrimary, lineHeight: 19 },
  bubbleTextMine: { color: colors.white },
  bubbleTime: { fontSize: 10, color: colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14.5,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
