import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, Task, Milestone, GoalCategory } from '@/types';
import { toDateString } from '@/lib/streak';

const GOALS_KEY = '@surgo_goals';
const TASKS_KEY = '@surgo_tasks';
const MILESTONES_KEY = '@surgo_milestones';

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface GoalStore {
  goals: Goal[];
  tasks: Task[];
  milestones: Milestone[];
  isLoaded: boolean;

  // Load from storage
  load: () => Promise<void>;

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'progress'>) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Tasks
  addTasks: (tasks: Omit<Task, 'id'>[]) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  uncompleteTask: (taskId: string) => Promise<void>;
  replaceTasksForGoal: (goalId: string, date: string, tasks: Omit<Task, 'id'>[]) => Promise<void>;

  // Milestones
  addMilestones: (milestones: Omit<Milestone, 'id'>[]) => Promise<void>;
  completeMilestone: (milestoneId: string) => Promise<void>;

  // Computed
  getTodaysTasks: () => Task[];
  getTasksForGoal: (goalId: string) => Task[];
  getMilestonesForGoal: (goalId: string) => Milestone[];
  getGoalProgress: (goalId: string) => number;
}

async function persist(key: string, data: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  tasks: [],
  milestones: [],
  isLoaded: false,

  load: async () => {
    try {
      const [goalsRaw, tasksRaw, milestonesRaw] = await Promise.all([
        AsyncStorage.getItem(GOALS_KEY),
        AsyncStorage.getItem(TASKS_KEY),
        AsyncStorage.getItem(MILESTONES_KEY),
      ]);
      set({
        goals: goalsRaw ? JSON.parse(goalsRaw) : [],
        tasks: tasksRaw ? JSON.parse(tasksRaw) : [],
        milestones: milestonesRaw ? JSON.parse(milestonesRaw) : [],
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },

  // ── Goals ──────────────────────────────────────────────────────────────────

  addGoal: async (goalData) => {
    const goal: Goal = {
      ...goalData,
      id: uuid(),
      progress: 0,
      createdAt: new Date().toISOString(),
    };
    const goals = [...get().goals, goal];
    set({ goals });
    await persist(GOALS_KEY, goals);
    return goal;
  },

  updateGoal: async (id, updates) => {
    const goals = get().goals.map((g) => (g.id === id ? { ...g, ...updates } : g));
    set({ goals });
    await persist(GOALS_KEY, goals);
  },

  deleteGoal: async (id) => {
    const goals = get().goals.filter((g) => g.id !== id);
    const tasks = get().tasks.filter((t) => t.goalId !== id);
    const milestones = get().milestones.filter((m) => m.goalId !== id);
    set({ goals, tasks, milestones });
    await Promise.all([
      persist(GOALS_KEY, goals),
      persist(TASKS_KEY, tasks),
      persist(MILESTONES_KEY, milestones),
    ]);
  },

  // ── Tasks ──────────────────────────────────────────────────────────────────

  addTasks: async (newTasks) => {
    const tasks = [
      ...get().tasks,
      ...newTasks.map((t) => ({ ...t, id: uuid() })),
    ];
    set({ tasks });
    await persist(TASKS_KEY, tasks);
  },

  completeTask: async (taskId) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId ? { ...t, completedAt: new Date().toISOString() } : t,
    );
    set({ tasks });
    await persist(TASKS_KEY, tasks);

    // Recalculate goal progress
    const task = get().tasks.find((t) => t.id === taskId);
    if (task) {
      const progress = get().getGoalProgress(task.goalId);
      await get().updateGoal(task.goalId, { progress });
    }
  },

  uncompleteTask: async (taskId) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId ? { ...t, completedAt: undefined } : t,
    );
    set({ tasks });
    await persist(TASKS_KEY, tasks);
  },

  replaceTasksForGoal: async (goalId, date, newTasks) => {
    // Remove existing incomplete tasks for this goal on this date
    const tasks = [
      ...get().tasks.filter(
        (t) => !(t.goalId === goalId && t.dueDate === date && !t.completedAt),
      ),
      ...newTasks.map((t) => ({ ...t, id: uuid() })),
    ];
    set({ tasks });
    await persist(TASKS_KEY, tasks);
  },

  // ── Milestones ─────────────────────────────────────────────────────────────

  addMilestones: async (newMilestones) => {
    const milestones = [
      ...get().milestones,
      ...newMilestones.map((m) => ({ ...m, id: uuid() })),
    ];
    set({ milestones });
    await persist(MILESTONES_KEY, milestones);
  },

  completeMilestone: async (milestoneId) => {
    const milestones = get().milestones.map((m) =>
      m.id === milestoneId ? { ...m, completedAt: new Date().toISOString() } : m,
    );
    set({ milestones });
    await persist(MILESTONES_KEY, milestones);
  },

  // ── Computed ───────────────────────────────────────────────────────────────

  getTodaysTasks: () => {
    const today = toDateString(new Date());
    return get().tasks.filter((t) => t.dueDate === today);
  },

  getTasksForGoal: (goalId) => {
    return get().tasks.filter((t) => t.goalId === goalId);
  },

  getMilestonesForGoal: (goalId) => {
    return get().milestones.filter((m) => m.goalId === goalId);
  },

  getGoalProgress: (goalId) => {
    const tasks = get().tasks.filter((t) => t.goalId === goalId);
    if (tasks.length === 0) return 0;
    const done = tasks.filter((t) => !!t.completedAt).length;
    return Math.round((done / tasks.length) * 100);
  },
}));
