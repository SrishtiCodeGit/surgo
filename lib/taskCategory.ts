// Keyword-based task categoriser.
// Returns a colour + label + emoji for any task title.

export interface TaskCategory {
  color:   string;
  bg:      string;   // very subtle tint (color + low opacity)
  label:   string;
  emoji:   string;
}

const CATEGORIES: Array<{
  label:    string;
  emoji:    string;
  color:    string;
  bg:       string;
  keywords: string[];
}> = [
  {
    label: 'Fitness',
    emoji: '🏃',
    color: '#34D399',   // emerald-400 — fresh, energetic
    bg:    '#34D39914',
    keywords: [
      'run', 'running', 'jog', 'walk', 'hike', 'gym', 'workout', 'exercise',
      'swim', 'cycle', 'cycling', 'bike', 'yoga', 'stretch', 'lift', 'weights',
      'cardio', 'plank', 'squat', 'pushup', 'pullup', 'sport', 'training',
      'steps', 'km', 'mile', 'marathon', 'crossfit', 'pilates', 'zumba',
    ],
  },
  {
    label: 'Study',
    emoji: '📚',
    color: '#A78BFA',   // violet-400 — calm, focused
    bg:    '#A78BFA14',
    keywords: [
      'study', 'studying', 'read', 'reading', 'learn', 'learning', 'revise',
      'revision', 'exam', 'test', 'quiz', 'class', 'lecture', 'course',
      'homework', 'assignment', 'essay', 'notes', 'chapter', 'textbook',
      'practice', 'math', 'maths', 'science', 'history', 'english', 'language',
      'coding', 'code', 'programming', 'research', 'thesis', 'dissertation',
    ],
  },
  {
    label: 'Diet',
    emoji: '🥗',
    color: '#FBBF24',   // amber-400 — warm, food
    bg:    '#FBBF2414',
    keywords: [
      'eat', 'eating', 'meal', 'breakfast', 'lunch', 'dinner', 'snack',
      'diet', 'food', 'cook', 'cooking', 'recipe', 'calories', 'calorie',
      'protein', 'carbs', 'fat', 'vegetable', 'fruit', 'salad', 'smoothie',
      'water', 'drink', 'hydrate', 'fast', 'fasting', 'intermittent',
    ],
  },
  {
    label: 'Wellness',
    emoji: '🧘',
    color: '#22D3EE',   // cyan-400 — calm, water
    bg:    '#22D3EE14',
    keywords: [
      'meditate', 'meditation', 'sleep', 'nap', 'rest', 'relax', 'relaxation',
      'breathe', 'breathing', 'mindful', 'mindfulness', 'journal', 'journaling',
      'gratitude', 'therapy', 'mental', 'stress', 'anxiety', 'calm', 'peace',
      'spa', 'bath', 'self-care', 'self care', 'skincare', 'hygiene',
    ],
  },
  {
    label: 'Social',
    emoji: '💬',
    color: '#F472B6',   // pink-400 — warmth, connection
    bg:    '#F472B614',
    keywords: [
      'call', 'phone', 'text', 'message', 'meet', 'hangout', 'party',
      'friend', 'family', 'mom', 'mum', 'dad', 'sister', 'brother',
      'visit', 'dinner with', 'lunch with', 'coffee with', 'date',
      'birthday', 'celebrate', 'anniversary',
    ],
  },
  {
    label: 'Work',
    emoji: '💼',
    color: '#60A5FA',   // blue-400 — professional, clear
    bg:    '#60A5FA14',
    keywords: [
      'work', 'office', 'meeting', 'email', 'report', 'presentation',
      'project', 'deadline', 'client', 'boss', 'colleague', 'team',
      'budget', 'invoice', 'proposal', 'review', 'interview', 'apply',
      'resume', 'cv', 'job', 'career', 'salary', 'task', 'sprint',
    ],
  },
  {
    label: 'Health',
    emoji: '💊',
    color: '#F87171',   // red-400 — care, medical
    bg:    '#F8717114',
    keywords: [
      'doctor', 'dentist', 'appointment', 'medicine', 'medication', 'pill',
      'supplement', 'vitamin', 'vaccine', 'checkup', 'hospital', 'clinic',
      'prescription', 'health', 'blood', 'weight', 'bmi',
    ],
  },
  {
    label: 'Finance',
    emoji: '💰',
    color: '#4ADE80',   // green-400 — growth, money
    bg:    '#4ADE8014',
    keywords: [
      'budget', 'money', 'finance', 'savings', 'save', 'invest', 'investment',
      'bank', 'pay', 'bill', 'rent', 'insurance', 'tax', 'expense',
      'spending', 'account', 'transfer', 'loan', 'debt',
    ],
  },
];

const DEFAULT: TaskCategory = {
  color: '#818CF8',   // indigo-400 — neutral-warm default
  bg:    '#818CF814',
  label: 'Task',
  emoji: '✦',
};

export function categoriseTask(title: string): TaskCategory {
  const lower = title.toLowerCase();

  for (const cat of CATEGORIES) {
    if (cat.keywords.some(kw => lower.includes(kw))) {
      return { color: cat.color, bg: cat.bg, label: cat.label, emoji: cat.emoji };
    }
  }

  return DEFAULT;
}
