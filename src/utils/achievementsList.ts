import { Achievement, AppData, PrayerType } from '../types';
import { calculateCompletionPercentage, calculateTotalPrayers } from './prayerLogic';
import { calculateStreaks } from './dateUtils';

const ARABIC_ORDINALS = [
  '',
  'الأول',
  'الثاني',
  'الثالث',
  'الرابع',
  'الخامس',
  'السادس',
  'السابع',
  'الثامن',
  'التاسع',
  'العاشر',
  'الحادي عشر',
  'الثاني عشر',
  'الثالث عشر',
  'الرابع عشر',
  'الخامس عشر',
  'السادس عشر',
  'السابع عشر',
  'الثامن عشر',
  'التاسع عشر',
  'العشرون',
];

export function getArabicOrdinal(n: number): string {
  if (n < ARABIC_ORDINALS.length && ARABIC_ORDINALS[n]) {
    return ARABIC_ORDINALS[n];
  }
  return `رقم ${n}`;
}

// Helper to generate a tier achievement for each prayer
function createPrayerTier(
  prayer: PrayerType,
  prayerArabicName: string,
  tierCount: number,
  title: string,
  icon: string
): Achievement {
  return {
    id: `${prayer}_${tierCount}`,
    title,
    description: `إنجاز ${tierCount.toLocaleString('ar-SA')} صلاة ${prayerArabicName} من قضاء ما في الذمة.`,
    icon,
    category: prayer,
    requirement: `${tierCount} صلاة ${prayerArabicName}`,
    progress: 0,
    maxProgress: tierCount,
    unlocked: false,
  };
}

/**
 * Dynamically generates month and year achievements tailored precisely to what the user owes
 */
export function generateDynamicDurationAchievements(startingTotal: number): Achievement[] {
  const result: Achievement[] = [];
  const validTotal = Math.max(0, startingTotal);
  if (validTotal === 0) return result;

  const totalDays = Math.ceil(validTotal / 5);
  // Total months user actually owes (e.g. 6 months -> 6 month achievements)
  const totalMonths = Math.min(120, Math.max(1, Math.ceil(totalDays / 30)));
  // Total years user actually owes (e.g. 2 years -> 2 year achievements)
  const totalYears = Math.min(25, Math.floor(totalDays / 365));

  // Months achievements (each month = 150 prayers)
  for (let m = 1; m <= totalMonths; m++) {
    const target = m * 150;
    result.push({
      id: `month_${m}`,
      title: `إنجاز الشهر ${getArabicOrdinal(m)} من القضاء`,
      description: `قضاء ما يعادل شهر كامل (${target.toLocaleString('ar-SA')} صلاة) من قضاء ما في الذمة.`,
      icon: 'CalendarDays',
      category: 'month',
      requirement: `إكمال ${target.toLocaleString('ar-SA')} صلاة قضاء`,
      progress: 0,
      maxProgress: target,
      unlocked: false,
    });
  }

  // Years achievements (only for the actual years owed!)
  for (let y = 1; y <= totalYears; y++) {
    const target = y * 1825;
    result.push({
      id: `year_${y}`,
      title: `إكمال السنة ${getArabicOrdinal(y)} من الرصيد`,
      description: `قضاء ما يعادل سنة كاملة (${target.toLocaleString('ar-SA')} صلاة) من الصلوات الفائتة.`,
      icon: 'Crown',
      category: 'ten_years',
      requirement: `إكمال ${target.toLocaleString('ar-SA')} صلاة قضاء`,
      progress: 0,
      maxProgress: target,
      unlocked: false,
    });
  }

  return result;
}

