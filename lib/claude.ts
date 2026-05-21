import { AIGoalBreakdown, ThemeKey } from '@/types';

// ─── Gemini API ───────────────────────────────────────────────────────────────
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const MODEL = 'gemini-1.5-flash';

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY');
  return key;
}

async function callAI(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2048,
): Promise<string> {
  const apiKey = getApiKey();
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        { role: 'user', parts: [{ text: userMessage }] },
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Empty response from Gemini');

  // Strip markdown code fences if Gemini wraps JSON in them
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

// ─── Tone helper ──────────────────────────────────────────────────────────────

function toneLine(pace: ThemeKey): string {
  switch (pace) {
    case 'soft':
      return 'Use a gentle, warm, encouraging tone. Be kind and supportive. No pressure.';
    case 'balanced':
      return 'Use an honest, direct, motivating tone. Acknowledge effort but keep it real.';
    case 'hardcore':
      return 'Use a blunt, zero-excuses, drill-sergeant tone. No sugarcoating. Push hard.';
  }
}

// ─── Task count based on time + theme ────────────────────────────────────────

function tasksPerDay(minutesPerDay: number, pace: ThemeKey): number {
  const base =
    minutesPerDay <= 15 ? 1
    : minutesPerDay <= 30 ? 2
    : minutesPerDay <= 60 ? 3
    : minutesPerDay <= 90 ? 4
    : minutesPerDay <= 120 ? 5
    : 6;

  const multiplier = pace === 'hardcore' ? 1.5 : pace === 'soft' ? 0.8 : 1;
  return Math.max(1, Math.round(base * multiplier));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoalKeyActivity {
  activity: string;
  timePerWeek: string;
  why: string;
  howTo: string;
}

export interface GoalAnalysis {
  overview: string;
  achievabilityNote: string;
  timeBreakdown: string;
  keyActivities: GoalKeyActivity[];
  milestones: Array<{ title: string; targetDate: string }>;
  weekTasks: Array<{ title: string; day: number; estimatedMinutes: number }>;
  todayTask: { title: string; why: string };
}

// ─── MAIN: Deep goal analysis + task generation ───────────────────────────────

export async function analyzeGoal(
  goalTitle: string,
  targetDate: string,
  daysRemaining: number,
  minutesPerDay: number,
  pace: ThemeKey,
): Promise<GoalAnalysis> {

  const dailyTasks = tasksPerDay(minutesPerDay, pace);
  const weeklyMinutes = minutesPerDay * 7;

  const system = `You are a world-class goal coach inside an app called Surgo.
${toneLine(pace)}
You deeply understand what it takes to achieve any type of goal — fitness, career, finance, learning, relationships, and more.
You give specific, actionable, expert-level advice tailored to the user's available time.
You must respond with ONLY valid JSON — no markdown, no explanation, no code fences.`;

  const user = `A user wants to achieve the following goal:

Goal: "${goalTitle}"
Deadline: ${targetDate} (${daysRemaining} days from today)
Time available: ${minutesPerDay} minutes per day (${weeklyMinutes} minutes/week)
Pace/theme: ${pace}

Your job is to give them a COMPLETE coaching plan. Be specific and expert-level — not generic.

Return ONLY this exact JSON structure:

{
  "overview": "2-3 sentence expert assessment of this goal. What does it really take? Is ${daysRemaining} days with ${minutesPerDay} mins/day realistic? Be honest and specific.",

  "achievabilityNote": "One sentence: is this goal achievable in this timeframe with this time commitment? Be direct.",

  "timeBreakdown": "How their ${minutesPerDay} mins/day should be split across activities. Be specific with numbers, e.g. '20 mins cardio + 10 mins stretching'.",

  "keyActivities": [
    {
      "activity": "Specific activity name",
      "timePerWeek": "e.g. 3x per week, 30 mins each",
      "why": "Why this specific activity is essential to achieving the goal",
      "howTo": "Exact beginner-friendly instructions for how to do this activity well"
    }
  ],

  "milestones": [
    { "title": "Specific measurable milestone", "targetDate": "YYYY-MM-DD" }
  ],

  "weekTasks": [
    { "title": "Specific actionable task — not vague", "day": 1, "estimatedMinutes": 30 }
  ],

  "todayTask": { "title": "The single most important first task to do TODAY", "why": "Why starting with this specific task sets the foundation" }
}

Rules:
- keyActivities: 3–5 items, each specific to THIS goal, not generic advice
- milestones: 3–5 checkpoints evenly spread across the ${daysRemaining} days
- weekTasks: exactly ${dailyTasks} tasks per day for days 1–7 (so ${dailyTasks * 7} tasks total). Each must fit in the ${minutesPerDay} mins/day budget. Be specific — not "work on goal" but actual actions.
- All tasks must be matched to ${pace} pace: ${pace === 'hardcore' ? 'challenging, high volume, no rest days' : pace === 'soft' ? 'gentle, sustainable, with built-in recovery' : 'consistent, realistic, progressively harder each day'}
- Tasks on days 2–7 should build on day 1 — progressive, not repetitive`;

  const raw = await callAI(system, user, 3000);

  try {
    return JSON.parse(raw) as GoalAnalysis;
  } catch {
    throw new Error('Failed to parse goal analysis: ' + raw.slice(0, 200));
  }
}

// ─── Layer 2: Nightly Adaptive ────────────────────────────────────────────────

export async function generateTomorrowTasks(
  goalTitle: string,
  completedToday: number,
  totalToday: number,
  uncompletedTasks: string[],
  scheduledTasks: string[],
  minutesPerDay: number,
  pace: ThemeKey,
): Promise<{ tasks: Array<{ title: string; estimatedMinutes: number }> }> {
  const maxTasks = tasksPerDay(minutesPerDay, pace);
  const completionRate = totalToday > 0
    ? Math.round((completedToday / totalToday) * 100) : 0;

  const system = `You are a goal coach in the Surgo app adjusting a user's task plan.
${toneLine(pace)}
Respond with ONLY valid JSON.`;

  const user = `User's goal: "${goalTitle}"
Today's completion: ${completedToday}/${totalToday} tasks (${completionRate}%)
Uncompleted: ${uncompletedTasks.join(', ') || 'none'}
Tomorrow scheduled: ${scheduledTasks.join(', ') || 'none'}
Daily time budget: ${minutesPerDay} minutes
Pace: ${pace}

Adjust tomorrow. Rules:
- Under 50% done today → simplify, max ${Math.max(1, maxTasks - 1)} tasks
- 50–80% done → same load, max ${maxTasks} tasks
- Over 80% done → add one stretch task, max ${maxTasks + 1} tasks
- Every task must fit in the daily time budget and be specific

Return ONLY: { "tasks": [{ "title": "string", "estimatedMinutes": 30 }] }`;

  const raw = await callAI(system, user);
  try { return JSON.parse(raw); }
  catch { throw new Error('Failed to parse tomorrow tasks: ' + raw); }
}

// ─── Layer 3: Weekly Review ───────────────────────────────────────────────────

export async function generateWeeklyReview(
  goalTitle: string,
  completedTasks: number,
  totalTasks: number,
  currentStreak: number,
  pace: ThemeKey,
): Promise<{ review: string; nextWeekFocus: string }> {
  const system = `You are a goal coach writing a weekly review inside Surgo.
${toneLine(pace)}
Write directly to the user. 3–4 sentences max for review, 1 for focus.
Respond with ONLY valid JSON.`;

  const user = `Goal: "${goalTitle}"
This week: ${completedTasks}/${totalTasks} tasks done
Streak: ${currentStreak} days · Pace: ${pace}

Return: { "review": "string", "nextWeekFocus": "string" }`;

  const raw = await callAI(system, user);
  try { return JSON.parse(raw); }
  catch { throw new Error('Failed to parse weekly review: ' + raw); }
}

// ─── Morning message ─────────────────────────────────────────────────────────

export async function generateMorningMessage(
  goalTitle: string,
  todayTask: string,
  currentStreak: number,
  pace: ThemeKey,
): Promise<string> {
  const system = `You write short morning push notifications for the Surgo goal app.
${toneLine(pace)}
Max 2 sentences. Personal and punchy. No emojis — just words.`;

  const user = `Goal: "${goalTitle}" · Task: "${todayTask}" · Streak: ${currentStreak} days · Pace: ${pace}
Write a 1–2 sentence morning message.`;

  return callAI(system, user, 256);
}

// ─── Nightly Review Analysis ─────────────────────────────────────────────────

export type DifficultyRating = 'too_easy' | 'just_right' | 'too_hard';
export type DifficultyChange = 'reduce' | 'maintain' | 'increase';

export interface NightlyAnalysis {
  feedback: string;
  difficultyChange: DifficultyChange;
  difficultyReason: string;
  newEtaDays: number;
  etaChangeDays: number;
  etaReason: string;
  tomorrowFocus: string;
  tomorrowMinutes: number;
  closingLine: string;
}

export async function generateNightlyAnalysis({
  goalTitle,
  originalDeadlineDays,
  daysElapsed,
  tasksCompletedToday,
  tasksTotalToday,
  overallCompletionRate,
  hecticRating,
  difficultyRating,
  userNote,
  minutesPerDay,
  currentStreak,
  pace,
}: {
  goalTitle: string;
  originalDeadlineDays: number;
  daysElapsed: number;
  tasksCompletedToday: number;
  tasksTotalToday: number;
  overallCompletionRate: number;
  hecticRating: number;
  difficultyRating: DifficultyRating;
  userNote: string;
  minutesPerDay: number;
  currentStreak: number;
  pace: ThemeKey;
}): Promise<NightlyAnalysis> {

  const daysRemaining = originalDeadlineDays - daysElapsed;
  const todayRate = tasksTotalToday > 0
    ? Math.round((tasksCompletedToday / tasksTotalToday) * 100) : 0;

  const system = `You are a personal goal coach inside the Surgo app doing an end-of-day review.
${toneLine(pace)}
Be GENUINELY honest — if someone is struggling, tell them clearly and reduce their load.
If they're coasting, challenge them more. Never give empty validation.
You must respond with ONLY valid JSON — no markdown, no code fences.`;

  const user = `Goal: "${goalTitle}"
Original deadline: ${originalDeadlineDays} days total (${daysElapsed} elapsed, ${daysRemaining} remaining)
Time committed: ${minutesPerDay} minutes/day
Current streak: ${currentStreak} days

TODAY'S REPORT:
- Tasks done: ${tasksCompletedToday}/${tasksTotalToday} (${todayRate}%)
- All-time completion rate: ${overallCompletionRate}%
- How hectic was today (1=easy, 5=overwhelmed): ${hecticRating}/5
- Task difficulty: ${difficultyRating === 'too_hard' ? 'Too hard — struggled' : difficultyRating === 'too_easy' ? 'Too easy — could do more' : 'Just right'}
- User's own note: "${userNote || 'No note added'}"

Analyse honestly and return this JSON:

{
  "feedback": "2-3 sentences of GENUINE feedback. If hectic≥4 or difficulty=too_hard consistently, say so clearly. If they're doing great, acknowledge it. If they're underperforming, be direct about it. Match the ${pace} tone.",

  "difficultyChange": "${difficultyRating === 'too_hard' || hecticRating >= 4 ? '"reduce" is likely right but decide based on full picture' : difficultyRating === 'too_easy' ? '"increase" is likely right' : '"maintain" is likely right'}",

  "difficultyReason": "One sentence explaining why you're recommending this change (or no change).",

  "newEtaDays": <integer: revised days from TODAY to reach the goal. If they're behind pace, add days. If ahead, subtract. Base this on: current completion rate vs expected rate. If completion rate is ${overallCompletionRate}% but should be ${Math.round((daysElapsed / originalDeadlineDays) * 100)}% at this point, extrapolate honestly. Min 1.>,

  "etaChangeDays": <integer: newEtaDays minus ${daysRemaining}. Positive = goal takes longer, negative = ahead of schedule>,

  "etaReason": "One specific sentence explaining the ETA change. Use real numbers.",

  "tomorrowFocus": "One sharp sentence: what should they focus on tomorrow and why.",

  "tomorrowMinutes": <integer: adjusted minutes for tomorrow. If reducing difficulty, lower by 10-30%. If increasing, raise by 10-20%. Otherwise keep at ${minutesPerDay}. Min 10.>,

  "closingLine": "One ${pace === 'hardcore' ? 'tough, no-excuses' : pace === 'soft' ? 'warm, gentle' : 'honest, motivating'} closing line to end the day on."
}`;

  const raw = await callAI(system, user, 1500);
  try {
    return JSON.parse(raw) as NightlyAnalysis;
  } catch {
    throw new Error('Failed to parse nightly analysis: ' + raw.slice(0, 200));
  }
}

// ─── Legacy wrapper (kept for backward compat) ────────────────────────────────

export async function generateGoalBreakdown(
  goalTitle: string,
  targetDate: string,
  daysRemaining: number,
  pace: ThemeKey,
): Promise<AIGoalBreakdown> {
  const analysis = await analyzeGoal(goalTitle, targetDate, daysRemaining, 30, pace);
  return {
    milestones: analysis.milestones,
    weekTasks: analysis.weekTasks,
    todayTask: analysis.todayTask,
  };
}
