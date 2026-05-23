import {
  View, Text, Modal, ScrollView,
  TouchableOpacity, Pressable, Animated,
} from 'react-native';
import { useEffect, useRef } from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { SurgoNotif, NotifType } from '@/stores/notificationStore';

// ─── Bell icon with badge ─────────────────────────────────────────────────────

export function BellIcon({
  unread,
  onPress,
}: {
  unread: number;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (unread === 0) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue:  6, duration: 80, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -6, duration: 80, useNativeDriver: true }),
        Animated.timing(shake, { toValue:  4, duration: 70, useNativeDriver: true }),
        Animated.timing(shake, { toValue:  0, duration: 70, useNativeDriver: true }),
        Animated.delay(3500),
      ]),
      { iterations: 3 },
    );
    anim.start();
    return () => anim.stop();
  }, [unread]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={{ position: 'relative' }}>
      <Animated.View style={{ transform: [{ rotate: shake.interpolate({ inputRange: [-6, 6], outputRange: ['-6deg', '6deg'] }) }] }}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          {/* Bell body */}
          <Path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
            stroke={theme.colors.text}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Clapper */}
          <Path
            d="M13.73 21a2 2 0 0 1-3.46 0"
            stroke={theme.colors.text}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>

      {/* Unread badge */}
      {unread > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            backgroundColor: '#FF3B30',
            borderRadius: 8,
            minWidth: 16,
            height: 16,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 3,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>
            {unread > 9 ? '9+' : unread}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Notification type icon ───────────────────────────────────────────────────

function NotifIcon({ type, primary }: { type: NotifType; primary: string }) {
  const size = 18;
  switch (type) {
    case 'streak':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'task':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M9 11l3 3L22 4" stroke={primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke={primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'milestone':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={primary} strokeWidth={2} />
          <Path d="M12 8v4l3 3" stroke={primary} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'tip':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={primary} strokeWidth={2} />
          <Path d="M12 16v-4M12 8h.01" stroke={primary} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    default: // motivation
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
  }
}

// ─── Time formatter ───────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotifRow({ notif }: { notif: SurgoNotif }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: notif.isRead ? theme.colors.surface : theme.colors.primaryLight,
        borderRadius: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: notif.isRead ? theme.colors.border : theme.colors.primary + '30',
      }}
    >
      {/* Icon bubble */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.colors.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <NotifIcon type={notif.type} primary={theme.colors.primary} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 13,
              fontWeight: '700',
              flex: 1,
              marginRight: 8,
            }}
          >
            {notif.title}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '500', marginTop: 1 }}>
            {timeAgo(notif.timestamp)}
          </Text>
        </View>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 }}>
          {notif.body}
        </Text>
      </View>

      {/* Unread dot */}
      {!notif.isRead && (
        <View
          style={{
            width: 7, height: 7, borderRadius: 4,
            backgroundColor: theme.colors.primary,
            position: 'absolute',
            top: 14, right: 14,
          }}
        />
      )}
    </View>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function NotificationPanel({
  visible,
  notifs,
  onClose,
}: {
  visible: boolean;
  notifs: SurgoNotif[];
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const slideY = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 11 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: -40, duration: 180, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,  duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }}
        onPress={onClose}
      >
        {/* Panel — stops press from going to backdrop */}
        <Pressable onPress={() => {}}>
          <Animated.View
            style={{
              marginTop: 100,
              marginHorizontal: 16,
              backgroundColor: theme.colors.background,
              borderRadius: 24,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 24,
              elevation: 12,
              opacity,
              transform: [{ translateY: slideY }],
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 18,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              <View>
                <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800' }}>
                  Surgo Updates
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 1 }}>
                  {notifs.filter(n => !n.isRead).length} new
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <View
                  style={{
                    width: 30, height: 30, borderRadius: 15,
                    backgroundColor: theme.colors.surfaceAlt,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: theme.colors.textMuted, fontSize: 15, fontWeight: '600', lineHeight: 18 }}>×</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* List */}
            <ScrollView
              style={{ maxHeight: 440 }}
              contentContainerStyle={{ padding: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {notifs.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ fontSize: 32, marginBottom: 10 }}>🔔</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>No notifications yet</Text>
                </View>
              ) : (
                notifs.map((n) => <NotifRow key={n.id} notif={n} />)
              )}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
