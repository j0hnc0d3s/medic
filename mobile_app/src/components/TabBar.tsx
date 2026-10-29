import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import colors from '../constants/colors'

const TAB_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  overview: { label: 'Overview', icon: 'home' },
  appointments: { label: 'Visits', icon: 'calendar' },
  messaging: { label: 'Messages', icon: 'chatbubble-ellipses' },
  documents: { label: 'Records', icon: 'folder' },
  profile: { label: 'Profile', icon: 'person' },
}

export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { bottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name] || { label: route.name, icon: 'ellipse' as const }
          const isFocused = state.index === index

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name)
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.75}
              style={[styles.tabButton, isFocused && styles.tabButtonActive]}
            >
              <Ionicons name={meta.icon} size={19} color={isFocused ? colors.navy : colors.onNavyMuted} />
              {isFocused && <Text style={styles.label}>{meta.label}</Text>}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: colors.navy,
    borderRadius: 34,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 10,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 26,
    minWidth: 46,
  },
  tabButtonActive: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  label: {
    marginLeft: 7,
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
})
