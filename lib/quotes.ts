import { ThemeKey } from '@/types';

// ─── Quote Bank ───────────────────────────────────────────────────────────────
// Each theme has its own curated voice. Soft = compassionate. Balanced = honest.
// Hardcore = zero mercy. Quotes are picked randomly per notification.

const softQuotes: string[] = [
  "Progress, not perfection. You're doing beautifully.",
  "Every small step is still a step forward.",
  "Be proud of how far you've come, not just how far you have to go.",
  "You don't have to be great to start — but you have to start to be great.",
  "Rest if you must, but don't you quit.",
  "Slow progress is still progress.",
  "The fact that you're trying already makes you someone worth cheering for.",
  "Kindness to yourself is the fuel for consistency.",
  "One day at a time. One task at a time. One breath at a time.",
  "You planted a seed today. Water it again tomorrow.",
  "Showing up on hard days is where character is built.",
  "There is no finish line — only the joy of moving forward.",
  "You are allowed to be both a work in progress and a masterpiece.",
  "Every day you choose yourself is a victory.",
  "Bloom at your own pace.",
  "Growth doesn't always look like a straight line — and that's okay.",
  "The mountain doesn't care how slow you climb, only that you keep climbing.",
  "Your only competition is who you were yesterday.",
  "Courage is taking the next small step even when you can't see the whole staircase.",
  "You have permission to go gently — and still get there.",
];

const balancedQuotes: string[] = [
  "Success is the sum of small efforts, repeated day in and day out. — Robert Collier",
  "The secret of getting ahead is getting started. — Mark Twain",
  "You don't rise to the level of your goals, you fall to the level of your systems. — James Clear",
  "Discipline is choosing between what you want now and what you want most.",
  "It always seems impossible until it's done. — Nelson Mandela",
  "The man who moves a mountain begins by carrying away small stones. — Confucius",
  "Don't wish it were easier. Wish you were better. — Jim Rohn",
  "An investment in yourself pays the best dividends. — Benjamin Franklin",
  "What you do every day matters more than what you do every once in a while.",
  "The pain of discipline is far less than the pain of regret.",
  "We are what we repeatedly do. Excellence is not an act, but a habit. — Aristotle",
  "Your future self is watching you right now through memories.",
  "The only person you are destined to become is the person you decide to be. — Emerson",
  "Action is the foundational key to all success. — Pablo Picasso",
  "Done is better than perfect. Consistent is better than sporadic.",
  "Hard work beats talent when talent doesn't work hard. — Kevin Durant",
  "The difference between ordinary and extraordinary is practice.",
  "Build the life you want — one day at a time.",
  "Dreams don't work unless you do.",
  "Every expert was once a beginner. Keep going.",
];

const hardcoreQuotes: string[] = [
  "Either you run the day or the day runs you. — Jim Rohn",
  "No one is going to come save you. Get up and do the work.",
  "Pain is temporary. Quitting lasts forever. — Lance Armstrong",
  "Champions aren't made in gyms. Champions are made from something they have deep inside them.",
  "Do it now. Sometimes 'later' becomes 'never'.",
  "If you're tired, learn to rest, not quit.",
  "Stop waiting for the right moment. The moment is now.",
  "The only way out is through. — Robert Frost",
  "Sweat now, shine later.",
  "While you're making excuses, someone else is making progress.",
  "If it doesn't challenge you, it doesn't change you. — Fred DeVito",
  "You didn't come this far to only come this far.",
  "Suffer the pain of discipline or suffer the pain of regret. You choose.",
  "Be obsessed or be average. — Grant Cardone",
  "No shortcuts. No excuses. No days off from your purpose.",
  "The harder the battle, the sweeter the victory.",
  "Comfort is the enemy of achievement.",
  "Your excuses are lies you tell yourself.",
  "Greatness is earned every single day. Earn it.",
  "Get comfortable being uncomfortable. That's where growth lives.",
];

// ─── Quote Selector ───────────────────────────────────────────────────────────

const quotesByTheme: Record<ThemeKey, string[]> = {
  soft: softQuotes,
  balanced: balancedQuotes,
  hardcore: hardcoreQuotes,
};

/**
 * Get a random quote for the given theme.
 * Optionally seed by date so the same quote shows all day.
 */
export function getRandomQuote(pace: ThemeKey, seedByDate = false): string {
  const pool = quotesByTheme[pace];

  if (seedByDate) {
    // Same quote all day — seed using today's date number
    const today = new Date();
    const seed =
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();
    const index = seed % pool.length;
    return pool[index];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get today's quote (same one shown morning + reminders for consistency).
 */
export function getTodaysQuote(pace: ThemeKey): string {
  return getRandomQuote(pace, true);
}

/**
 * Get a quote specifically for a streak milestone.
 */
export function getMilestoneQuote(streak: number, pace: ThemeKey): string {
  const milestoneQuotes: Record<ThemeKey, Record<number, string>> = {
    soft: {
      3:   "Three days of showing up for yourself. That's love. 🌸",
      7:   "A whole week! You're building something beautiful. 🌿",
      14:  "Two weeks of choosing yourself every day. Keep blooming. 💛",
      21:  "21 days — they say this is how habits are born. You did it. 🌻",
      30:  "A month of showing up. You are not the same person you were 30 days ago. ✨",
      60:  "Two months. Your future self is already grateful. 🌟",
      90:  "90 days. You've proven to yourself that you can. Remember this feeling. 💖",
    },
    balanced: {
      3:   "3 days in. Momentum is building. Keep the chain alive.",
      7:   "One week. You've proven the habit can exist. Now make it permanent.",
      14:  "2 weeks of discipline. You're in the top 20% of people who started. Keep going.",
      21:  "21 days. Science says habits form here. You're wired differently now.",
      30:  "30-day streak. One month of choosing your goals over comfort. Respect.",
      60:  "60 days. You're operating at a level most people only dream about.",
      90:  "90 days. This is no longer a goal — it's who you are.",
    },
    hardcore: {
      3:   "3 days. Good start. Now the real test begins.",
      7:   "One week. Most people quit by now. You didn't. Keep moving.",
      14:  "14 days. You're in rare company. Don't get comfortable.",
      21:  "21 days. You've killed the old version of yourself. Don't let it come back.",
      30:  "30 days. One month of zero excuses. This is only the beginning.",
      60:  "60 days. You're built differently now. Don't waste it.",
      90:  "90 DAYS. You are the proof that discipline wins. Now double it.",
    },
  };

  const themeMap = milestoneQuotes[pace];
  return themeMap[streak] ?? getRandomQuote(pace, false);
}
