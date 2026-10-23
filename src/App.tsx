/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  History,
  Layers,
  ListOrdered,
  Plus,
  Quote,
  RotateCcw,
  Sparkles,
  Trophy,
  WifiOff,
  Undo2,
  X,
} from 'lucide-react';

import {
  AppData,
  AppSettings,
  DailyPlan,
  DailySession,
  PrayerBalances,
  PrayerRecord,
  PrayerType,
  UserProfile,
  Achievement,
} from './types';
import {
  calculateCompletionPercentage,
  calculateTotalPrayers,
  calculateTotalRakats,
  generateCertificateId,
  getNextSequentialPrayer,
  PRAYER_NAMES,
  PRAYER_ORDER,
  recordPrayerCompletion,
  STANDARD_RAKATS,
  undoPrayerCompletion,
} from './utils/prayerLogic';
import { evaluateAchievements } from './utils/achievementsList';
import {
  calculateEstimatedTimeRemaining,
  calculatePeriodCompletions,
  getLocalTodayString,
} from './utils/dateUtils';
import { soundManager } from './utils/soundEffects';
import { clearAllLocalData, getDefaultAppData, loadAppData, saveAppData } from './utils/storage';

import { Navbar } from './components/Navbar';
import { NavigationDrawer, ScreenId } from './components/NavigationDrawer';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingFlow } from './components/OnboardingFlow';
import { OverallProgress } from './components/OverallProgress';
import { PrayerCompletionChart } from './components/PrayerCompletionChart';
import { DailySessionCard } from './components/DailySessionCard';
import { PrayerCard } from './components/PrayerCard';
import { RecordPrayerModal } from './components/RecordPrayerModal';
import { RecentActivityList } from './components/RecentActivityList';
import { CertificateGallery } from './components/CertificateGallery';
import { AchievementsView } from './components/AchievementsView';
import { ChallengesView } from './components/ChallengesView';
import { AccountView } from './components/AccountView';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { AboutView } from './components/AboutView';
import { SettingsView } from './components/SettingsView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { AchievementCelebrationModal } from './components/AchievementCelebrationModal';

const SPIRITUAL_QUOTES = [
  '«أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ»',
  '«إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا»',
  '«مَنْ نَسِيَ صَلَاةً فَلْيُصَلِّهَا إِذَا ذَكَرَهَا لَا كَفَّارَةَ لَهَا إِلَّا ذَلِكَ»',
  'خطوة بخطوة، والنية الصادقة تعين على قضاء ما في الذمة وتفريج الهم.',
  'الاستمرار قليل خير من انقطاع كثير؛ هنيئاً لك هذا السعي المبارك.',
  '«وَأَقِمِ الصَّلَاةَ طَرَفَيِ النَّهَارِ وَزُلَفًا مِّنَ اللَّيْلِ ۚ إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ»',
];

interface ToastState {
  id: string;
  message: string;
  record: PrayerRecord;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [appData, setAppData] = useState<AppData>(getDefaultAppData);
  const [showSplash, setShowSplash] = useState(true);
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Prayer recording modal state for custom count/notes
  const [recordingPrayer, setRecordingPrayer] = useState<PrayerType | null>(null);

  // Newly unlocked achievement celebratory popup
  const [celebratingAchievement, setCelebratingAchievement] = useState<Achievement | null>(null);

  // Toast notification for quick action & instant undo
  const [toastInfo, setToastInfo] = useState<ToastState | null>(null);

  // Random spiritual quote
  const [dailyQuote] = useState(
    () => SPIRITUAL_QUOTES[Math.floor(Math.random() * SPIRITUAL_QUOTES.length)]
  );

