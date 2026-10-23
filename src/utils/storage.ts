import { AppData, UserProfile } from '../types';
import { generateCertificateId, generateGuestId, validateBackupData, calculateTotalPrayers } from './prayerLogic';
import { INITIAL_ACHIEVEMENTS } from './achievementsList';
import { getLocalTodayString } from './dateUtils';

const DB_NAME = 'salati_db';
const DB_VERSION = 2;
const STORE_NAME = 'app_state';
const STATE_KEY = 'current_app_data';
const LOCAL_STORAGE_FALLBACK_KEY = 'salati_app_data_backup';

export function getDefaultAppData(): AppData {
  const guestId = generateGuestId();
  const profile: UserProfile = {
    guestId,
    displayName: 'فاعل خير',
    nickname: '',
    createdAt: new Date().toISOString(),
  };

  const todayStr = getLocalTodayString();

  return {
    schemaVersion: 2,
    isOnboarded: false,
    profile,
    startingBalances: {
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
    },
    remainingBalances: {
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
    },
    completedTotals: {
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
    },
    history: [],
    dailySessions: {},
    activePlan: {
      mode: 'daily_total',
      dailyTotal: 5,
      distribution: {
        fajr: 1,
        dhuhr: 1,
        asr: 1,
        maghrib: 1,
        isha: 1,
      },
    },
    achievements: INITIAL_ACHIEVEMENTS,
    challenges: [
      {
        id: 'daily_5',
        type: 'daily',
        title: 'تحدي اليوم المبارك',
        description: 'إنجاز 5 صلوات قضاء خلال هذا اليوم المبارك',
        target: 5,
        completed: 0,
        startDate: todayStr,
        endDate: todayStr,
        reward: 'وسام اليوم المبارك',
        isCompleted: false,
      },
      {
        id: 'weekly_35',
        type: 'weekly',
        title: 'تحدي الأسبوع الثابت',
        description: 'إنجاز 35 صلاة قضاء خلال أسبوع متواصل',
        target: 35,
        completed: 0,
        startDate: todayStr,
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        reward: 'شارة الهمة الأسبوعية',
        isCompleted: false,
      },
    ],
    settings: {
      theme: 'light',
      includeGuestIdOnCertificate: true,
      soundEffectsEnabled: true,
      reducedMotion: false,
      notificationsEnabled: false,
    },
  };
}

// Open IndexedDB database with Promise wrapper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB غير مدعوم في هذا المتصفح'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Migrates old application data safely into current schema
 */
