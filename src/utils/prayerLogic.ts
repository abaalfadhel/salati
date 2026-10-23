import { PrayerBalances, PrayerRecord, PrayerType, AppData } from '../types';
import { getLocalTodayString } from './dateUtils';

export const STANDARD_RAKATS: Record<PrayerType, number> = {
  fajr: 2,
  dhuhr: 4,
  asr: 4,
  maghrib: 3,
  isha: 4,
};

export const PRAYER_NAMES: Record<PrayerType, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export const PRAYER_ORDER: PrayerType[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export function generateGuestId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let segment1 = '';
  let segment2 = '';
  for (let i = 0; i < 4; i++) {
    segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
    segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GST-${segment1}-${segment2}`;
}

export function generateCertificateId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let segment1 = '';
  let segment2 = '';
  for (let i = 0; i < 4; i++) {
    segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
    segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SLT-CERT-${segment1}-${segment2}`;
}

export function estimateBalancesFromYearsAndMonths(years: number, months: number): PrayerBalances {
  const validYears = Math.max(0, Math.floor(Number(years) || 0));
  const validMonths = Math.max(0, Math.floor(Number(months) || 0));
  const totalDays = validYears * 365 + validMonths * 30;

  return {
    fajr: totalDays,
    dhuhr: totalDays,
    asr: totalDays,
    maghrib: totalDays,
    isha: totalDays,
  };
}

export function calculateTotalPrayers(balances: PrayerBalances): number {
  if (!balances) return 0;
  return (
    (Number(balances.fajr) || 0) +
    (Number(balances.dhuhr) || 0) +
    (Number(balances.asr) || 0) +
    (Number(balances.maghrib) || 0) +
    (Number(balances.isha) || 0)
  );
}

export function calculateTotalRakats(balances: PrayerBalances): number {
  if (!balances) return 0;
  return (
    (Number(balances.fajr) || 0) * STANDARD_RAKATS.fajr +
    (Number(balances.dhuhr) || 0) * STANDARD_RAKATS.dhuhr +
    (Number(balances.asr) || 0) * STANDARD_RAKATS.asr +
    (Number(balances.maghrib) || 0) * STANDARD_RAKATS.maghrib +
    (Number(balances.isha) || 0) * STANDARD_RAKATS.isha
  );
}

export function calculateCompletionPercentage(startingTotal: number, completedTotal: number): number {
  if (!startingTotal || startingTotal <= 0) {
    return completedTotal > 0 ? 100 : 0;
  }
  const pct = (completedTotal / startingTotal) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

export function recordPrayerCompletion(
  currentRemaining: PrayerBalances,
  currentCompleted: PrayerBalances,
  prayer: PrayerType,
  quantity: number = 1,
  note?: string,
  customDate?: string
): {
  success: boolean;
  error?: string;
  newRemaining: PrayerBalances;
  newCompleted: PrayerBalances;
  record?: PrayerRecord;
} {
  const count = Math.floor(Number(quantity));
  if (count <= 0) {
    return {
      success: false,
      error: 'يجب أن يكون عدد الصلوات المسجلة واحداً على الأقل.',
      newRemaining: { ...currentRemaining },
      newCompleted: { ...currentCompleted },
    };
  }

  const remaining = currentRemaining[prayer] || 0;
  if (remaining <= 0) {
    return {
      success: false,
      error: `رصيد صلاة ${PRAYER_NAMES[prayer]} مكتمل بالكامل، لا يمكن تسجيل المزيد.`,
      newRemaining: { ...currentRemaining },
      newCompleted: { ...currentCompleted },
    };
  }

  if (count > remaining) {
    return {
      success: false,
      error: `العدد المطلوب (${count}) يتجاوز الرصيد المتبقي لصلاة ${PRAYER_NAMES[prayer]} وهو (${remaining}).`,
      newRemaining: { ...currentRemaining },
      newCompleted: { ...currentCompleted },
    };
  }

  const newRemaining: PrayerBalances = {
    ...currentRemaining,
    [prayer]: remaining - count,
  };

  const newCompleted: PrayerBalances = {
    ...currentCompleted,
    [prayer]: (currentCompleted[prayer] || 0) + count,
  };

  const todayStr = customDate || getLocalTodayString();
  const rakats = count * STANDARD_RAKATS[prayer];

  const record: PrayerRecord = {
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    prayer,
    quantity: count,
    rakats,
    date: todayStr,
    timestamp: Date.now(),
    note: note ? note.trim().slice(0, 200) : undefined,
  };

  return {
    success: true,
    newRemaining,
    newCompleted,
    record,
  };
}

export function undoPrayerCompletion(
  currentRemaining: PrayerBalances,
  currentCompleted: PrayerBalances,
  record: PrayerRecord
): {
  newRemaining: PrayerBalances;
  newCompleted: PrayerBalances;
} {
  const prayer = record.prayer;
  const count = record.quantity;

  const newRemaining: PrayerBalances = {
    ...currentRemaining,
    [prayer]: (currentRemaining[prayer] || 0) + count,
  };

  const newCompleted: PrayerBalances = {
    ...currentCompleted,
    [prayer]: Math.max(0, (currentCompleted[prayer] || 0) - count),
  };

  return {
    newRemaining,
    newCompleted,
  };
}

export function getNextSequentialPrayer(remaining: PrayerBalances): PrayerType | null {
  for (const prayer of PRAYER_ORDER) {
    if ((remaining[prayer] || 0) > 0) {
      return prayer;
    }
  }
  return null;
}

export function getArabicFormattedDate(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('ar-SA-u-ca-gregory', options);
}

export function validateBackupData(data: unknown): { valid: boolean; error?: string; parsed?: AppData } {
  const fail = (error: string) => ({ valid: false, error });
  const isObject = (value: unknown): value is Record<string, any> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
  const isNonNegativeInteger = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
  const isNonNegativeNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0;
  const isValidDate = (value: unknown): value is string => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  const prayers: PrayerType[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const validBalanceSet = (balances: unknown): balances is PrayerBalances =>
    isObject(balances) && prayers.every((prayer) => isNonNegativeInteger(balances[prayer]));

  if (!isObject(data)) return fail('الملف غير صالح أو فارغ.');
  if (!Number.isInteger(data.schemaVersion) || data.schemaVersion < 1 || data.schemaVersion > 2) {
    return fail('إصدار النسخة الاحتياطية غير مدعوم.');
  }
  if (!isObject(data.profile) || typeof data.profile.displayName !== 'string' || !data.profile.guestId) {
    return fail('بيانات الملف الشخصي في النسخة غير مكتملة.');
  }
  if (data.profile.displayName.length > 120 || String(data.profile.guestId).length > 100) {
    return fail('بيانات الملف الشخصي تتجاوز الحجم المسموح.');
  }
  if (data.profile.createdAt !== undefined && (typeof data.profile.createdAt !== 'string' || Number.isNaN(Date.parse(data.profile.createdAt)))) {
    return fail('تاريخ إنشاء الملف الشخصي غير صالح.');
  }
  if (data.profile.completedAt !== undefined && data.profile.completedAt !== null &&
      !(typeof data.profile.completedAt === 'string' && (isValidDate(data.profile.completedAt) || !Number.isNaN(Date.parse(data.profile.completedAt))))) {
    return fail('تاريخ إتمام الرصيد غير صالح.');
  }
  if (!validBalanceSet(data.startingBalances)) return fail('الأرصدة الابتدائية غير صالحة؛ يجب أن تكون أعدادًا صحيحة غير سالبة لكل صلاة.');
  if (!validBalanceSet(data.remainingBalances)) return fail('الأرصدة المتبقية غير صالحة؛ يجب أن تكون أعدادًا صحيحة غير سالبة لكل صلاة.');
  if (!validBalanceSet(data.completedTotals)) return fail('إجمالي الصلوات المنجزة غير صالح؛ يجب أن تكون أعدادًا صحيحة غير سالبة لكل صلاة.');
  if (!Array.isArray(data.history)) return fail('سجل العمليات غير صالح.');
  if (data.history.length > 250000) return fail('يحتوي سجل العمليات على عدد يتجاوز الحد المسموح.');

  const seenIds = new Set<string>();
  const sanitizedHistory: PrayerRecord[] = [];
  for (let index = 0; index < data.history.length; index++) {
    const record = data.history[index];
    if (!isObject(record)) return fail(`سجل العملية رقم ${index + 1} غير صالح.`);
    if (typeof record.id !== 'string' || !record.id.trim() || record.id.length > 160) return fail(`معرّف العملية رقم ${index + 1} غير صالح.`);
    if (seenIds.has(record.id)) return fail(`يوجد معرّف مكرر في سجل العمليات: ${record.id}.`);
    seenIds.add(record.id);
    if (!prayers.includes(record.prayer)) return fail(`نوع الصلاة في العملية رقم ${index + 1} غير معروف.`);
    if (!isNonNegativeInteger(record.quantity) || record.quantity < 1) return fail(`كمية الصلاة في العملية رقم ${index + 1} غير صالحة.`);
    if (!isNonNegativeInteger(record.rakats) || record.rakats < 1 || record.rakats !== record.quantity * STANDARD_RAKATS[record.prayer]) {
      return fail(`عدد الركعات في العملية رقم ${index + 1} لا يتوافق مع نوع الصلاة وكميتها.`);
    }
    if (!isValidDate(record.date)) return fail(`تاريخ العملية رقم ${index + 1} غير صالح.`);
    if (typeof record.timestamp !== 'number' || !Number.isFinite(record.timestamp) || record.timestamp < 0) {
      return fail(`وقت العملية رقم ${index + 1} غير صالح.`);
    }
    sanitizedHistory.push({
      id: record.id,
      prayer: record.prayer,
      quantity: record.quantity,
      rakats: record.rakats,
      date: record.date,
      timestamp: record.timestamp,
      note: typeof record.note === 'string' ? record.note.replace(/[<>]/g, '').slice(0, 200) : undefined,
    });
  }

  // Accept legacy/manual balance adjustments, but reject impossible values that would make a
  // completed amount exceed the starting balance when there is no explicit adjustment marker.
  // We intentionally do not require history totals to equal completedTotals: older app versions
  // and manual balance corrections can legitimately make those differ.
  for (const prayer of prayers) {
    if (data.remainingBalances[prayer] > data.startingBalances[prayer] + data.completedTotals[prayer]) {
      return fail(`الرصيد المتبقي لصلاة ${PRAYER_NAMES[prayer]} أكبر من مجموع الرصيد الابتدائي والمنجز؛ قد تكون النسخة تالفة.`);
    }
  }

  const settings = isObject(data.settings) ? data.settings : {};
  if (settings.theme !== undefined && !['light', 'dark', 'system'].includes(settings.theme)) return fail('سمة التطبيق في النسخة الاحتياطية غير صالحة.');
  for (const key of ['includeGuestIdOnCertificate', 'soundEffectsEnabled', 'reducedMotion', 'notificationsEnabled'] as const) {
    if (settings[key] !== undefined && typeof settings[key] !== 'boolean') return fail(`قيمة الإعداد ${key} غير صالحة.`);
  }
  if (settings.notificationTime !== undefined && settings.notificationTime !== null &&
      (typeof settings.notificationTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.notificationTime))) {
    return fail('وقت الإشعارات في النسخة الاحتياطية غير صالح.');
  }

  const validPlan = isObject(data.activePlan) &&
    ['daily_total', 'sequential', 'flexible'].includes(data.activePlan.mode) &&
    isNonNegativeInteger(data.activePlan.dailyTotal) && validBalanceSet(data.activePlan.distribution);
  if (data.activePlan !== undefined && !validPlan) return fail('إعدادات خطة القضاء في النسخة الاحتياطية غير صالحة.');
  if (data.dailySessions !== undefined && !isObject(data.dailySessions)) return fail('سجل الجلسات اليومية غير صالح.');
  if (isObject(data.dailySessions)) {
    for (const [sessionDate, session] of Object.entries(data.dailySessions)) {
      if (!isValidDate(sessionDate) || !isObject(session) || session.date !== sessionDate ||
          !isNonNegativeInteger(session.target) || !isNonNegativeInteger(session.completed) ||
          !isNonNegativeInteger(session.postponed) || !isObject(session.breakdown)) {
        return fail(`بيانات الجلسة اليومية بتاريخ ${sessionDate} غير صالحة.`);
      }
      for (const prayer of prayers) {
        const item = session.breakdown[prayer];
        if (!isObject(item) || !isNonNegativeInteger(item.target) ||
            !isNonNegativeInteger(item.completed) || !isNonNegativeInteger(item.postponed)) {
          return fail(`تفاصيل صلاة ${PRAYER_NAMES[prayer]} في جلسة ${sessionDate} غير صالحة.`);
        }
      }
    }
  }
  if (data.achievements !== undefined && !Array.isArray(data.achievements)) return fail('قائمة الإنجازات غير صالحة.');
  if (Array.isArray(data.achievements)) {
    const achievementIds = new Set<string>();
    for (const [index, achievement] of data.achievements.entries()) {
      if (!isObject(achievement) || typeof achievement.id !== 'string' || !achievement.id ||
          typeof achievement.title !== 'string' || typeof achievement.description !== 'string' ||
          typeof achievement.unlocked !== 'boolean' || !isNonNegativeNumber(achievement.progress) ||
          !isNonNegativeInteger(achievement.maxProgress)) {
        return fail(`بيانات الإنجاز رقم ${index + 1} غير صالحة.`);
      }
      if (achievementIds.has(achievement.id)) return fail(`معرّف الإنجاز ${achievement.id} مكرر.`);
      achievementIds.add(achievement.id);
      if (achievement.unlockedAt !== undefined && achievement.unlockedAt !== null &&
          (typeof achievement.unlockedAt !== 'string' || Number.isNaN(Date.parse(achievement.unlockedAt)))) {
        return fail(`تاريخ فتح الإنجاز ${achievement.title} غير صالح.`);
      }
    }
  }
  if (data.challenges !== undefined && !Array.isArray(data.challenges)) return fail('قائمة التحديات غير صالحة.');
  if (Array.isArray(data.challenges)) {
    const challengeIds = new Set<string>();
    for (const [index, challenge] of data.challenges.entries()) {
      if (!isObject(challenge) || typeof challenge.id !== 'string' || !challenge.id ||
          typeof challenge.title !== 'string' || typeof challenge.description !== 'string' ||
          !['daily', 'weekly', 'monthly', 'custom'].includes(challenge.type) ||
          !isNonNegativeInteger(challenge.target) || !isNonNegativeInteger(challenge.completed) ||
          typeof challenge.isCompleted !== 'boolean' || !isValidDate(challenge.startDate) ||
          !isValidDate(challenge.endDate) || challenge.endDate < challenge.startDate) {
        return fail(`بيانات التحدي رقم ${index + 1} غير صالحة.`);
      }
      if (challengeIds.has(challenge.id)) return fail(`معرّف التحدي ${challenge.id} مكرر.`);
      challengeIds.add(challenge.id);
    }
  }

  const sanitizedProfile = {
    guestId: String(data.profile.guestId).replace(/[^\w-]/g, '').slice(0, 30),
    displayName: data.profile.displayName.replace(/[<>]/g, '').trim().slice(0, 60),
    nickname: typeof data.profile.nickname === 'string' ? data.profile.nickname.replace(/[<>]/g, '').slice(0, 60) : undefined,
    createdAt: typeof data.profile.createdAt === 'string' ? data.profile.createdAt : new Date().toISOString(),
    completedAt: typeof data.profile.completedAt === 'string' ? data.profile.completedAt : undefined,
  };
  if (!sanitizedProfile.displayName) return fail('اسم المستخدم فارغ بعد إزالة الأحرف غير المسموحة.');

  const parsed: AppData = {
    schemaVersion: data.schemaVersion,
    isOnboarded: Boolean(data.isOnboarded),
    profile: sanitizedProfile,
    startingBalances: { ...data.startingBalances },
    remainingBalances: { ...data.remainingBalances },
    completedTotals: { ...data.completedTotals },
    history: sanitizedHistory,
    dailySessions: isObject(data.dailySessions) ? data.dailySessions : {},
    activePlan: validPlan ? data.activePlan : {
      mode: 'daily_total', dailyTotal: 5,
      distribution: { fajr: 1, dhuhr: 1, asr: 1, maghrib: 1, isha: 1 },
    },
    achievements: Array.isArray(data.achievements) ? data.achievements : [],
    challenges: Array.isArray(data.challenges) ? data.challenges : [],
    settings: {
      theme: settings.theme === 'dark' ? 'dark' : settings.theme === 'system' ? 'system' : 'light',
      includeGuestIdOnCertificate: settings.includeGuestIdOnCertificate ?? true,
      soundEffectsEnabled: settings.soundEffectsEnabled ?? true,
      reducedMotion: settings.reducedMotion ?? false,
      notificationsEnabled: settings.notificationsEnabled ?? false,
      notificationTime: typeof settings.notificationTime === 'string' ? settings.notificationTime : undefined,
    },
    certificateId: typeof data.certificateId === 'string' ? data.certificateId.slice(0, 100) : undefined,
  };
  return { valid: true, parsed };
}
