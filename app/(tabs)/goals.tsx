import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';

export default function GoalsScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: theme.colors.text }} className="text-3xl font-bold mb-2">
          Your Goals
        </Text>
        <Text style={{ color: theme.colors.textMuted }} className="text-sm mb-8">
          Every resolution starts here.
        </Text>

        {/* Empty state */}
        <View
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }}
          className="rounded-2xl p-8 items-center"
        >
          <Text className="text-4xl mb-3">{theme.emoji.goal}</Text>
          <Text style={{ color: theme.colors.text }} className="text-lg font-bold mb-2 text-center">
            No goals yet
          </Text>
          <Text style={{ color: theme.colors.textMuted }} className="text-sm text-center mb-6">
            Set your first resolution and let AI break it into daily steps.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: theme.colors.primary }}
            className="px-6 py-3 rounded-xl"
          >
            <Text style={{ color: theme.colors.textInverse }} className="font-bold">
              + Add a Goal
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