export const BASE_STATIC_ACHIEVEMENTS: Achievement[] = [
  // --- سلاسل الصلوات الخمس المستقلة ---
  // الفجر
  createPrayerTier('fajr', 'الفجر', 1, 'شبل الفجر', 'Sun'),
  createPrayerTier('fajr', 'الفجر', 10, 'واعد الفجر', 'Sun'),
  createPrayerTier('fajr', 'الفجر', 25, 'مقدام الفجر', 'Sun'),
  createPrayerTier('fajr', 'الفجر', 50, 'صامد الفجر', 'Sun'),
  createPrayerTier('fajr', 'الفجر', 100, 'فارس الفجر', 'Sun'),
  createPrayerTier('fajr', 'الفجر', 250, 'حارس الفجر', 'Sun'),
  createPrayerTier('fajr', 'الفجر', 500, 'أسد الفجر', 'Sun'),
  createPrayerTier('fajr', 'الفجر', 1000, 'بطل الفجر الأكبر', 'Sun'),

  // الظهر
  createPrayerTier('dhuhr', 'الظهر', 1, 'مبادر الظهر', 'Sparkles'),
  createPrayerTier('dhuhr', 'الظهر', 10, 'منير الظهر', 'Sparkles'),
  createPrayerTier('dhuhr', 'الظهر', 25, 'ساعي الظهر', 'Sparkles'),
  createPrayerTier('dhuhr', 'الظهر', 50, 'رائد الظهر', 'Sparkles'),
  createPrayerTier('dhuhr', 'الظهر', 100, 'صقر الظهر', 'Sparkles'),
  createPrayerTier('dhuhr', 'الظهر', 250, 'فارس الظهر', 'Sparkles'),
  createPrayerTier('dhuhr', 'الظهر', 500, 'حارس الظهر', 'Sparkles'),
  createPrayerTier('dhuhr', 'الظهر', 1000, 'بطل الظهر الأكبر', 'Sparkles'),

  // العصر
  createPrayerTier('asr', 'العصر', 1, 'حريص العصر', 'ShieldCheck'),
  createPrayerTier('asr', 'العصر', 10, 'يقظ العصر', 'ShieldCheck'),
  createPrayerTier('asr', 'العصر', 25, 'مرابط العصر', 'ShieldCheck'),
  createPrayerTier('asr', 'العصر', 50, 'ثاقب العصر', 'ShieldCheck'),
  createPrayerTier('asr', 'العصر', 100, 'أسد العصر', 'ShieldCheck'),
  createPrayerTier('asr', 'العصر', 250, 'فارس العصر', 'ShieldCheck'),
  createPrayerTier('asr', 'العصر', 500, 'حامي العصر', 'ShieldCheck'),
  createPrayerTier('asr', 'العصر', 1000, 'بطل العصر الأكبر', 'ShieldCheck'),

  // المغرب
  createPrayerTier('maghrib', 'المغرب', 1, 'متأهب المغرب', 'Award'),
  createPrayerTier('maghrib', 'المغرب', 10, 'مستقيم المغرب', 'Award'),
  createPrayerTier('maghrib', 'المغرب', 25, 'وفيّ المغرب', 'Award'),
  createPrayerTier('maghrib', 'المغرب', 50, 'حارس المغرب', 'Award'),
  createPrayerTier('maghrib', 'المغرب', 100, 'فارس المغرب', 'Award'),
  createPrayerTier('maghrib', 'المغرب', 250, 'عميد المغرب', 'Award'),
  createPrayerTier('maghrib', 'المغرب', 500, 'منار المغرب', 'Award'),
  createPrayerTier('maghrib', 'المغرب', 1000, 'بطل المغرب الأكبر', 'Award'),

  // العشاء
  createPrayerTier('isha', 'العشاء', 1, 'خاشع العشاء', 'Star'),
  createPrayerTier('isha', 'العشاء', 10, 'متهجد العشاء', 'Star'),
  createPrayerTier('isha', 'العشاء', 25, 'قائم العشاء', 'Star'),
  createPrayerTier('isha', 'العشاء', 50, 'حارس العشاء', 'Star'),
  createPrayerTier('isha', 'العشاء', 100, 'فارس العشاء', 'Star'),
  createPrayerTier('isha', 'العشاء', 250, 'صنديد العشاء', 'Star'),
  createPrayerTier('isha', 'العشاء', 500, 'نور العشاء', 'Star'),
  createPrayerTier('isha', 'العشاء', 1000, 'بطل العشاء الأكبر', 'Star'),

  // --- أوسمة العدد الإجمالي والنسب المئوية ---
  {
    id: 'vol_1',
    title: 'أول صلاة قضاء',
    description: 'تسجيل أول صلاة قضاء موثقة في التطبيق.',
    icon: 'Sparkles',
    category: 'volume',
    requirement: 'صلاة قضاء واحدة',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: 'vol_10',
    title: 'بداية الهمة (10 صلوات)',
    description: 'إنجاز 10 صلوات قضاء بنجاح.',
    icon: 'Flame',
    category: 'volume',
    requirement: '10 صلوات قضاء',
    progress: 0,
    maxProgress: 10,
    unlocked: false,
  },
  {
    id: 'vol_50',
    title: 'خطى واثقة (50 صلاة)',
    description: 'إنجاز 50 صلاة قضاء موثقة.',
    icon: 'ShieldCheck',
    category: 'volume',
    requirement: '50 صلاة قضاء',
    progress: 0,
    maxProgress: 50,
    unlocked: false,
  },
  {
    id: 'vol_100',
    title: 'مئة من النور (100 صلاة)',
    description: 'إنجاز 100 صلاة قضاء.',
    icon: 'Award',
    category: 'volume',
    requirement: '100 صلاة قضاء',
    progress: 0,
    maxProgress: 100,
    unlocked: false,
  },
  {
    id: 'vol_500',
    title: 'صاحب العزم المتين (500 صلاة)',
    description: 'إنجاز 500 صلاة قضاء.',
    icon: 'Crown',
    category: 'volume',
    requirement: '500 صلاة قضاء',
    progress: 0,
    maxProgress: 500,
    unlocked: false,
  },
  {
    id: 'vol_1000',
    title: 'ألفية الوفاء (1,000 صلاة)',
    description: 'إنجاز 1,000 صلاة قضاء.',
    icon: 'Star',
    category: 'volume',
    requirement: '1,000 صلاة قضاء',
    progress: 0,
    maxProgress: 1000,
    unlocked: false,
  },
  {
    id: 'vol_5000',
    title: 'همة الجبال (5,000 صلاة)',
    description: 'إنجاز 5,000 صلاة قضاء.',
    icon: 'Medal',
    category: 'volume',
    requirement: '5,000 صلاة قضاء',
    progress: 0,
    maxProgress: 5000,
    unlocked: false,
  },
  {
    id: 'vol_10000',
    title: 'تاج القضاء (10,000 صلاة)',
    description: 'إنجاز 10,000 صلاة قضاء، مبارك هذا الثبات العظيم.',
    icon: 'Trophy',
    category: 'volume',
    requirement: '10,000 صلاة قضاء',
    progress: 0,
    maxProgress: 10000,
    unlocked: false,
  },

  // النسب المئوية من الرصيد
  {
    id: 'pct_25',
    title: 'ربع المسير (25%)',
    description: 'إنجاز ربع إجمالي الرصيد الابتدائي المسجل.',
    icon: 'TrendingUp',
    category: 'percentage',
    requirement: 'إنجاز 25% من الرصيد',
    progress: 0,
    maxProgress: 25,
    unlocked: false,
  },
  {
    id: 'pct_50',
    title: 'منتصف الطريق (50%)',
    description: 'إنجاز نصف إجمالي الرصيد الابتدائي المسجل.',
    icon: 'Compass',
    category: 'percentage',
    requirement: 'إنجاز 50% من الرصيد',
    progress: 0,
    maxProgress: 50,
    unlocked: false,
  },
  {
    id: 'pct_75',
    title: 'ثلاثة أرباع الطريق (75%)',
    description: 'إنجاز 75% من إجمالي الرصيد، والاقتراب من الختام.',
    icon: 'Medal',
    category: 'percentage',
    requirement: 'إنجاز 75% من الرصيد',
    progress: 0,
    maxProgress: 75,
    unlocked: false,
  },
  {
    id: 'pct_90',
    title: 'قارب الفرج (90%)',
    description: 'إنجاز 90% من إجمالي الرصيد، بقي القليل لبراءة الذمة.',
    icon: 'Crown',
    category: 'percentage',
    requirement: 'إنجاز 90% من الرصيد',
    progress: 0,
    maxProgress: 90,
    unlocked: false,
  },
  {
    id: 'pct_100',
    title: 'تمام البراءة وقضاء الذمة (100%)',
    description: 'إتمام كامل الصلوات الفائتة بنجاح، هنيئاً لك براءة الذمة واستحقاق الشهادة.',
    icon: 'Trophy',
    category: 'percentage',
    requirement: 'إتمام 100% من الرصيد وانعدام الباقي',
    progress: 0,
    maxProgress: 100,
    unlocked: false,
  },

  // --- أوسمة الاستمرارية (Streaks) ---
  {
    id: 'streak_1',
    title: 'يوم الانطلاق',
    description: 'تسجيل القضاء في أول يوم نشط.',
    icon: 'CalendarDays',
    category: 'streak',
    requirement: 'تسجيل صلوات في يوم نشط',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: 'streak_3',
    title: 'ثلاثية الثبات',
    description: 'المحافظة على القضاء لـ 3 أيام متتالية دون انقطاع.',
    icon: 'Flame',
    category: 'streak',
    requirement: '3 أيام متتالية',
    progress: 0,
    maxProgress: 3,
    unlocked: false,
  },
  {
    id: 'streak_7',
    title: 'أسبوع الاستقامة',
    description: 'المحافظة على القضاء لـ 7 أيام متتالية دون انقطاع.',
    icon: 'CalendarDays',
    category: 'streak',
    requirement: '7 أيام متتالية',
    progress: 0,
    maxProgress: 7,
    unlocked: false,
  },
  {
    id: 'streak_14',
    title: 'أسبوعان من الهمة',
    description: 'المحافظة على القضاء لـ 14 يوماً متتالياً.',
    icon: 'ShieldCheck',
    category: 'streak',
    requirement: '14 يوماً متتالياً',
    progress: 0,
    maxProgress: 14,
    unlocked: false,
  },
  {
    id: 'streak_30',
    title: 'شهر الصمود',
    description: 'المحافظة على القضاء لـ 30 يوماً متتالياً دون انقطاع.',
    icon: 'Award',
    category: 'streak',
    requirement: '30 يوماً متتالياً',
    progress: 0,
    maxProgress: 30,
    unlocked: false,
  },
  {
    id: 'streak_60',
    title: 'ستون يوماً من العزم',
    description: 'المحافظة على القضاء لـ 60 يوماً متتالياً.',
    icon: 'Crown',
    category: 'streak',
    requirement: '60 يوماً متتالياً',
    progress: 0,
    maxProgress: 60,
    unlocked: false,
  },
  {
    id: 'streak_100',
    title: 'مئوية الثبات',
    description: 'المحافظة على القضاء لـ 100 يوم متتالي، عزم لا يلين.',
    icon: 'Trophy',
    category: 'streak',
    requirement: '100 يوم متتالي',
    progress: 0,
    maxProgress: 100,
    unlocked: false,
  },
  {
    id: 'active_7_days',
    title: 'سبعة أيام نشطة',
    description: 'التسجيل في 7 أيام نشطة مختلفة (حتى وإن تفرقت).',
    icon: 'CalendarDays',
    category: 'streak',
    requirement: '7 أيام نشطة إجمالاً',
    progress: 0,
    maxProgress: 7,
    unlocked: false,
  },
  {
    id: 'active_30_days',
    title: 'ثلاثون يوماً نشطاً',
    description: 'التسجيل في 30 يوماً نشطاً مختلفاً.',
    icon: 'CalendarDays',
    category: 'streak',
    requirement: '30 يوماً نشطاً إجمالاً',
    progress: 0,
    maxProgress: 30,
    unlocked: false,
  },

  // --- أوسمة التحديات والالتزام ---
  {
    id: 'daily_goal_done',
    title: 'وفاء بالعهد اليومي',
    description: 'إكمال هدف اليوم بالكامل بنجاح.',
    icon: 'CheckCircle2',
    category: 'challenge',
    requirement: 'إكمال الهدف اليومي ليوم واحد',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: 'weekly_goal_done',
    title: 'بطل التحدي الأسبوعي',
    description: 'إنجاز التحدي أو الهدف الأسبوعي بنجاح.',
    icon: 'Medal',
    category: 'challenge',
    requirement: 'إكمال هدف الأسبوع (35 صلاة)',
    progress: 0,
    maxProgress: 35,
    unlocked: false,
  },
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  ...BASE_STATIC_ACHIEVEMENTS,
  // Initial default dynamic items (e.g. Month 1 and Year 1 for default starter)
  ...generateDynamicDurationAchievements(1825),
];

