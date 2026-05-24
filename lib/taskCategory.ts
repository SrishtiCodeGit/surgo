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
    color: '#16A34A',
    bg:    '#16A34A14',
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
    color: '#7C3AED',
    bg:    '#7C3AED12',
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
    color: '#D97706',
    bg:    '#D9770612',
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
    color: '#0891B2',
    bg:    '#0891B212',
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
    color: '#DB2777',
    bg:    '#DB277712',
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
    color: '#2563EB',
    bg:    '#2563EB12',
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
    color: '#DC2626',
    bg:    '#DC262612',
    keywords: [
      'doctor', 'dentist', 'appointment', 'medicine', 'medication', 'pill',
      'supplement', 'vitamin', 'vaccine', 'checkup', 'hospital', 'clinic',
      'prescription', 'health', 'blood', 'weight', 'bmi',
    ],
  },
  {
    label: 'Finance',
    emoji: '💰',
    color: '#059669',
    bg:    '#05966912',
    keywords: [
      'budget', 'money', 'finance', 'savings', 'save', 'invest', 'investment',
      'bank', 'pay', 'bill', 'rent', 'insurance', 'tax', 'expense',
      'spending', 'account', 'transfer', 'loan', 'debt',
    ],
  },
];

const DEFAULT: TaskCategory = {
  color: '#6366F1',
  bg:    '#6366F112',
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
