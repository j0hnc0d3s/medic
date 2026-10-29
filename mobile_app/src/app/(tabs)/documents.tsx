import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { getPatientRecordsFeed, FeedItem, FeedKind } from '../../services/documentsService'
import colors from '../../constants/colors'

const TABS: { key: 'all' | FeedKind; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'documents', label: 'Documents' },
  { key: 'labs', label: 'Labs' },
  { key: 'imaging', label: 'Imaging' },
]

const KIND_ICON: Record<FeedKind, keyof typeof Ionicons.glyphMap> = {
  documents: 'document-text',
  labs: 'flask',
  imaging: 'scan',
}

const KIND_LABEL: Record<FeedKind, string> = {
  documents: 'Document',
  labs: 'Lab result',
  imaging: 'Imaging',
}

function formatDate(value: any) {
  const d = value?.toDate ? value.toDate() : new Date(value)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DocumentsScreen() {
  const { userProfile } = useAuth()
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<'all' | FeedKind>('all')

  const load = useCallback(async () => {
    if (!userProfile?.uid) return
    try {
      const data = await getPatientRecordsFeed(userProfile.uid)
      setFeed(data)
    } catch (err) {
      console.error('Failed to load records:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userProfile])

  useEffect(() => {
    load()
  }, [load])

  const visible = tab === 'all' ? feed : feed.filter((f) => f.kind === tab)

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>My records</Text>
        <View style={styles.tabRow}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.key} style={[styles.tabChip, tab === t.key && styles.tabChipActive]} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabChipText, tab === t.key && styles.tabChipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.navy} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={colors.navy} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nothing here yet — results and imaging will show up as soon as they're ready.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.kindBadge}>
                  <Ionicons name={KIND_ICON[item.kind]} size={13} color={colors.blue} />
                  <Text style={styles.kindText}>{KIND_LABEL[item.kind]}</Text>
                </View>
                <Text style={styles.dateText}>{formatDate(item.date)}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title || 'Untitled'}</Text>
              {item.kind === 'labs' && renderLabPreview(item.data)}
              {item.kind === 'documents' && (item.data.fileName as string) && (
                <Text style={styles.fileName}>{item.data.fileName as string}</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  )
}

function renderLabPreview(data: Record<string, unknown>) {
  const results = (data.results as Record<string, unknown>) || {}
  const entries = Object.entries(results).filter(([, v]) => v !== '' && v != null)
  if (entries.length === 0) {
    return <Text style={styles.labNote}>{(data.notes as string) || 'No details on file.'}</Text>
  }
  return (
    <View style={styles.labResults}>
      {entries.slice(0, 4).map(([k, v]) => (
        <View key={k} style={styles.labRow}>
          <Text style={styles.labKey}>{k}</Text>
          <Text style={styles.labValue}>{String(v)}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 14 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 },
  tabRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tabChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  tabChipText: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  tabChipTextActive: { color: colors.white },
  listContent: { padding: 20, paddingTop: 4, paddingBottom: 120 },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 13.5, marginTop: 40, paddingHorizontal: 20 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kindBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kindText: { fontSize: 11.5, fontWeight: '700', color: colors.blue },
  dateText: { fontSize: 12, color: colors.textMuted },
  cardTitle: { fontSize: 15.5, fontWeight: '700', color: colors.textPrimary, marginTop: 10 },
  fileName: { fontSize: 12.5, color: colors.textSecondary, marginTop: 6 },
  labResults: { marginTop: 10, gap: 4 },
  labRow: { flexDirection: 'row', justifyContent: 'space-between' },
  labKey: { fontSize: 12.5, color: colors.textSecondary },
  labValue: { fontSize: 12.5, fontWeight: '700', color: colors.textPrimary },
  labNote: { fontSize: 12.5, color: colors.textMuted, marginTop: 8 },
})