/**
 * Re-evaluates all achievements against the current state
 */
export function evaluateAchievements(appData: AppData): {
  updatedAchievements: Achievement[];
  newlyUnlocked: Achievement[];
} {
  const completedTotal = calculateTotalPrayers(appData.completedTotals);
  const startingTotal = calculateTotalPrayers(appData.startingBalances);
  const remainingTotal = calculateTotalPrayers(appData.remainingBalances);
  const completionPct = calculateCompletionPercentage(startingTotal, completedTotal);

  const { longestStreak, totalActiveDays } = calculateStreaks(appData.history);

  // Check if any daily session hit target
  let hasCompletedDailyGoal = false;
  for (const date in appData.dailySessions) {
    const s = appData.dailySessions[date];
    if (s.target > 0 && s.completed >= s.target) {
      hasCompletedDailyGoal = true;
      break;
    }
  }

  // Calculate past 7 days count
  let past7DaysTotal = 0;
  const now = Date.now();
  for (const h of appData.history) {
    if (now - h.timestamp <= 7 * 86400000) {
      past7DaysTotal += h.quantity;
    }
  }

  // Generate dynamic duration achievements strictly matching what the user actually owes
  const durationAchievements = generateDynamicDurationAchievements(startingTotal);
  const fullTemplateList = [...BASE_STATIC_ACHIEVEMENTS, ...durationAchievements];

  const existingMap = new Map((appData.achievements || []).map((a) => [a.id, a]));
  const mergedList: Achievement[] = fullTemplateList.map((template) => {
    const existing = existingMap.get(template.id);
    if (existing) {
      return {
        ...template,
        progress: existing.progress,
        unlocked: existing.unlocked,
        unlockedAt: existing.unlockedAt,
      };
    }
    return template;
  });

  const newlyUnlocked: Achievement[] = [];

  const updatedAchievements = mergedList.map((ach) => {
    if (ach.unlocked) return ach;

    let progress = 0;
    let unlocked = false;

    // 1. Per-prayer tiers
    const prayers: PrayerType[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (const p of prayers) {
      if (ach.id.startsWith(`${p}_`)) {
        const target = Number(ach.id.split('_')[1]);
        const val = appData.completedTotals[p] || 0;
        progress = Math.min(target, val);
        unlocked = val >= target;
        break;
      }
    }

    // 2. Month achievements (each month = 150 prayers)
    if (ach.id.startsWith('month_')) {
      const monthNum = Number(ach.id.split('_')[1]);
      const target = monthNum * 150;
      progress = Math.min(target, completedTotal);
      unlocked = completedTotal >= target;
    }

    // 3. Years achievements (each year = 1825 prayers)
    if (ach.id.startsWith('year_')) {
      const yearNum = Number(ach.id.split('_')[1]);
      const target = yearNum * 1825;
      progress = Math.min(target, completedTotal);
      unlocked = completedTotal >= target;
    }

    // 4. Volume milestones
    switch (ach.id) {
      case 'vol_1':
        progress = Math.min(1, completedTotal);
        unlocked = completedTotal >= 1;
        break;
      case 'vol_10':
        progress = Math.min(10, completedTotal);
        unlocked = completedTotal >= 10;
        break;
      case 'vol_50':
        progress = Math.min(50, completedTotal);
        unlocked = completedTotal >= 50;
        break;
      case 'vol_100':
        progress = Math.min(100, completedTotal);
        unlocked = completedTotal >= 100;
        break;
      case 'vol_500':
        progress = Math.min(500, completedTotal);
        unlocked = completedTotal >= 500;
        break;
      case 'vol_1000':
        progress = Math.min(1000, completedTotal);
        unlocked = completedTotal >= 1000;
        break;
      case 'vol_5000':
        progress = Math.min(5000, completedTotal);
        unlocked = completedTotal >= 5000;
        break;
      case 'vol_10000':
        progress = Math.min(10000, completedTotal);
        unlocked = completedTotal >= 10000;
        break;

      // Percentages
      case 'pct_25':
        progress = Math.min(25, completionPct);
        unlocked = completionPct >= 25 && startingTotal > 0;
        break;
      case 'pct_50':
        progress = Math.min(50, completionPct);
        unlocked = completionPct >= 50 && startingTotal > 0;
        break;
      case 'pct_75':
        progress = Math.min(75, completionPct);
        unlocked = completionPct >= 75 && startingTotal > 0;
        break;
      case 'pct_90':
        progress = Math.min(90, completionPct);
        unlocked = completionPct >= 90 && startingTotal > 0;
        break;
      case 'pct_100':
        progress = Math.min(100, completionPct);
        unlocked = remainingTotal === 0 && startingTotal > 0 && completedTotal >= startingTotal;
        break;

      // Streaks (Consecutive days)
      case 'streak_1':
        progress = Math.min(1, totalActiveDays);
        unlocked = totalActiveDays >= 1;
        break;
      case 'streak_3':
        progress = Math.min(3, longestStreak);
        unlocked = longestStreak >= 3;
        break;
      case 'streak_7':
        progress = Math.min(7, longestStreak);
        unlocked = longestStreak >= 7;
        break;
      case 'streak_14':
        progress = Math.min(14, longestStreak);
        unlocked = longestStreak >= 14;
        break;
      case 'streak_30':
        progress = Math.min(30, longestStreak);
        unlocked = longestStreak >= 30;
        break;
      case 'streak_60':
        progress = Math.min(60, longestStreak);
        unlocked = longestStreak >= 60;
        break;
      case 'streak_100':
        progress = Math.min(100, longestStreak);
        unlocked = longestStreak >= 100;
        break;

      // Active days
      case 'active_7_days':
        progress = Math.min(7, totalActiveDays);
        unlocked = totalActiveDays >= 7;
        break;
      case 'active_30_days':
        progress = Math.min(30, totalActiveDays);
        unlocked = totalActiveDays >= 30;
        break;

      // Challenges
      case 'daily_goal_done':
        progress = hasCompletedDailyGoal ? 1 : 0;
        unlocked = hasCompletedDailyGoal;
        break;
      case 'weekly_goal_done':
        progress = Math.min(35, past7DaysTotal);
        unlocked = past7DaysTotal >= 35;
        break;
    }

    if (unlocked && !ach.unlocked) {
      const unlockedAch: Achievement = {
        ...ach,
        progress: ach.maxProgress,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      };
      newlyUnlocked.push(unlockedAch);
      return unlockedAch;
    }

    return {
      ...ach,
      progress,
    };
  });

  return {
    updatedAchievements,
    newlyUnlocked,
  };
}

export function calculateUserLevel(completedTotal: number): {
  levelNumber: number;
  levelName: string;
  nextThreshold: number;
  progressToNext: number;
} {
  const levels = [
    { level: 1, name: 'ساعٍ مبتدئ', max: 20 },
    { level: 2, name: 'صاحب همة', max: 50 },
    { level: 3, name: 'مواظب وفيّ', max: 150 },
    { level: 4, name: 'فارس القضاء', max: 350 },
    { level: 5, name: 'صامد العزيمة', max: 700 },
    { level: 6, name: 'ثابت الخطى', max: 1500 },
    { level: 7, name: 'قريب الختام', max: 3000 },
    { level: 8, name: 'مستوفي الذمة', max: 100000 },
  ];

  let current = levels[0];
  let prevMax = 0;

  for (let i = 0; i < levels.length; i++) {
    if (completedTotal < levels[i].max) {
      current = levels[i];
      prevMax = i > 0 ? levels[i - 1].max : 0;
      break;
    }
    if (i === levels.length - 1) {
      current = levels[i];
      prevMax = levels[i - 1].max;
    }
  }

  const range = Math.max(1, current.max - prevMax);
  const inLevel = Math.max(0, completedTotal - prevMax);
  const progressToNext = Math.min(100, Math.round((inLevel / range) * 100));

  return {
    levelNumber: current.level,
    levelName: current.name,
    nextThreshold: current.max,
    progressToNext,
  };
}
