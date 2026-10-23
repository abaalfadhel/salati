export type PrayerType = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type PlanningMode = 'daily_total' | 'sequential' | 'flexible';

export interface UserProfile {
  guestId: string;
  displayName: string;
  nickname?: string;
  createdAt: string;
  completedAt?: string; // Date when all debts were completed
}

export type PrayerBalances = Record<PrayerType, number>;

export interface PrayerRecord {
  id: string;
  prayer: PrayerType;
  quantity: number;
  rakats: number;
  date: string; // YYYY-MM-DD in local time
  timestamp: number;
  note?: string;
}

export interface PrayerSessionItem {
  target: number;
  completed: number;
  postponed: number;
}

export interface DailySession {
  date: string; // YYYY-MM-DD
  target: number;
  completed: number;
  postponed: number;
  breakdown: Record<PrayerType, PrayerSessionItem>;
}

export interface DailyPlan {
  mode: PlanningMode;
  dailyTotal: number;
  distribution: Record<PrayerType, number>;
}

export type AchievementCategory =
  | 'fajr'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha'
  | 'volume'
  | 'percentage'
  | 'month'
  | 'ten_years'
  | 'streak'
  | 'challenge';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface PersonalChallenge {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  title: string;
  description: string;
  target: number;
  completed: number;
  startDate: string;
  endDate: string;
  reward: string;
  isCompleted: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  includeGuestIdOnCertificate: boolean;
  soundEffectsEnabled: boolean;
  reducedMotion: boolean;
  notificationsEnabled: boolean;
  notificationTime?: string;
}

export interface AppData {
  schemaVersion: number;
  isOnboarded: boolean;
  profile: UserProfile;
  startingBalances: PrayerBalances;
  remainingBalances: PrayerBalances;
  completedTotals: PrayerBalances;
  history: PrayerRecord[];
  dailySessions: Record<string, DailySession>; // keyed by date YYYY-MM-DD
  activePlan: DailyPlan;
  achievements: Achievement[];
  challenges: PersonalChallenge[];
  settings: AppSettings;
  certificateId?: string;
}
