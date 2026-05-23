import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useGoalStore } from '@/stores/goalStore';
import { useDietStore, MealType, MealSuggestion } from '@/stores/dietStore';
import { useSurgoMemoryStore } from '@/stores/surgoMemoryStore';
import { WelcomeMascot } from '@/components/ui/WelcomeMascot';
import { getDietPlan } from '@/lib/surgoChat';
import { toDateString } from '@/lib/streak';

// ─── Design tokens ────────────────────────────────────────────────────────────

const D = {
  dark:       '#1C1C1E',
  muted:      '#999999',
  mutedLight: '#C8C8C8',
  cardBg:     '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.07)',
  inputBg:    '#F7F7F7',
  inputBorder:'rgba(0,0,0,0.10)',
};

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_META: Record<MealType, { label: string; icon: string; time: string }> = {
  breakfast: { label: 'Breakfast', icon: '🌅', time: '7–9 am'  },
  lunch:     { label: 'Lunch',     icon: '☀️', time: '12–2 pm' },
  dinner:    { label: 'Dinner',    icon: '🌙', time: '6–8 pm'  },
  snack:     { label: 'Snack',     icon: '🍎', time: 'Any time' },
};

// ─── Macro bar ────────────────────────────────────────────────────────────────

function MacroBar({
  label, value, max, color,
}: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(value / Math.max(max, 1), 1);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ color: D.muted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {label}
        </Text>
        <Text style={{ color: D.dark, fontSize: 11, fontWeight: '700' }}>{value}g</Text>
      </View>
      <View style={{ height: 4, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: 4, backgroundColor: color, borderRadius: 2 }} />
      </View>
    </View>
  );
}

// ─── Surgo plan suggestion card ───────────────────────────────────────────────

function SuggestionCard({
  meal, themeKey, theme,
}: { meal: MealSuggestion; themeKey: string; theme: any }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: D.cardBorder,
    }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2F2F2',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <WelcomeMascot themeKey={themeKey as any} size={30} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: D.dark, fontWeight: '700', fontSize: 13.5 }}>{meal.name}</Text>
        <Text style={{ color: D.muted, fontSize: 12, marginTop: 2, lineHeight: 17 }}>{meal.description}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 5 }}>
          <Text style={{ color: D.muted, fontSize: 11 }}>
            <Text style={{ color: D.dark, fontWeight: '600' }}>{meal.calories}</Text> kcal
          </Text>
          <Text style={{ color: D.muted, fontSize: 11 }}>
            P <Text style={{ color: D.dark, fontWeight: '600' }}>{meal.protein}g</Text>
          </Text>
          <Text style={{ color: D.muted, fontSize: 11 }}>
            C <Text style={{ color: D.dark, fontWeight: '600' }}>{meal.carbs}g</Text>
          </Text>
          <Text style={{ color: D.muted, fontSize: 11 }}>
            F <Text style={{ color: D.dark, fontWeight: '600' }}>{meal.fat}g</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Add meal inline form ─────────────────────────────────────────────────────

