import { Tabs } from 'expo-router'
import { Redirect } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
import TabBar from '../../components/TabBar'

export default function TabsLayout() {
  const { currentUser, loading } = useAuth()

  if (!loading && !currentUser) return <Redirect href="/login" />

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="overview" />
      <Tabs.Screen name="appointments" />
      <Tabs.Screen name="messaging" />
      <Tabs.Screen name="documents" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}