export function migrateAppData(data: AppData): AppData {
  const current = { ...data };

  // Normalize optional legacy collections before any migration logic reads them.
  current.history = Array.isArray(current.history) ? current.history : [];
  current.dailySessions = current.dailySessions && typeof current.dailySessions === 'object' ? current.dailySessions : {};
  current.achievements = Array.isArray(current.achievements) ? current.achievements : [];
  current.challenges = Array.isArray(current.challenges) ? current.challenges : [];
  current.profile = {
    guestId: current.profile?.guestId || generateGuestId(),
    displayName: typeof current.profile?.displayName === 'string' && current.profile.displayName.trim() ? current.profile.displayName : 'فاعل خير',
    nickname: current.profile?.nickname || '',
    createdAt: current.profile?.createdAt || new Date().toISOString(),
    completedAt: current.profile?.completedAt,
  };

  // Ensure schemaVersion is updated
  current.schemaVersion = 2;

  // Ensure settings defaults
  if (!current.settings) {
    current.settings = {
      theme: 'light',
      includeGuestIdOnCertificate: true,
      soundEffectsEnabled: true,
      reducedMotion: false,
      notificationsEnabled: false,
    };
  } else {
    current.settings = {
      theme: current.settings.theme === 'dark' || current.settings.theme === 'system' ? current.settings.theme : 'light',
      includeGuestIdOnCertificate: current.settings.includeGuestIdOnCertificate ?? true,
      soundEffectsEnabled: current.settings.soundEffectsEnabled ?? true,
      reducedMotion: current.settings.reducedMotion ?? false,
      notificationsEnabled: current.settings.notificationsEnabled ?? false,
      notificationTime: current.settings.notificationTime,
    };
  }

  // Ensure achievements contain all templates from catalog
  const existingAchMap = new Map((current.achievements || []).map((a) => [a.id, a]));
  const mergedAchievements = INITIAL_ACHIEVEMENTS.map((tpl) => {
    const existing = existingAchMap.get(tpl.id);
    if (existing) {
      return {
        ...tpl,
        progress: existing.progress ?? 0,
        unlocked: Boolean(existing.unlocked),
        unlockedAt: existing.unlockedAt,
      };
    }
    return tpl;
  });
  current.achievements = mergedAchievements;

  // Check if debt was previously fully completed without completedAt
  const startingTotal = calculateTotalPrayers(current.startingBalances);
  const remainingTotal = calculateTotalPrayers(current.remainingBalances);
  const completedTotal = calculateTotalPrayers(current.completedTotals);

  if (startingTotal > 0 && remainingTotal === 0 && completedTotal >= startingTotal) {
    if (!current.profile.completedAt) {
      // Use a real recorded completion date when available. Never invent today's date for a historical completion.
      const latestHistory = [...current.history].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
      if (latestHistory?.date) current.profile.completedAt = latestHistory.date;
    }
    if (!current.certificateId) {
      current.certificateId = generateCertificateId();
    }
  }

  return current;
}

export async function loadAppData(): Promise<AppData> {
  let loadedData: AppData | null = null;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(STATE_KEY);

    loadedData = await new Promise<AppData | null>((resolve) => {
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('تعذر القراءة من IndexedDB، جاري المحاولة من التخزين المحلي:', err);
  }

  // If not found in IndexedDB, try localStorage
  if (!loadedData && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const validated = validateBackupData(parsed);
        if (validated.valid && validated.parsed) {
          loadedData = validated.parsed;
        }
      }
    } catch (e) {
      console.warn('تعذر القراءة من localStorage:', e);
    }
  }

  if (!loadedData) {
    const freshDefault = getDefaultAppData();
    await saveAppData(freshDefault);
    return freshDefault;
  }

  // Migrate if needed
  const migrated = migrateAppData(loadedData);
  await saveAppData(migrated);
  return migrated;
}

export async function saveAppData(data: AppData): Promise<void> {
  // Mirror to LocalStorage first for high-speed redundancy
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(data));
      localStorage.setItem('salati_theme', data.settings.theme);
    } catch (e) {
      console.warn('تحذير أثناء الحفظ في localStorage:', e);
    }
  }

  // Save to IndexedDB
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(data, STATE_KEY);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('تحذير أثناء الحفظ في IndexedDB:', err);
  }
}

export function exportAppDataAsJson(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importAppDataFromJson(jsonStr: string): { success: boolean; data?: AppData; error?: string } {
  try {
    if (!jsonStr || jsonStr.trim().length === 0) {
      return { success: false, error: 'الملف المدخل فارغ تماماً.' };
    }
    if (jsonStr.length > 5 * 1024 * 1024) {
      return { success: false, error: 'حجم الملف كبير جداً (أكثر من 5 ميغابايت).' };
    }
    const parsed = JSON.parse(jsonStr);
    const result = validateBackupData(parsed);
    if (!result.valid || !result.parsed) {
      return { success: false, error: result.error || 'هيكل البيانات غير متوافق.' };
    }
    const migrated = migrateAppData(result.parsed);
    return { success: true, data: migrated };
  } catch {
    return { success: false, error: 'تعذر تحليل ملف JSON: الملف تالف أو غير صالح.' };
  }
}

export async function clearAllLocalData(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_STORAGE_FALLBACK_KEY);
      localStorage.removeItem('salati_theme');
    } catch (e) {
      console.error(e);
    }
  }
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.error(e);
  }
}