function AddMealForm({
  onAdd, onCancel, theme,
}: {
  onAdd: (name: string, cal: number, p: number, c: number, f: number) => void;
  onCancel: () => void;
  theme: any;
}) {
  const [name, setName]     = useState('');
  const [cal,  setCal]      = useState('');
  const [prot, setProt]     = useState('');
  const [carbs, setCarbs]   = useState('');
  const [fat,  setFat]      = useState('');

  const submit = () => {
    if (!name.trim() || !cal.trim()) {
      Alert.alert('Missing info', 'Please enter at least a name and calories.');
      return;
    }
    onAdd(
      name.trim(),
      parseInt(cal) || 0,
      parseInt(prot) || 0,
      parseInt(carbs) || 0,
      parseInt(fat) || 0,
    );
  };

  return (
    <View style={{
      marginTop: 8,
      backgroundColor: D.inputBg,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: D.cardBorder,
    }}>
      <TextInput
        placeholder="Food name"
        placeholderTextColor={D.mutedLight}
        value={name}
        onChangeText={setName}
        style={{
          color: D.dark, fontSize: 14, fontWeight: '500',
          borderBottomWidth: 1, borderBottomColor: D.cardBorder,
          paddingBottom: 10, marginBottom: 10,
        }}
      />
      {/* Macros row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Calories', val: cal,   set: setCal,   suffix: 'kcal' },
          { label: 'Protein',  val: prot,  set: setProt,  suffix: 'g'    },
          { label: 'Carbs',    val: carbs, set: setCarbs, suffix: 'g'    },
          { label: 'Fat',      val: fat,   set: setFat,   suffix: 'g'    },
        ].map(f => (
          <View key={f.label} style={{ flex: 1 }}>
            <Text style={{ color: D.muted, fontSize: 10, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>
              {f.label}
            </Text>
            <TextInput
              placeholder="0"
              placeholderTextColor={D.mutedLight}
              keyboardType="number-pad"
              value={f.val}
              onChangeText={f.set}
              style={{
                color: D.dark, fontSize: 14, fontWeight: '600',
                backgroundColor: '#fff',
                borderRadius: 8, borderWidth: 1, borderColor: D.inputBorder,
                paddingHorizontal: 8, paddingVertical: 6, textAlign: 'center',
              }}
            />
          </View>
        ))}
      </View>

      {/* Buttons */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={onCancel}
          style={{
            flex: 1, paddingVertical: 10, borderRadius: 10,
            backgroundColor: 'rgba(0,0,0,0.05)',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: D.muted, fontWeight: '600', fontSize: 13 }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={submit}
          style={{
            flex: 2, paddingVertical: 10, borderRadius: 10,
            backgroundColor: D.dark, alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Add Food</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DietScreen() {
  const { theme, themeKey } = useTheme();
  const { goals, isLoaded: goalsLoaded, load: loadGoals } = useGoalStore();
  const { getFactsText } = useSurgoMemoryStore();
  const {
    isLoaded, load, planCache,
    addEntry, removeEntry, setDietPlan,
    getTodaysTotals, getTodayByMeal,
  } = useDietStore();

  const [planLoading, setPlanLoading]  = useState(false);
  const [planExpanded, setPlanExpanded] = useState(true);
  const [addingFor, setAddingFor]      = useState<MealType | null>(null);

  useEffect(() => { if (!isLoaded)     load(); },      []);
  useEffect(() => { if (!goalsLoaded) loadGoals(); }, []);

  const todayStr    = toDateString(new Date());
  const goalTitles  = goals.filter(g => g.isActive).map(g => g.title);
  const totals      = getTodaysTotals();
  const calorieTarget = planCache?.calorieTarget ?? 1800;
  const caloriePct    = Math.min(totals.calories / calorieTarget, 1);

  // Load Surgo's plan for today (once per day)
  useEffect(() => {
    if (!isLoaded || !goalsLoaded) return;
    if (planCache?.date === todayStr) return; // already have today's plan
    fetchPlan();
  }, [isLoaded, goalsLoaded]);

  const fetchPlan = async () => {
    setPlanLoading(true);
    try {
      const plan = await getDietPlan(goalTitles, getFactsText(), themeKey, todayStr);
      setDietPlan(plan);
    } catch (e) {
      // silently fail — user still sees the rest of the screen
    } finally {
      setPlanLoading(false);
    }
  };

  const handleAddEntry = (
    mealType: MealType,
    name: string, cal: number, protein: number, carbs: number, fat: number,
  ) => {
    addEntry({ date: todayStr, mealType, name, calories: cal, protein, carbs, fat });
    setAddingFor(null);
  };

  const now   = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Header ──────────────────────────────────────────────────── */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: D.dark, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
              Diet
            </Text>
            <Text style={{ color: D.muted, fontSize: 12, marginTop: 3, fontWeight: '500' }}>
              {dateLabel}
            </Text>
          </View>

          {/* ── Calorie summary card ─────────────────────────────────────── */}
          <View style={{
            backgroundColor: D.cardBg,
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1, borderColor: D.cardBorder,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
          }}>
            {/* Calorie numbers */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
              <Text style={{ color: D.dark, fontSize: 38, fontWeight: '800', letterSpacing: -1 }}>
                {totals.calories.toLocaleString()}
              </Text>
              <Text style={{ color: D.muted, fontSize: 15, fontWeight: '500', marginBottom: 4 }}>
                / {calorieTarget.toLocaleString()} kcal
              </Text>
            </View>

            {/* Calorie progress bar */}
            <View style={{ height: 8, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 4, marginBottom: 4, overflow: 'hidden' }}>
              <View style={{
                width: `${caloriePct * 100}%`,
                height: 8, borderRadius: 4,
                backgroundColor: caloriePct >= 1 ? '#E53935' : theme.colors.primary,
              }} />
            </View>
            <Text style={{ color: D.muted, fontSize: 11, marginBottom: 18 }}>
              {Math.round(caloriePct * 100)}% of daily goal
              {caloriePct >= 1 && '  ·  Goal reached!'}
            </Text>

            {/* Macros */}
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <MacroBar label="Protein" value={totals.protein} max={Math.round(calorieTarget * 0.025)} color="#4CAF50" />
              <MacroBar label="Carbs"   value={totals.carbs}   max={Math.round(calorieTarget * 0.055)} color={theme.colors.primary} />
              <MacroBar label="Fat"     value={totals.fat}     max={Math.round(calorieTarget * 0.028)} color="#FF9800" />
            </View>
          </View>

          {/* ── Surgo's plan card ────────────────────────────────────────── */}
          <View style={{
            backgroundColor: D.cardBg,
            borderRadius: 20,
            marginBottom: 16,
            borderWidth: 1, borderColor: D.cardBorder,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
            overflow: 'hidden',
          }}>
            {/* Card header */}
            <TouchableOpacity
              onPress={() => setPlanExpanded(e => !e)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 18, paddingVertical: 14, gap: 10,
              }}
            >
              <View style={{ width: 32, height: 32 }}>
                <WelcomeMascot themeKey={themeKey} size={32} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: D.dark, fontWeight: '700', fontSize: 14 }}>
                  Surgo's Plan for Today
                </Text>
                {planCache?.tip && !planExpanded && (
                  <Text style={{ color: D.muted, fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                    {planCache.tip}
                  </Text>
                )}
              </View>
              {planLoading ? (
                <ActivityIndicator size="small" color={D.muted} />
              ) : (
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d={planExpanded ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}
                    stroke={D.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />
                </Svg>
              )}
            </TouchableOpacity>

            {planExpanded && (
              <View style={{ paddingHorizontal: 18, paddingBottom: 14 }}>
                {planLoading ? (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <ActivityIndicator size="small" color={D.muted} />
                    <Text style={{ color: D.muted, fontSize: 12, marginTop: 8 }}>
                      Surgo is building your plan…
                    </Text>
                  </View>
                ) : planCache ? (
                  <>
                    {/* Tip */}
                    {planCache.tip && (
                      <View style={{
                        backgroundColor: '#F7F7F7', borderRadius: 10,
                        paddingHorizontal: 12, paddingVertical: 9, marginBottom: 12,
                      }}>
                        <Text style={{ color: '#555', fontSize: 12.5, fontStyle: 'italic', lineHeight: 18 }}>
                          "{planCache.tip}"
                        </Text>
                      </View>
                    )}
                    {MEAL_ORDER.map(m => (
                      <SuggestionCard
                        key={m}
                        meal={planCache[m]}
                        themeKey={themeKey}
                        theme={theme}
                      />
                    ))}
                  </>
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Text style={{ color: D.muted, fontSize: 13, textAlign: 'center' }}>
                      Couldn't load plan. Check your internet.
                    </Text>
                    <TouchableOpacity
                      onPress={fetchPlan}
                      style={{
                        marginTop: 10, paddingHorizontal: 18, paddingVertical: 8,
                        backgroundColor: D.dark, borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ── Meal log sections ────────────────────────────────────────── */}
          {MEAL_ORDER.map(mealType => {
            const meta    = MEAL_META[mealType];
            const entries = getTodayByMeal(mealType);
            const total   = entries.reduce((sum, e) => sum + e.calories, 0);
            const isAdding = addingFor === mealType;

            return (
              <View
                key={mealType}
                style={{
                  backgroundColor: D.cardBg,
                  borderRadius: 18,
                  marginBottom: 12,
                  borderWidth: 1, borderColor: D.cardBorder,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
                  overflow: 'hidden',
                }}
              >
                {/* Section header */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 16, paddingVertical: 12,
                  borderBottomWidth: entries.length > 0 || isAdding ? 1 : 0,
                  borderBottomColor: D.cardBorder,
                }}>
                  <Text style={{ fontSize: 18, marginRight: 8 }}>{meta.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: D.dark, fontWeight: '700', fontSize: 14 }}>{meta.label}</Text>
                    <Text style={{ color: D.muted, fontSize: 11, marginTop: 1 }}>{meta.time}</Text>
                  </View>
                  {total > 0 && (
                    <Text style={{ color: D.dark, fontWeight: '700', fontSize: 13, marginRight: 12 }}>
                      {total} kcal
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => setAddingFor(isAdding ? null : mealType)}
                    activeOpacity={0.7}
                    style={{
                      width: 30, height: 30, borderRadius: 15,
                      backgroundColor: isAdding ? 'rgba(0,0,0,0.07)' : D.dark,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path
                        d={isAdding ? "M18 6L6 18M6 6l12 12" : "M12 5v14M5 12h14"}
                        stroke="#fff" strokeWidth="2.2"
                        strokeLinecap="round" strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>

                {/* Logged entries */}
                {entries.map(entry => (
                  <View
                    key={entry.id}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 10,
                      borderBottomWidth: 1, borderBottomColor: D.cardBorder,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: D.dark, fontSize: 13.5, fontWeight: '500' }}>{entry.name}</Text>
                      <Text style={{ color: D.muted, fontSize: 11, marginTop: 2 }}>
                        {entry.calories} kcal
                        {entry.protein > 0 && `  ·  P ${entry.protein}g`}
                        {entry.carbs > 0   && `  ·  C ${entry.carbs}g`}
                        {entry.fat > 0     && `  ·  F ${entry.fat}g`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeEntry(entry.id)}
                      activeOpacity={0.7}
                      style={{ padding: 6 }}
                    >
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Path d="M18 6L6 18M6 6l12 12" stroke={D.mutedLight} strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add form */}
                {isAdding && (
                  <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                    <AddMealForm
                      onAdd={(name, cal, p, c, f) => handleAddEntry(mealType, name, cal, p, c, f)}
                      onCancel={() => setAddingFor(null)}
                      theme={theme}
                    />
                  </View>
                )}

                {/* Empty state */}
                {entries.length === 0 && !isAdding && (
                  <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                    <Text style={{ color: D.mutedLight, fontSize: 12.5 }}>
                      Nothing logged yet — tap + to add food
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
