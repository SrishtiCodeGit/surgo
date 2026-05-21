import { AIGoalBreakdown, ThemeKey } from '@/types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-3-5-haiku-20241022'; // Fast + affordable for mobile

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!key) throw new Error('Missing EXPO_PUBLIC_ANTHROPIC_API_KEY');
  return key;
}

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content[0].text as string;
}

// ─── Helper: tone description per theme ──────────────────────────────────────

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

// ─── Layer 1: Goal Intake — Break a goal into milestones + tasks ─────────────

export async function generateGoalBreakdown(
  goalTitle: string,
  targetDate: string,
  daysRemaining: number,
  pace: ThemeKey,
): Promise<AIGoalBreakdown> {
  const system = `You are a world-class goal coach inside an app called Velo.
${toneLine(pace)}
You must respond with ONLY valid JSON — no markdown, no explanation, no code fences.`;

  const user = `The user wants to achieve this goal:

Goal: "${goalTitle}"
Deadline: ${targetDate} (${daysRemaining} days away)
Pace: ${pace}

Break this into a structured plan with:
1. 3–5 milestones (major checkpoints toward the goal)
2. Week 1 daily tasks (max ${pace === 'hardcore' ? 7 : pace === 'balanced' ? 5 : 3} tasks, specific and immediately actionable)
3. The single most important task to do TODAY with a short reason why

Return ONLY this JSON shape:
{
  "milestones": [{ "title": "string", "targetDate": "YYYY-MM-DD" }],
  "weekTasks": [{ "title": "string", "day": 1, "estimatedMinutes": 30 }],
  "todayTask": { "title": "string", "why": "string" }
}`;

  const raw = await callClaude(system, user);

  try {
    return JSON.parse(raw) as AIGoalBreakdown;
  } catch {
    throw new Error('Failed to parse goal breakdown from Claude: ' + raw);
  }
}

// ─── Layer 2: Nightly Adaptive — Regenerate tomorrow's tasks ─────────────────

export async function generateTomorrowTasks(
  goalTitle: string,
  completedToday: number,
  totalToday: number,
  uncompletedTasks: string[],
  scheduledTasks: string[],
  pace: ThemeKey,
): Promise<{ tasks: Array<{ title: string; estimatedMinutes: number }> }> {
  const maxTasks = pace === 'hardcore' ? 7 : pace === 'balanced' ? 5 : 3;
  const completionRate = totalToday > 0
    ? Math.round((completedToday / totalToday) * 100)
    : 0;

  const system = `You are a goal coach in the Velo app adjusting a user's task plan.
${toneLine(pace)}
Respond with ONLY valid JSON — no markdown, no explanation.`;

  const user = `User's goal: "${goalTitle}"
Today's completion: ${completedToday}/${totalToday} tasks (${completionRate}%)
Uncompleted tasks: ${uncompletedTasks.length > 0 ? uncompletedTasks.join(', ') : 'none'}
Tomorrow's currently scheduled: ${scheduledTasks.length > 0 ? scheduledTasks.join(', ') : 'none'}
Pace setting: ${pace}

Adjust tomorrow's task list. Rules:
- If completion < 50%: simplify or merge tasks, max ${Math.max(2, maxTasks - 2)} tasks
- If completion 50–80%: keep roughly the same load, max ${maxTasks} tasks
- If completion > 80%: keep the plan + add one stretch task, max ${maxTasks + 1} tasks
- Every task must be specific and actionable (not vague like "work on goal")

Return ONLY this JSON:
{
  "tasks": [{ "title": "string", "estimatedMinutes": 30 }]
}`;

  const raw = await callClaude(system, user);

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Failed to parse tomorrow tasks from Claude: ' + raw);
  }
}

// ─── Layer 3: Weekly Review — Coach's summary of the past week ───────────────

export async function generateWeeklyReview(
  goalTitle: string,
  completedTasks: number,
  totalTasks: number,
  currentStreak: number,
  pace: ThemeKey,
): Promise<{ review: string; nextWeekFocus: string }> {
  const system = `You are a goal coach writing a weekly review inside the Velo app.
${toneLine(pace)}
Write like you're talking directly to the user. Keep it concise — 3–4 sentences max for the review, 1 sentence for the focus.
Respond with ONLY valid JSON.`;

  const user = `User's goal: "${goalTitle}"
This week: ${completedTasks}/${totalTasks} tasks completed
Current streak: ${currentStreak} days
Pace: ${pace}

Write:
1. A short review (3–4 sentences): what they did well, what to improve, one motivational close
2. One sharp focus for next week

Return ONLY this JSON:
{
  "review": "string",
  "nextWeekFocus": "string"
}`;

  const raw = await callClaude(system, user);

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Failed to parse weekly review from Claude: ' + raw);
  }
}

// ─── Bonus: Morning Message — Personalized daily greeting ────────────────────

export async function generateMorningMessage(
  goalTitle: string,
  todayTask: string,
  currentStreak: number,
  pace: ThemeKey,
): Promise<string> {
  const system = `You are writing a short morning push notification for the Velo goal app.
${toneLine(pace)}
Max 2 sentences. Make it personal and punchy. No emojis in the text — just words.`;

  const user = `User's goal: "${goalTitle}"
Today's task: "${todayTask}"
Streak: ${currentStreak} days
Pace: ${pace}

Write a 1–2 sentence morning message that mentions their task and streak.`;

  return callClaude(system, user);
}