  // Initialize and load data
  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search);
      const isAutostart = params.get('autostart') === '1';

      try {
        const loaded = await loadAppData();

        if (isAutostart && !loaded.isOnboarded) {
          loaded.isOnboarded = true;
          loaded.profile.displayName = 'عبد الله';
          loaded.startingBalances = { fajr: 365, dhuhr: 365, asr: 365, maghrib: 365, isha: 365 };
          loaded.remainingBalances = { fajr: 365, dhuhr: 365, asr: 365, maghrib: 365, isha: 365 };
          loaded.completedTotals = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
          await saveAppData(loaded);
          setShowSplash(false);
        }

        setAppData(loaded);

        if (isAutostart) {
          setShowSplash(false);
        }
      } catch (err) {
        console.error('فشل في تحميل حالة التطبيق:', err);
      } finally {
        setIsLoading(false);
      }
    }

    init();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch((err) => {
        console.warn('فشل تسجيل Service Worker:', err);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Responsive Theme Management (Light, Dark, and System preference)
  useEffect(() => {
    const applyTheme = () => {
      const selectedTheme = appData.settings.theme;
      if (selectedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else if (selectedTheme === 'light') {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      } else {
        // System preference
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isSystemDark) {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
        }
      }
    };

    applyTheme();

    // Listen to OS theme changes if system mode is chosen
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (appData.settings.theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [appData.settings.theme]);

  // Persist appData whenever it changes
  const updateAndSaveAppData = async (newData: AppData) => {
    setAppData(newData);
    await saveAppData(newData);
  };

  // Onboarding completion handler
  const handleOnboardingComplete = async (payload: {
    profile: UserProfile;
    startingBalances: PrayerBalances;
    activePlan: DailyPlan;
  }) => {
    const updated: AppData = {
      ...appData,
      isOnboarded: true,
      profile: payload.profile,
      startingBalances: payload.startingBalances,
      remainingBalances: { ...payload.startingBalances },
      completedTotals: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
      activePlan: payload.activePlan,
    };
    await updateAndSaveAppData(updated);
  };

  // Local calendar date
  const todayStr = getLocalTodayString();

  // Ensure current daily session exists
  const todaySession: DailySession = appData.dailySessions[todayStr] || {
    date: todayStr,
    target: appData.activePlan.dailyTotal,
    completed: 0,
    postponed: 0,
    breakdown: {
      fajr: { target: appData.activePlan.distribution.fajr || 1, completed: 0, postponed: 0 },
      dhuhr: { target: appData.activePlan.distribution.dhuhr || 1, completed: 0, postponed: 0 },
      asr: { target: appData.activePlan.distribution.asr || 1, completed: 0, postponed: 0 },
      maghrib: { target: appData.activePlan.distribution.maghrib || 1, completed: 0, postponed: 0 },
      isha: { target: appData.activePlan.distribution.isha || 1, completed: 0, postponed: 0 },
    },
  };

  // Overall statistics & metrics
  const startingTotal = calculateTotalPrayers(appData.startingBalances);
  const remainingTotal = calculateTotalPrayers(appData.remainingBalances);
  const completedTotal = calculateTotalPrayers(appData.completedTotals);
  const completionPct = calculateCompletionPercentage(startingTotal, completedTotal);
  const nextEligiblePrayer = getNextSequentialPrayer(appData.remainingBalances);

  // Period completions (this week, this month)
  const periodStats = calculatePeriodCompletions(appData.history, todayStr);

  // Estimated time remaining text
  const estimatedRemaining = calculateEstimatedTimeRemaining(
    remainingTotal,
    appData.activePlan.dailyTotal || 5
  );

  // Find most advanced prayer
  let mostAdvancedText = '';
  if (completedTotal > 0) {
    let topPrayer: PrayerType = 'fajr';
    let maxPct = -1;
    for (const p of PRAYER_ORDER) {
      const comp = appData.completedTotals[p] || 0;
      const start = appData.startingBalances[p] || 0;
      const pct = start > 0 ? comp / start : 0;
      if (pct > maxPct && comp > 0) {
        maxPct = pct;
        topPrayer = p;
      }
    }
    mostAdvancedText = `أكثر الصلوات إنجازاً: صلاة ${PRAYER_NAMES[topPrayer]} (${(appData.completedTotals[topPrayer] || 0).toLocaleString('ar-SA')} صلاة)`;
  }

  // --- CORE 1-CLICK QUICK RECORD ACTION ---
  const handleQuickRecord = async (prayer: PrayerType) => {
    const res = recordPrayerCompletion(
      appData.remainingBalances,
      appData.completedTotals,
      prayer,
      1,
      undefined,
      todayStr
    );

    if (!res.success || !res.record) {
      alert(res.error || 'تعذر تسجيل الصلاة');
      return;
    }

    // Play subtle chime sound
    soundManager.playRecordChime(appData.settings.soundEffectsEnabled);

    // Update daily session
    const existingSession = appData.dailySessions[todayStr] || {
      date: todayStr,
      target: appData.activePlan.dailyTotal,
      completed: 0,
      postponed: 0,
      breakdown: {
        fajr: { target: appData.activePlan.distribution.fajr || 1, completed: 0, postponed: 0 },
        dhuhr: { target: appData.activePlan.distribution.dhuhr || 1, completed: 0, postponed: 0 },
        asr: { target: appData.activePlan.distribution.asr || 1, completed: 0, postponed: 0 },
        maghrib: { target: appData.activePlan.distribution.maghrib || 1, completed: 0, postponed: 0 },
        isha: { target: appData.activePlan.distribution.isha || 1, completed: 0, postponed: 0 },
      },
    };

    const prevPrayerBreakdown = existingSession.breakdown[prayer] || {
      target: 0,
      completed: 0,
      postponed: 0,
    };

    const updatedSession: DailySession = {
      ...existingSession,
      completed: existingSession.completed + 1,
      breakdown: {
        ...existingSession.breakdown,
        [prayer]: {
          ...prevPrayerBreakdown,
          completed: prevPrayerBreakdown.completed + 1,
        },
      },
    };

    // Update challenges progress
    const updatedChallenges = appData.challenges.map((c) => {
      if (c.isCompleted) return c;
      const nextComp = c.completed + 1;
      const isDone = nextComp >= c.target;
      return {
        ...c,
        completed: nextComp,
        isCompleted: isDone,
      };
    });

    const nextAppData: AppData = {
      ...appData,
      remainingBalances: res.newRemaining,
      completedTotals: res.newCompleted,
      history: [res.record, ...appData.history],
      dailySessions: {
        ...appData.dailySessions,
        [todayStr]: updatedSession,
      },
      challenges: updatedChallenges,
    };

    // Check if debt has just fully reached zero
    const newRemainingTotal = calculateTotalPrayers(res.newRemaining);
    if (newRemainingTotal === 0 && startingTotal > 0) {
      if (!nextAppData.profile.completedAt) {
        nextAppData.profile.completedAt = todayStr;
      }
      if (!nextAppData.certificateId) {
        nextAppData.certificateId = generateCertificateId();
      }
    }

    // Evaluate Achievements
    const evalRes = evaluateAchievements(nextAppData);
    nextAppData.achievements = evalRes.updatedAchievements;

    await updateAndSaveAppData(nextAppData);

    // Show temporary Toast notification with Undo button
    setToastInfo({
      id: String(Date.now()),
      message: `تم تسجيل قضاء صلاة ${PRAYER_NAMES[prayer]} بنجاح (+1)`,
      record: res.record,
    });

    // Auto dismiss toast after 5 seconds
    setTimeout(() => {
      setToastInfo((curr) => (curr && curr.record.id === res.record?.id ? null : curr));
    }, 5000);

    // Check for newly unlocked achievement or goal celebration
    if (evalRes.newlyUnlocked.length > 0) {
      setCelebratingAchievement(evalRes.newlyUnlocked[0]);
      soundManager.playCelebrationChime(appData.settings.soundEffectsEnabled);

      if (!appData.settings.reducedMotion) {
        try {
          confetti({
            particleCount: 65,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#059669', '#d4af37', '#10b981', '#f59e0b'],
          });
        } catch {
          // Ignore
        }
      }
    } else if (updatedSession.target > 0 && updatedSession.completed === updatedSession.target) {
      // Completed daily target
      soundManager.playCelebrationChime(appData.settings.soundEffectsEnabled);
      if (!appData.settings.reducedMotion) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#059669', '#d4af37', '#10b981'],
          });
        } catch {
          // Ignore
        }
      }
    }
  };

  // Custom Record Action (via modal with note and quantity)
  const handleConfirmCustomRecord = async (data: {
    prayer: PrayerType;
    quantity: number;
    note?: string;
    date: string;
  }) => {
    const res = recordPrayerCompletion(
      appData.remainingBalances,
      appData.completedTotals,
      data.prayer,
      data.quantity,
      data.note,
      data.date
    );

    if (!res.success || !res.record) {
      alert(res.error || 'حدث خطأ أثناء التسجيل');
      return;
    }

    soundManager.playRecordChime(appData.settings.soundEffectsEnabled);

    const recordDate = data.date || todayStr;
    const existingSession = appData.dailySessions[recordDate] || {
      date: recordDate,
      target: appData.activePlan.dailyTotal,
      completed: 0,
      postponed: 0,
      breakdown: {
        fajr: { target: appData.activePlan.distribution.fajr || 1, completed: 0, postponed: 0 },
        dhuhr: { target: appData.activePlan.distribution.dhuhr || 1, completed: 0, postponed: 0 },
        asr: { target: appData.activePlan.distribution.asr || 1, completed: 0, postponed: 0 },
        maghrib: { target: appData.activePlan.distribution.maghrib || 1, completed: 0, postponed: 0 },
        isha: { target: appData.activePlan.distribution.isha || 1, completed: 0, postponed: 0 },
      },
    };

    const prevPrayerBreakdown = existingSession.breakdown[data.prayer] || {
      target: 0,
      completed: 0,
      postponed: 0,
    };

    const updatedSession: DailySession = {
      ...existingSession,
      completed: existingSession.completed + data.quantity,
      breakdown: {
        ...existingSession.breakdown,
        [data.prayer]: {
          ...prevPrayerBreakdown,
          completed: prevPrayerBreakdown.completed + data.quantity,
        },
      },
    };

    const updatedChallenges = appData.challenges.map((c) => {
      if (c.isCompleted) return c;
      const nextComp = c.completed + data.quantity;
      const isDone = nextComp >= c.target;
      return {
        ...c,
        completed: nextComp,
        isCompleted: isDone,
      };
    });

    const nextAppData: AppData = {
      ...appData,
      remainingBalances: res.newRemaining,
      completedTotals: res.newCompleted,
      history: [res.record, ...appData.history],
      dailySessions: {
        ...appData.dailySessions,
        [recordDate]: updatedSession,
      },
      challenges: updatedChallenges,
    };

    const newRemainingTotal = calculateTotalPrayers(res.newRemaining);
    if (newRemainingTotal === 0 && startingTotal > 0) {
      if (!nextAppData.profile.completedAt) {
        nextAppData.profile.completedAt = recordDate;
      }
      if (!nextAppData.certificateId) {
        nextAppData.certificateId = generateCertificateId();
      }
    }

    const evalRes = evaluateAchievements(nextAppData);
    nextAppData.achievements = evalRes.updatedAchievements;

    await updateAndSaveAppData(nextAppData);

    setToastInfo({
      id: String(Date.now()),
      message: `تم تسجيل قضاء ${data.quantity} صلاة ${PRAYER_NAMES[data.prayer]} بنجاح`,
      record: res.record,
    });

    if (evalRes.newlyUnlocked.length > 0) {
      setCelebratingAchievement(evalRes.newlyUnlocked[0]);
      soundManager.playCelebrationChime(appData.settings.soundEffectsEnabled);

      if (!appData.settings.reducedMotion) {
        try {
          confetti({
            particleCount: 65,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#059669', '#d4af37', '#10b981', '#f59e0b'],
          });
        } catch {
          // Ignore
        }
      }
    }
  };

  // Undo Last Record Action
  const handleUndoRecord = async (record: PrayerRecord) => {
    const res = undoPrayerCompletion(
      appData.remainingBalances,
      appData.completedTotals,
      record
    );

    const nextHistory = appData.history.filter((h) => h.id !== record.id);
    const recordDate = record.date;
    const session = appData.dailySessions[recordDate];
    let updatedDailySessions = { ...appData.dailySessions };

    if (session) {
      const prevPrayerBreakdown = session.breakdown[record.prayer] || {
        target: 0,
        completed: 0,
        postponed: 0,
      };
      updatedDailySessions[recordDate] = {
        ...session,
        completed: Math.max(0, session.completed - record.quantity),
        breakdown: {
          ...session.breakdown,
          [record.prayer]: {
            ...prevPrayerBreakdown,
            completed: Math.max(0, prevPrayerBreakdown.completed - record.quantity),
          },
        },
      };
    }

    const nextAppData: AppData = {
      ...appData,
      remainingBalances: res.newRemaining,
      completedTotals: res.newCompleted,
      history: nextHistory,
      dailySessions: updatedDailySessions,
    };

    // Re-evaluate achievements
    const evalRes = evaluateAchievements(nextAppData);
    nextAppData.achievements = evalRes.updatedAchievements;

    await updateAndSaveAppData(nextAppData);

    // Dismiss toast if it was the undone record
    setToastInfo((curr) => (curr && curr.record.id === record.id ? null : curr));
  };

  // Postpone Unfinished Items for today's session
  const handlePostponeUnfinished = async (count: number) => {
    const updatedSession: DailySession = {
      ...todaySession,
      postponed: (todaySession.postponed || 0) + count,
    };
    const nextAppData: AppData = {
      ...appData,
      dailySessions: {
        ...appData.dailySessions,
        [todayStr]: updatedSession,
      },
    };
    await updateAndSaveAppData(nextAppData);
  };

  // Adjust today's target
  const handleAdjustTodayTarget = async (newTarget: number) => {
    const updatedSession: DailySession = {
      ...todaySession,
      target: newTarget,
    };
    const nextAppData: AppData = {
      ...appData,
      dailySessions: {
        ...appData.dailySessions,
        [todayStr]: updatedSession,
      },
    };
    await updateAndSaveAppData(nextAppData);
  };

  // Add custom challenge
  const handleAddCustomChallenge = async (challenge: {
    title: string;
    description: string;
    target: number;
    days: number;
    reward: string;
  }) => {
    const newChallenge = {
      id: `ch_${Date.now()}`,
      type: 'custom' as const,
      title: challenge.title,
      description: challenge.description,
      target: challenge.target,
      completed: 0,
      startDate: todayStr,
      endDate: new Date(Date.now() + challenge.days * 86400000).toISOString().split('T')[0],
      reward: challenge.reward,
      isCompleted: false,
    };
    const nextAppData = {
      ...appData,
      challenges: [newChallenge, ...appData.challenges],
    };
    await updateAndSaveAppData(nextAppData);
  };

  // Reset entire application data
  const handleResetAllData = async () => {
    await clearAllLocalData();
    const fresh = getDefaultAppData();
    setAppData(fresh);
    setShowSplash(false);
    setActiveScreen('dashboard');
  };

  // Toggle Theme
  const handleToggleTheme = () => {
    soundManager.playClick(appData.settings.soundEffectsEnabled);
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    const nextTheme: 'light' | 'dark' = isCurrentlyDark ? 'light' : 'dark';
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    const nextSettings: AppSettings = { ...appData.settings, theme: nextTheme };
    updateAndSaveAppData({ ...appData, settings: nextSettings });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-center p-6 text-center">
        <img
          src={`${import.meta.env.BASE_URL}assets/aistudio/1792715656850_9e02955c.jpg`}
          alt="شعار صلاتي"
          className="w-20 h-20 rounded-2xl mb-4 ring-2 ring-amber-400/50 animate-pulse object-cover"
        />
        <h1 className="text-xl font-black text-amber-300 font-tajawal">صلاتي</h1>
        <p className="text-xs text-stone-400 mt-1">جاري تحميل البيانات المحلية بأمان...</p>
      </div>
    );
  }

  // First Visit Splash Screen
  if (showSplash && !appData.isOnboarded) {
    return <SplashScreen onFinishSplash={() => setShowSplash(false)} />;
  }

  // First Launch Onboarding Flow
  if (!appData.isOnboarded) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Active Screen titles for header
  const SCREEN_TITLES: Record<ScreenId, string> = {
    dashboard: 'لوحة المتابعة اليومية',
    account: 'الملف الشخصي والحساب',
    certificates: 'شهادات إتمام القضاء',
    achievements: 'الأوسمة والإنجازات',
    challenges: 'التحديات الفردية',
    privacy: 'سياسة الخصوصية المحلية',
    about: 'عن التطبيق والمطور',
    settings: 'الإعدادات والنسخ الاحتياطي',
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 islamic-pattern transition-colors">
      {/* Sticky Main Navigation */}
      <Navbar
        onOpenMenu={() => setIsDrawerOpen(true)}
        userName={appData.profile.displayName}
        theme={appData.settings.theme}
        onToggleTheme={handleToggleTheme}
        activeScreenTitle={activeScreen !== 'dashboard' ? SCREEN_TITLES[activeScreen] : undefined}
      />

      {/* Main Drawer Menu */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeScreen={activeScreen}
        onNavigate={(screen) => setActiveScreen(screen)}
        userName={appData.profile.displayName}
        guestId={appData.profile.guestId}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-5 space-y-6">
        {/* Offline indicator if disconnected */}
        {!isOnline && (
          <div className="p-2.5 rounded-2xl bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
            <WifiOff className="w-4 h-4" />
            <span>أنت تعمل الآن في وضع عدم الاتصال (Offline) — جميع بياناتك محفوظة محلياً على جهازك.</span>
          </div>
        )}

        {/* 1. DASHBOARD SCREEN */}
        {activeScreen === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Encouraging spiritual quote */}
            <div className="bg-gradient-to-l from-emerald-900/90 via-emerald-800/90 to-emerald-900/90 border border-emerald-700/40 rounded-3xl p-4 text-white shadow-sm flex items-center gap-3">
              <Quote className="w-6 h-6 text-amber-300 shrink-0 opacity-80" />
              <p className="text-xs sm:text-sm font-amiri leading-relaxed text-amber-100">
                {dailyQuote}
              </p>
            </div>

            {/* PWA Install Banner */}
            <PWAInstallButton variant="banner" />

            {/* Semicircular Overall Progress */}
            <OverallProgress
              completionPercentage={completionPct}
              startingTotal={startingTotal}
              completedTotal={completedTotal}
              remainingTotal={remainingTotal}
              todayTarget={todaySession.target}
              todayCompleted={todaySession.completed}
              estimatedRemainingText={estimatedRemaining.formattedText}
              mostAdvancedPrayerText={mostAdvancedText}
              weekCompletions={periodStats.week}
              monthCompletions={periodStats.month}
            />

            {/* Prayer Completion Wave Chart & Visual Ring Gauge */}
            <PrayerCompletionChart
              appData={appData}
              todaySession={todaySession}
            />

            {/* Daily Session Card */}
            <DailySessionCard
              todaySession={todaySession}
              planningMode={appData.activePlan.mode}
              nextEligiblePrayer={nextEligiblePrayer}
              onContinueSession={() => {
                if (nextEligiblePrayer) {
                  handleQuickRecord(nextEligiblePrayer);
                } else {
                  const p = PRAYER_ORDER.find((pr) => (appData.remainingBalances[pr] || 0) > 0);
                  if (p) handleQuickRecord(p);
                }
              }}
              onPostponeUnfinished={handlePostponeUnfinished}
              onAdjustTodayTarget={handleAdjustTodayTarget}
            />

            {/* Five Prayer Cards with Direct 1-Click Action */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-tajawal flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span>صلوات اليوم الخمس المفروضة</span>
                </h3>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  اضغط مباشرة على الزر لقضاء صلاة واحدة فوراً
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {PRAYER_ORDER.map((p) => {
                  const isNextSeq = appData.activePlan.mode === 'sequential' && nextEligiblePrayer === p;
                  const item = todaySession.breakdown[p] || { target: 1, completed: 0, postponed: 0 };
                  return (
                    <PrayerCard
                      key={p}
                      prayer={p}
                      remainingCount={appData.remainingBalances[p] || 0}
                      completedCount={appData.completedTotals[p] || 0}
                      dailyTarget={item.target}
                      todayCompleted={item.completed}
                      onQuickRecord={handleQuickRecord}
                      onOpenCustomModal={(pr) => setRecordingPrayer(pr)}
                      isNextSequential={isNextSeq}
                    />
                  );
                })}
              </div>
            </div>

            {/* Recent Activity List with Undo */}
            <RecentActivityList
              history={appData.history}
              onUndoLastRecord={handleUndoRecord}
            />

            {/* Quick Links / Badges Teaser */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => setActiveScreen('certificates')}
                className="p-3.5 rounded-3xl bg-white dark:bg-stone-900 border border-emerald-800/20 hover:border-amber-400 transition text-right shadow-xs cursor-pointer"
              >
                <Award className="w-5 h-5 text-amber-500 mb-1" />
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">الشهادات</h4>
                <p className="text-[10px] text-stone-500">
                  {completionPct >= 100 && remainingTotal === 0
                    ? 'شهادة إتمام القضاء الرسمية ✓'
                    : 'تقرير مسار القضاء المرحلي'}
                </p>
              </button>

              <button
                onClick={() => setActiveScreen('achievements')}
                className="p-3.5 rounded-3xl bg-white dark:bg-stone-900 border border-emerald-800/20 hover:border-amber-400 transition text-right shadow-xs cursor-pointer"
              >
                <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1" />
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">الأوسمة والجوائز</h4>
                <p className="text-[10px] text-stone-500">
                  {appData.achievements.filter((a) => a.unlocked).length} من {appData.achievements.length} وسام
                </p>
              </button>

              <button
                onClick={() => setActiveScreen('challenges')}
                className="p-3.5 rounded-3xl bg-white dark:bg-stone-900 border border-emerald-800/20 hover:border-amber-400 transition text-right shadow-xs cursor-pointer col-span-2 sm:col-span-1"
              >
                <Sparkles className="w-5 h-5 text-amber-500 mb-1" />
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">التحديات الفردية</h4>
                <p className="text-[10px] text-stone-500">حفّز همتك بأهداف مخصصة</p>
              </button>
            </div>
          </div>
        )}

        {/* 2. ACCOUNT SCREEN */}
        {activeScreen === 'account' && (
          <AccountView
            appData={appData}
            onUpdateProfile={(prof) => updateAndSaveAppData({ ...appData, profile: prof })}
            onExportBackup={() => {
              const jsonStr = JSON.stringify(appData, null, 2);
              const blob = new Blob([jsonStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `نسخة_صلاتي_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            onNavigateToCertificates={() => setActiveScreen('certificates')}
            onDeleteProfile={handleResetAllData}
          />
        )}

        {/* 3. CERTIFICATES SCREEN */}
        {activeScreen === 'certificates' && (
          <CertificateGallery
            appData={appData}
            onUpdateSettings={(newSettings) =>
              updateAndSaveAppData({ ...appData, settings: newSettings })
            }
          />
        )}

        {/* 4. ACHIEVEMENTS SCREEN */}
        {activeScreen === 'achievements' && (
          <AchievementsView
            achievements={appData.achievements}
            completedTotal={completedTotal}
          />
        )}

        {/* 5. CHALLENGES SCREEN */}
        {activeScreen === 'challenges' && (
          <ChallengesView
            challenges={appData.challenges}
            onAddCustomChallenge={handleAddCustomChallenge}
          />
        )}

        {/* 6. PRIVACY POLICY SCREEN */}
        {activeScreen === 'privacy' && <PrivacyPolicyView />}

        {/* 7. ABOUT SCREEN */}
        {activeScreen === 'about' && <AboutView />}

        {/* 8. SETTINGS SCREEN */}
        {activeScreen === 'settings' && (
          <SettingsView
            appData={appData}
            onUpdateSettings={(st) => updateAndSaveAppData({ ...appData, settings: st })}
            onUpdateProfile={(pr) => updateAndSaveAppData({ ...appData, profile: pr })}
            onUpdatePlan={(pl) => updateAndSaveAppData({ ...appData, activePlan: pl })}
            onUpdateBalances={(stBalances, remBalances) =>
              updateAndSaveAppData({
                ...appData,
                startingBalances: stBalances,
                remainingBalances: remBalances,
              })
            }
            onRestoreBackup={(imported) => updateAndSaveAppData(imported)}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Floating Instant Undo Toast */}
      {toastInfo && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[90%] bg-stone-900 text-stone-100 border border-emerald-600/50 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs font-semibold truncate">{toastInfo.message}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleUndoRecord(toastInfo.record)}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>تراجع</span>
            </button>
            <button
              onClick={() => setToastInfo(null)}
              className="p-1 text-stone-400 hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Custom Recording Modal (with note/quantity selector) */}
      {recordingPrayer && (
        <RecordPrayerModal
          prayer={recordingPrayer}
          remainingCount={appData.remainingBalances[recordingPrayer] || 0}
          isOpen={!!recordingPrayer}
          onClose={() => setRecordingPrayer(null)}
          onConfirm={handleConfirmCustomRecord}
        />
      )}

      {/* Celebration Modal for newly unlocked badge */}
      {celebratingAchievement && (
        <AchievementCelebrationModal
          achievement={celebratingAchievement}
          onClose={() => setCelebratingAchievement(null)}
        />
      )}

      {/* Persistent Arabic Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-6 px-4 bg-white/50 dark:bg-stone-900/50 backdrop-blur-xs text-center text-xs text-stone-600 dark:text-stone-400 mt-auto">
        <div className="max-w-md mx-auto space-y-1">
          <p className="font-bold text-stone-900 dark:text-stone-100">
            تطبيق «صلاتي | قضاء ما في الذمة»
          </p>
          <p>تطوير أباالفضل نهاد حسن</p>
        </div>
      </footer>
    </div>
  );
}
