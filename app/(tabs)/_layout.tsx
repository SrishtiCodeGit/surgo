import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="⚡" color={color} focused={focused} theme={theme} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="🎯" color={color} focused={focused} theme={theme} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="📈" color={color} focused={focused} theme={theme} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="👤" color={color} focused={focused} theme={theme} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  emoji,
  focused,
  theme,
}: {
  emoji: string;
  color: string;
  focused: boolean;
  theme: any;
}) {
  return (
    <View
      style={{
        width: 36,
        height: 28,
        borderRadius: 10,
        backgroundColor: focused ? theme.colors.primaryLight : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
    </View>
  );
}
