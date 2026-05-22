import { Tabs } from 'expo-router';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { Theme } from '@/types';

// ─── Tab icons (SVG — no emoji) ───────────────────────────────────────────────

function IconToday({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Calendar with a checkmark */}
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M8 2 L8 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M16 2 L16 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M3 9 L21 9" stroke={color} strokeWidth="1.6" />
      <Path d="M8.5 14.5 L11 17 L15.5 12.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function IconProgress({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Bar chart — 3 bars rising */}
      <Rect x="3"  y="13" width="4.5" height="8" rx="1.5" fill={color} opacity="0.55" />
      <Rect x="9.75"  y="9"  width="4.5" height="12" rx="1.5" fill={color} opacity="0.75" />
      <Rect x="16.5" y="4"  width="4.5" height="17" rx="1.5" fill={color} />
    </Svg>
  );
}

function IconProfile({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Person silhouette */}
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" />
      <Path
        d="M4 20 C4 16.13 7.58 13 12 13 C16.42 13 20 16.13 20 20"
        stroke={color} strokeWidth="1.8" strokeLinecap="round"
      />
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
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} theme={theme}>
              <IconProgress color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} theme={theme}>
              <IconProfile color={color} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}
