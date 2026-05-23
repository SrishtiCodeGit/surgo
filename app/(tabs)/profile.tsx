import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, Image, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/context/ThemeContext';
import { useProfileStore } from '@/stores/profileStore';
import { themes, themeKeys } from '@/lib/theme';
import { ThemeKey } from '@/types';
import { AnimatedSplash } from '@/components/ui/AnimatedSplash';
import { HardcoreAnimatedSplash } from '@/components/ui/HardcoreAnimatedSplash';
import { BalancedAnimatedSplash } from '@/components/ui/BalancedAnimatedSplash';
import { MascotFaceIcon } from '@/components/ui/MascotFaceIcon';

const SETTINGS_ROWS = [
  { label: 'Notification Time', value: '9:00 AM' },
  { label: 'About Surgo',       value: 'v1.0'   },
];

// ─── Inline editable field ────────────────────────────────────────────────────

function Field({
  label, value, placeholder, onSave, keyboardType = 'default', multiline = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onSave: (v: string) => void;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  multiline?: boolean;
}) {
  const { theme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => { setEditing(false); onSave(draft.trim()); };

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </Text>
      {editing ? (
        <TextInput
          autoFocus
          value={draft}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType={keyboardType}
          multiline={multiline}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          style={{
            color: theme.colors.text,
            fontSize: 15,
            fontWeight: '600',
            paddingVertical: 0,
            minHeight: multiline ? 56 : undefined,
          }}
        />
      ) : (
        <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.7}>
          <Text style={{
            color: value ? theme.colors.text : theme.colors.textMuted,
            fontSize: 15,
            fontWeight: value ? '600' : '400',
            fontStyle: value ? 'normal' : 'italic',
          }}>
            {value || placeholder}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const { theme, themeKey, setTheme } = useTheme();
  const { profile, isLoaded, load, save } = useProfileStore();

  const [showSoftSplash,     setShowSoftSplash]     = useState(false);
  const [showHardcoreSplash, setShowHardcoreSplash] = useState(false);
  const [showBalancedSplash, setShowBalancedSplash] = useState(false);

  useEffect(() => { if (!isLoaded) load(); }, []);

  const handleThemeSelect = (key: ThemeKey) => {
    if (key === 'soft')     setShowSoftSplash(true);
    if (key === 'hardcore') setShowHardcoreSplash(true);
    if (key === 'balanced') setShowBalancedSplash(true);
    setTheme(key);
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      save({ photoUri: result.assets[0].uri });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Modal visible={showSoftSplash} animationType="fade" statusBarTranslucent>
        <AnimatedSplash onFinish={() => { setShowSoftSplash(false); router.replace('/(tabs)'); }} />
      </Modal>
      <Modal visible={showHardcoreSplash} animationType="fade" statusBarTranslucent>
        <HardcoreAnimatedSplash onFinish={() => { setShowHardcoreSplash(false); router.replace('/(tabs)'); }} />
      </Modal>
      <Modal visible={showBalancedSplash} animationType="fade" statusBarTranslucent>
        <BalancedAnimatedSplash onFinish={() => { setShowBalancedSplash(false); router.replace('/(tabs)'); }} />
      </Modal>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 56 }}>

        {/* ── Header: back arrow + title ────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          {/* Back arrow → Today */}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: theme.colors.surfaceAlt,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke={theme.colors.text}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <View>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: 28,
                fontWeight: '900',
                letterSpacing: -0.8,
              }}
            >
              Profile
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 2 }}>
              Your Surgo identity
            </Text>
          </View>
        </View>

        {/* ── Active theme hero ─────────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: 22,
            padding: 20,
            marginBottom: 14,
            overflow: 'hidden',
          }}
        >
          {/* Label */}
          <Text
            style={{
              color: theme.colors.textInverse,
              fontSize: 10,
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: 2.5,
              opacity: 0.65,
              marginBottom: 14,
            }}
          >
            Active mode
          </Text>

          {/* Mascot + name */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <View style={{ width: 54, height: 54, borderRadius: 27, overflow: 'hidden' }}>
              <MascotFaceIcon variant={themeKey} size={54} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.colors.textInverse,
                  fontSize: 24,
                  fontWeight: '900',
                  letterSpacing: -0.5,
                }}
              >
                {theme.name}
              </Text>
              <Text
                style={{
                  color: theme.colors.textInverse,
                  opacity: 0.70,
                  fontSize: 13,
                  marginTop: 2,
                  fontWeight: '500',
                }}
              >
                {theme.tagline}
              </Text>
            </View>
          </View>

          {/* Colour swatches */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[theme.colors.accent, theme.colors.success, theme.colors.warning, theme.colors.streakFire].map((c, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: c,
                  opacity: 0.80,
                }}
              />
            ))}
          </View>
        </View>

        {/* ── Section label ─────────────────────────────────────────────────── */}
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: 10,
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: 2.5,
            marginBottom: 12,
            marginTop: 18,
          }}
        >
          Switch mode
        </Text>

        {/* ── Theme cards ───────────────────────────────────────────────────── */}
        <View style={{ gap: 10, marginBottom: 36 }}>
          {themeKeys.map((key) => {
            const t = themes[key];
            if (themeKey === key) return null;

            return (
              <TouchableOpacity
                key={key}
                onPress={() => handleThemeSelect(key as ThemeKey)}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  borderRadius: 18,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                }}
                activeOpacity={0.72}
              >
                {/* Mascot face */}
                <View style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden' }}>
                  <MascotFaceIcon variant={key as ThemeKey} size={48} />
                </View>

                {/* Name + tagline */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontSize: 16,
                      fontWeight: '800',
                      letterSpacing: -0.2,
                      marginBottom: 3,
                    }}
                  >
                    {t.name}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '500' }}>
                    {t.tagline}
                  </Text>
                </View>

                {/* Colour dots only — no arrow button */}
                <View style={{ gap: 5 }}>
                  {[t.colors.primary, t.colors.accent, t.colors.success].map((c, i) => (
                    <View
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 3.5,
                        backgroundColor: c,
                      }}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Personal details ──────────────────────────────────────────────── */}
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: 10,
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: 2.5,
            marginBottom: 12,
          }}
        >
          Your Details
        </Text>

        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: 32,
            overflow: 'hidden',
          }}
        >
          {/* Avatar row */}
          <TouchableOpacity
            onPress={pickPhoto}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            {/* Avatar circle */}
            <View
              style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: theme.colors.primaryLight,
                borderWidth: 2,
                borderColor: theme.colors.primary + '40',
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {profile.photoUri ? (
                <Image source={{ uri: profile.photoUri }} style={{ width: 64, height: 64 }} />
              ) : (
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="8" r="4" stroke={theme.colors.primary} strokeWidth="1.8" />
                  <Path d="M4 20 C4 16.13 7.58 13 12 13 C16.42 13 20 16.13 20 20"
                    stroke={theme.colors.primary} strokeWidth="1.8" strokeLinecap="round" />
                </Svg>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '700' }}>
                {profile.photoUri ? 'Change photo' : 'Add profile photo'}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                Tap to choose from library
              </Text>
            </View>

            {/* Camera icon */}
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                  stroke={theme.colors.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <Circle cx="12" cy="13" r="4" stroke={theme.colors.textMuted} strokeWidth="1.8" />
              </Svg>
            </View>
          </TouchableOpacity>

          {/* Editable fields */}
          <Field label="Full Name"     value={profile.name}      placeholder="e.g. Alex Johnson"      onSave={v => save({ name: v })} />
          <Field label="Surgo Name"    value={profile.surgoName} placeholder="Your Surgo nickname"    onSave={v => save({ surgoName: v })} />
          <Field label="Age"           value={profile.age}       placeholder="e.g. 24"               onSave={v => save({ age: v })}       keyboardType="numeric" />
          <Field label="Email"         value={profile.email}     placeholder="you@example.com"        onSave={v => save({ email: v })}     keyboardType="email-address" />
          <View style={{ borderBottomWidth: 0 }}>
            <Field label="Bio / Goals"   value={profile.bio}       placeholder="What drives you…"      onSave={v => save({ bio: v })}       multiline />
          </View>
        </View>

        {/* ── Settings ──────────────────────────────────────────────────────── */}
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: 10,
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: 2.5,
            marginBottom: 12,
          }}
        >
          Settings
        </Text>

        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 18,
            borderColor: theme.colors.border,
            borderWidth: 1,
            overflow: 'hidden',
          }}
        >
          {SETTINGS_ROWS.map((row, i) => (
            <TouchableOpacity
              key={row.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 18,
                paddingVertical: 16,
                borderBottomWidth: i < SETTINGS_ROWS.length - 1 ? 1 : 0,
                borderBottomColor: theme.colors.border,
              }}
              activeOpacity={0.65}
            >
              <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '600', flex: 1 }}>
                {row.label}
              </Text>
              {row.value ? (
                <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginRight: 8 }}>
                  {row.value}
                </Text>
              ) : null}
              <Text style={{ color: theme.colors.textMuted, fontSize: 20, lineHeight: 20 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text
            style={{
              color: theme.colors.primary,
              fontSize: 12,
              fontWeight: '900',
              letterSpacing: 5,
            }}
          >
            SURGO
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 5, letterSpacing: 0.5 }}>
            Rise every day
          </Text>
        </View>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
