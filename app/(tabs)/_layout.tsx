import { Tabs } from 'expo-router';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { Theme } from '@/types';

// ─── Tab icons (SVG — no emoji) ───────────────────────────────────────────────

function IconToday({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Calendar body — drawn with Path instead of Rect */}
      <Path d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z"
        stroke={color} strokeWidth="1.8" />
      <Path d="M8 2v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M16 2v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M3 9h18" stroke={color} strokeWidth="1.6" />
      <Path d="M8.5 14.5L11 17l4.5-4.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconGoals({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Target / bullseye */}
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="2" fill={color} />
    </Svg>
  );
}

function IconDiet({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Fork */}
      <Path d="M8 2v4M8 10v10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M6 2v3a2 2 0 0 0 4 0V2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Knife */}
      <Path d="M16 2c0 0 2 2.5 2 6s-2 5-2 5v9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconProfile({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" />
      <Path
        d="M4 20 C4 16.13 7.58 13 12 13 C16.42 13 20 16.13 20 20"
        stroke={color} strokeWidth="1.8" strokeLinecap="round"
      />
    </Svg>
  );
}

function IconChat({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Speech bubble with sparkle dots */}
      <Path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx="9"  cy="10" r="1" fill={color} />
      <Circle cx="12" cy="10" r="1" fill={color} />
      <Circle cx="15" cy="10" r="1" fill={color} />
    </Svg>
  );
}

// ─── Tab item wrapper ─────────────────────────────────────────────────────────

function TabIcon({
  focused,
  theme,
  children,
}: {
  focused: boolean;
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 44, height: 26 }}>
      {/* Active indicator dot above icon */}
      {focused && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.colors.primary,
          }}
        />
      )}
      <View style={{ marginTop: focused ? 6 : 0 }}>
        {children}
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

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
          height: 76,
          paddingBottom: 14,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 6,
        },
        tabBarActiveTintColor:   theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.4,
          marginTop: 3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} theme={theme}>
              <IconToday color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} theme={theme}>
              <IconGoals color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="diet"
        options={{
          title: 'Diet',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} theme={theme}>
              <IconDiet color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          href: null,  // accessed via icon on Today tab
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Surgo',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} theme={theme}>
              <IconChat color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,   // hidden from tab bar — accessed via icon on Today
        }}
      />
    </Tabs>
  );
}
