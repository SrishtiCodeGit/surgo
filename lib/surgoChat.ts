import { ThemeKey } from '@/types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

export interface SurgoAction {
  type: 'create_task';
  task: { title: string; estimatedMinutes: number };
}

export interface SurgoResponse {
  message: string;
  action: SurgoAction | null;
}

export interface ApiTurn {
  role: 'user' | 'assistant';
  content: string;
}

const TONE: Record<ThemeKey, string> = {
  soft:     'warm, gentle, encouraging — like a kind best friend',
  balanced: 'friendly, direct, motivating — like a smart mentor',
  hardcore: 'blunt, intense, zero-nonsense — like a drill sergeant who actually cares',
};

export async function chatWithSurgo(
  userMessage: string,
  history: ApiTurn[],
  themeKey: ThemeKey,
  goalTitles: string[],
): Promise<SurgoResponse> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing EXPO_PUBLIC_GROQ_API_KEY');

  const goalsLine = goalTitles.length > 0
    ? `User's active goals: ${goalTitles.join(' | ')}`
    : `User has no goals yet — encourage them to add one.`;

  const system = `You are Surgo, a personal AI life coach and task assistant built into the Surgo goal-tracking app.
Your personality: ${TONE[themeKey]}.
${goalsLine}

You understand natural language. When the user mentions ANYTHING they want to do, should do, plan to do, or need to do — create a task for it automatically. Be proactive.

Examples that should trigger task creation:
- "I need to run tomorrow" → create task "Go for a run"
- "remind me to drink water" → create task "Drink 8 glasses of water"
- "help me study maths" → create task "Study maths"
- "I want to call my mom" → create task "Call mom"

Always respond in ONLY this exact JSON format (no markdown, no explanation outside JSON):
{
  "message": "your conversational reply — 1-3 sentences, stay in character",
  "action": {
    "type": "create_task",
    "task": {
      "title": "specific actionable task title",
      "estimatedMinutes": 30
    }
  }
}

If no task should be created, set action to null:
{
  "message": "your reply",
  "action": null
}

Rules:
- estimatedMinutes must be realistic (5–120)
- Task title should be specific and actionable, not vague
- Keep your message short and punchy — this is a mobile chat
- Never output anything outside the JSON`;

  const messages = [
    { role: 'system', content: system },
    ...history.slice(-10),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: 400, temperature: 0.85 }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);

  const data = await res.json();
  const raw  = (data.choices?.[0]?.message?.content ?? '')
    .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    return JSON.parse(raw) as SurgoResponse;
  } catch {
    return { message: raw || "I'm here — what's on your mind?", action: null };
  }
}
