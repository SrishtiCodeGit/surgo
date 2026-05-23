import { ThemeKey } from '@/types';

const GROQ_API_URL  = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_WHISPER  = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_MODEL    = 'llama-3.3-70b-versatile';
const WHISPER_MODEL = 'whisper-large-v3-turbo';

// ─── Speech → Text via Groq Whisper ──────────────────────────────────────────

export async function transcribeAudio(audioUri: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing EXPO_PUBLIC_GROQ_API_KEY');

  const formData = new FormData();
  formData.append('file', {
    uri:  audioUri,
    type: 'audio/m4a',
    name: 'surgo_voice.m4a',
  } as any);
  formData.append('model',           WHISPER_MODEL);
  formData.append('language',        'en');
  formData.append('response_format', 'json');

  const res = await fetch(GROQ_WHISPER, {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body:    formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.text ?? '').trim();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanTask {
  title:            string;
  estimatedMinutes: number;
}

export interface SurgoAction {
  type:  'create_task' | 'suggest_plan';
  task?: PlanTask;           // single quick task (auto-created)
  tasks?: PlanTask[];        // multi-task plan (needs confirmation)
}

export interface SurgoResponse {
  message: string;
  action:  SurgoAction | null;
}

export interface ApiTurn {
  role:    'user' | 'assistant';
  content: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

const TONE: Record<ThemeKey, string> = {
  soft:     'warm, gentle, encouraging — like a kind best friend',
  balanced: 'friendly, direct, motivating — like a smart mentor',
  hardcore: 'blunt, intense, zero-nonsense — like a drill sergeant who actually cares',
};

export async function chatWithSurgo(
  userMessage: string,
  history:     ApiTurn[],
  themeKey:    ThemeKey,
  goalTitles:  string[],
): Promise<SurgoResponse> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing EXPO_PUBLIC_GROQ_API_KEY');

  const goalsLine = goalTitles.length > 0
    ? `User's active goals: ${goalTitles.join(' | ')}`
    : `User has no goals yet — encourage them to add one in the Goals tab.`;

  const system = `You are Surgo, a personal AI life coach inside a goal-tracking app.
Your personality: ${TONE[themeKey]}.
${goalsLine}

RULES — follow exactly, no exceptions:
1. Always reply in PLAIN conversational English in the "message" field. NEVER put JSON, code blocks, or raw data in the message.
2. Your entire response must be ONE valid JSON object — no text before or after it, no markdown fences.
3. Choose the right action:

   A) SIMPLE / QUICK request (single thing to do right now):
      Use "create_task". It auto-creates the task immediately.
      Example triggers: "remind me to X", "add a task to Y", "I need to Z today"

   B) GOAL / PLAN request (bigger goal, multi-step, "how do I achieve X"):
      Use "suggest_plan" with 3–6 tasks that break the goal into steps.
      Ask the user if they want to create the plan.
      Example triggers: "help me learn guitar", "I want to get fit", "how do I study for exams"

   C) CONVERSATION (question, chat, no task needed):
      Set action to null.

Response format — ONLY output this JSON, nothing else:

For a quick task:
{"message":"Your friendly reply here.","action":{"type":"create_task","task":{"title":"Task title","estimatedMinutes":30}}}

For a plan:
{"message":"Here's a plan for you! Want me to create these tasks?","action":{"type":"suggest_plan","tasks":[{"title":"Step 1 title","estimatedMinutes":20},{"title":"Step 2 title","estimatedMinutes":30}]}}

For conversation only:
{"message":"Your friendly reply here.","action":null}

Rules for tasks:
- estimatedMinutes must be 5–120
- Task titles must be specific and actionable
- message must be 1–3 sentences, warm and in character
- NEVER output anything except the JSON object`;

  const messages = [
    { role: 'system', content: system },
    ...history.slice(-12),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch(GROQ_API_URL, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      messages,
      max_tokens:  600,
      temperature: 0.7,
      // Force JSON output
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);

  const data = await res.json();
  const raw  = (data.choices?.[0]?.message?.content ?? '').trim();

  try {
    const parsed = JSON.parse(raw) as SurgoResponse;
    // Sanity-check: message must be a plain string
    if (typeof parsed.message !== 'string' || parsed.message.startsWith('{')) {
      return { message: "I'm here — what do you need to get done?", action: null };
    }
    return parsed;
  } catch {
    // Last resort: return raw as message if it looks like plain text
    if (!raw.startsWith('{')) {
      return { message: raw || "I'm here — what's on your mind?", action: null };
    }
    return { message: "I'm here — what do you need to get done?", action: null };
  }
}
