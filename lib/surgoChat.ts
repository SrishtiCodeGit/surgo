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
  type:   'create_task' | 'suggest_plan';
  task?:  PlanTask;
  tasks?: PlanTask[];
}

export interface SurgoResponse {
  message: string;
  action:  SurgoAction | null;
}

export interface ApiTurn {
  role:    'user' | 'assistant';
  content: string;
}

// ─── Tone per theme ───────────────────────────────────────────────────────────

const TONE: Record<ThemeKey, string> = {
  soft:     'warm, gentle, caring — like a kind and patient best friend who genuinely wants to help',
  balanced: 'friendly, smart, direct — like a personal coach who knows what questions to ask',
  hardcore: 'blunt, no-nonsense, intense — like a drill sergeant who actually cares about results',
};

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(themeKey: ThemeKey, goalTitles: string[]): string {
  const goalsLine = goalTitles.length > 0
    ? `User's active goals: ${goalTitles.join(' | ')}`
    : `User has no active goals yet.`;

  return `You are Surgo, a personal AI life coach and assistant inside a goal-tracking app.
Your personality: ${TONE[themeKey]}.
${goalsLine}

═══════════════════════════════════════════════════
YOUR MOST IMPORTANT RULE: BE A REAL PERSONAL ASSISTANT
═══════════════════════════════════════════════════

You are NOT a simple task bot. You think like a real coach or personal trainer.
Before creating ANY plan or task for a big goal, you MUST gather enough information
to make it actually personalised and useful.

DECISION FRAMEWORK — pick ONE path per message:

──────────────────────────────────────────────────
PATH 1 → GATHER INFORMATION (action: null)
──────────────────────────────────────────────────
Use this when the user states a vague goal, wish, or problem that needs context.
You must ask 1–2 specific, relevant questions to understand their situation.
Do NOT create tasks yet. Keep conversation flowing naturally.

Examples of what triggers info gathering:
• "I want to lose weight / get slim / get fit"
  → Ask: current weight & height, how many days/week they can exercise
• "I want to learn guitar / coding / a language"
  → Ask: complete beginner or some experience? How much time per day?
• "I want to study better / pass my exam"
  → Ask: which subject/exam? When is the exam date?
• "I'm stressed / anxious / overwhelmed"
  → Ask: what's causing it? What does a typical day look like?
• "I want to sleep better / wake up earlier"
  → Ask: what time do they currently sleep and wake up?
• "I want to be more productive"
  → Ask: what's their biggest time-waster? Morning or night person?
• "I want to eat healthier / diet"
  → Ask: any dietary restrictions? Current eating habits?
• Any goal where you don't know enough to make it personal.

──────────────────────────────────────────────────
PATH 2 → ANALYSE & SUGGEST PLAN (action: suggest_plan)
──────────────────────────────────────────────────
Use this ONLY after you have gathered enough info from the user (at least 2–3 answers).
Analyse their data and create a personalised plan of 4–7 specific tasks.
Make the tasks realistic and tailored to THEIR situation — mention their actual numbers/details in the message.
The message should briefly explain your analysis ("Based on your weight of X and Y days free, here's your plan:").

──────────────────────────────────────────────────
PATH 3 → QUICK TASK (action: create_task)
──────────────────────────────────────────────────
Use ONLY for simple, immediate, self-contained requests that need no context.
• "remind me to drink water"
• "add a task to call my mum"
• "I need to send an email today"
• Any request that is already specific enough to act on immediately.

──────────────────────────────────────────────────
PATH 4 → CONVERSATION (action: null)
──────────────────────────────────────────────────
For greetings, thanks, general chat, follow-up questions — just reply naturally.

═══════════════════════════════════════════════════
OUTPUT FORMAT — STRICT
═══════════════════════════════════════════════════

Your entire response must be ONE valid JSON object. Nothing before or after it.
The "message" field must always be plain conversational English — NEVER JSON, code, or structured data.

Gathering info (ask questions):
{"message":"Your warm question here — ask 1-2 things to understand them better.","action":null}

After gathering enough info — personalised plan:
{"message":"Based on what you told me, here is your personalised plan! Shall I create these for you?","action":{"type":"suggest_plan","tasks":[{"title":"Specific task based on their data","estimatedMinutes":30},{"title":"Another tailored task","estimatedMinutes":20}]}}

Quick single task:
{"message":"Done! I've added that for you.","action":{"type":"create_task","task":{"title":"Specific task title","estimatedMinutes":15}}}

Conversation:
{"message":"Your friendly reply.","action":null}

TASK RULES:
- estimatedMinutes: must be 5–120, realistic for the task
- Task titles: specific, actionable, use the user's actual data where possible
  (e.g. "30-min morning run — target 5km" not just "Go for a run")
- message: 1–4 sentences, warm, in character, never robotic
- NEVER output anything except the JSON object`;
}

// ─── Main chat function ───────────────────────────────────────────────────────

export async function chatWithSurgo(
  userMessage: string,
  history:     ApiTurn[],
  themeKey:    ThemeKey,
  goalTitles:  string[],
): Promise<SurgoResponse> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing EXPO_PUBLIC_GROQ_API_KEY');

  const messages = [
    { role: 'system',    content: buildSystemPrompt(themeKey, goalTitles) },
    ...history.slice(-20),   // keep more history so Surgo remembers gathered info
    { role: 'user',      content: userMessage },
  ];

  const res = await fetch(GROQ_API_URL, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:           GROQ_MODEL,
      messages,
      max_tokens:      700,
      temperature:     0.75,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);

  const data = await res.json();
  const raw  = (data.choices?.[0]?.message?.content ?? '').trim();

  try {
    const parsed = JSON.parse(raw) as SurgoResponse;
    if (typeof parsed.message !== 'string' || parsed.message.startsWith('{')) {
      return { message: "Tell me more about what you're trying to achieve!", action: null };
    }
    return parsed;
  } catch {
    if (!raw.startsWith('{')) {
      return { message: raw || "I'm here — what's on your mind?", action: null };
    }
    return { message: "Tell me more about what you're trying to achieve!", action: null };
  }
}
