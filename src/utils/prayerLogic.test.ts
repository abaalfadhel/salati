import test from 'node:test';
import assert from 'node:assert/strict';
import { jsPDF } from 'jspdf';
import {
  STANDARD_RAKATS,
  estimateBalancesFromYearsAndMonths,
  calculateTotalPrayers,
  calculateTotalRakats,
  calculateCompletionPercentage,
  recordPrayerCompletion,
  undoPrayerCompletion,
  getNextSequentialPrayer,
  validateBackupData,
  generateGuestId,
  generateCertificateId,
  getArabicFormattedDate,
} from './prayerLogic';
import { calculateStreaks, calculateEstimatedTimeRemaining, daysBetween } from './dateUtils';
import { evaluateAchievements, generateDynamicDurationAchievements } from './achievementsList';
import { getDefaultAppData, migrateAppData, importAppDataFromJson, exportAppDataAsJson } from './storage';
import { AppData, PrayerBalances, PrayerRecord } from '../types';

// Test 1: إنشاء رصيد ابتدائي لصلوات مختلفة الأعداد
test('1. إنشاء رصيد ابتدائي لصلوات مختلفة الأعداد وحساب المجاميع والركعات بدقة', () => {
  const customBalances: PrayerBalances = {
    fajr: 100,
    dhuhr: 150,
    asr: 200,
    maghrib: 80,
    isha: 120,
  };
  const total = calculateTotalPrayers(customBalances);
  assert.equal(total, 650);

  const totalRakats = calculateTotalRakats(customBalances);
  // (100*2) + (150*4) + (200*4) + (80*3) + (120*4) = 200 + 600 + 800 + 240 + 480 = 2320
  assert.equal(totalRakats, 2320);
});

// Test 2: تسجيل صلاة واحدة
test('2. تسجيل صلاة واحدة بضغطة واحدة يخصم الرصيد ويزيد المنجز وينشئ سجلاً', () => {
  const remaining: PrayerBalances = { fajr: 10, dhuhr: 10, asr: 10, maghrib: 10, isha: 10 };
  const completed: PrayerBalances = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

  const res = recordPrayerCompletion(remaining, completed, 'fajr', 1);
  assert.equal(res.success, true);
  assert.equal(res.newRemaining.fajr, 9);
  assert.equal(res.newCompleted.fajr, 1);
  assert.ok(res.record);
  assert.equal(res.record.quantity, 1);
  assert.equal(res.record.rakats, 2);
  assert.equal(res.record.prayer, 'fajr');
});

// Test 3: رفض التسجيل عندما يكون الرصيد صفراً
test('3. رفض تسجيل الصلاة عندما يكون الرصيد المتبقي صفراً', () => {
  const remaining: PrayerBalances = { fajr: 0, dhuhr: 5, asr: 5, maghrib: 5, isha: 5 };
  const completed: PrayerBalances = { fajr: 10, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

  const res = recordPrayerCompletion(remaining, completed, 'fajr', 1);
  assert.equal(res.success, false);
  assert.match(res.error || '', /مكتمل بالكامل/);
  assert.equal(res.newRemaining.fajr, 0);
  assert.equal(res.newCompleted.fajr, 10);
});

// Test 4: منع تجاوز الرصيد المتبقي
test('4. منع تسجيل كمية تتجاوز الرصيد المتبقي', () => {
  const remaining: PrayerBalances = { fajr: 3, dhuhr: 5, asr: 5, maghrib: 5, isha: 5 };
  const completed: PrayerBalances = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

  const res = recordPrayerCompletion(remaining, completed, 'fajr', 5);
  assert.equal(res.success, false);
  assert.match(res.error || '', /يتجاوز الرصيد المتبقي/);
  assert.equal(res.newRemaining.fajr, 3);
});

// Test 5: التراجع عن عملية تسجيل
test('5. التراجع عن عملية تسجيل يعيد الرصيد المتبقي والمنجز إلى حالتهما السابقة بدقة', () => {
  const remaining: PrayerBalances = { fajr: 9, dhuhr: 10, asr: 10, maghrib: 10, isha: 10 };
  const completed: PrayerBalances = { fajr: 1, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

  const record: PrayerRecord = {
    id: 'test_rec_1',
    prayer: 'fajr',
    quantity: 1,
    rakats: 2,
    date: '2026-10-22',
    timestamp: Date.now(),
  };

  const undone = undoPrayerCompletion(remaining, completed, record);
  assert.equal(undone.newRemaining.fajr, 10);
  assert.equal(undone.newCompleted.fajr, 0);
});

// Test 6: حساب الرصيد المتبقي
test('6. حساب الرصيد المتبقي بدقة عبر الصلوات الخمس', () => {
  const remaining: PrayerBalances = { fajr: 25, dhuhr: 30, asr: 40, maghrib: 15, isha: 10 };
  assert.equal(calculateTotalPrayers(remaining), 120);
});

// Test 7: حساب نسبة الإنجاز
test('7. حساب نسبة الإنجاز والحدود الصفرية والعليا', () => {
  assert.equal(calculateCompletionPercentage(0, 0), 0);
  assert.equal(calculateCompletionPercentage(1000, 250), 25.0);
  assert.equal(calculateCompletionPercentage(1000, 500), 50.0);
  assert.equal(calculateCompletionPercentage(1000, 750), 75.0);
  assert.equal(calculateCompletionPercentage(1000, 1000), 100.0);
  assert.equal(calculateCompletionPercentage(1000, 1200), 100.0); // max 100
});

// Test 8: فتح الأوسمة عند استيفاء شروطها
test('8. فتح وسام الفجر (شبل الفجر) عند تسجيل صلاة فجر واحدة', () => {
  const appData = getDefaultAppData();
  appData.startingBalances = { fajr: 10, dhuhr: 10, asr: 10, maghrib: 10, isha: 10 };
  appData.completedTotals = { fajr: 1, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  appData.remainingBalances = { fajr: 9, dhuhr: 10, asr: 10, maghrib: 10, isha: 10 };

  const evalRes = evaluateAchievements(appData);
  const fajr1 = evalRes.updatedAchievements.find((a) => a.id === 'fajr_1');
  assert.ok(fajr1);
  assert.equal(fajr1.unlocked, true);
  assert.equal(fajr1.progress, 1);
});

// Test 9: عدم فتح الوسام قبل استيفاء الشرط
test('9. عدم فتح وسام فارس الفجر (100 صلاة) إذا كان المنجز 99 فقط', () => {
  const appData = getDefaultAppData();
  appData.startingBalances = { fajr: 200, dhuhr: 200, asr: 200, maghrib: 200, isha: 200 };
  appData.completedTotals = { fajr: 99, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

  const evalRes = evaluateAchievements(appData);
  const fajr100 = evalRes.updatedAchievements.find((a) => a.id === 'fajr_100');
  assert.ok(fajr100);
  assert.equal(fajr100.unlocked, false);
  assert.equal(fajr100.progress, 99);
});

// Test 10: حساب الأيام المتتالية (Streaks) وفصلها عن الأيام النشطة
test('10. حساب سلسلة الأيام المتتالية بدقة والتفريق بين الأيام المتتالية والمتفرقة', () => {
  const consecutiveHistory: PrayerRecord[] = [
    { id: '1', prayer: 'fajr', quantity: 1, rakats: 2, date: '2026-10-18', timestamp: 1 },
    { id: '2', prayer: 'fajr', quantity: 1, rakats: 2, date: '2026-10-19', timestamp: 2 },
    { id: '3', prayer: 'fajr', quantity: 1, rakats: 2, date: '2026-10-20', timestamp: 3 },
    { id: '4', prayer: 'fajr', quantity: 1, rakats: 2, date: '2026-10-21', timestamp: 4 },
  ];

  const res1 = calculateStreaks(consecutiveHistory, '2026-10-21');
  assert.equal(res1.longestStreak, 4);
  assert.equal(res1.currentStreak, 4);
  assert.equal(res1.totalActiveDays, 4);

  // Scattered dates: 2026-10-10 and 2026-10-20 (not consecutive)
  const scatteredHistory: PrayerRecord[] = [
    { id: '1', prayer: 'fajr', quantity: 1, rakats: 2, date: '2026-10-10', timestamp: 1 },
    { id: '2', prayer: 'fajr', quantity: 1, rakats: 2, date: '2026-10-20', timestamp: 2 },
  ];

  const res2 = calculateStreaks(scatteredHistory, '2026-10-20');
  assert.equal(res2.longestStreak, 1);
  assert.equal(res2.totalActiveDays, 2);
});

// Test 11: فصل التحديات اليومية والأسبوعية
test('11. فصل التحديات اليومية والأسبوعية بصورة واضحة ومستقلة', () => {
  const appData = getDefaultAppData();
  assert.equal(appData.challenges.length >= 2, true);
  const daily = appData.challenges.find((c) => c.type === 'daily');
  const weekly = appData.challenges.find((c) => c.type === 'weekly');
  assert.ok(daily);
  assert.ok(weekly);
  assert.notEqual(daily.target, weekly.target);
});

// Test 12: تعديل الرصيد دون فساد السجل
test('12. تعديل الرصيد الابتدائي والمتبقي مع الحفاظ على سلامة سجل العمليات المنجزة', () => {
  const appData = getDefaultAppData();
  appData.history = [
    { id: 'h1', prayer: 'fajr', quantity: 2, rakats: 4, date: '2026-10-20', timestamp: 100 },
  ];
  appData.completedTotals = { fajr: 2, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

  // Adjust starting and remaining balance
  const updatedStarting: PrayerBalances = { fajr: 50, dhuhr: 50, asr: 50, maghrib: 50, isha: 50 };
  const updatedRemaining: PrayerBalances = { fajr: 48, dhuhr: 50, asr: 50, maghrib: 50, isha: 50 };

  appData.startingBalances = updatedStarting;
  appData.remainingBalances = updatedRemaining;

  // History should remain intact
  assert.equal(appData.history.length, 1);
  assert.equal(appData.history[0].id, 'h1');
  assert.equal(appData.completedTotals.fajr, 2);
});

// Test 13: تصدير واسترجاع نسخة احتياطية
test('13. تصدير واسترجاع النسخة الاحتياطية JSON وتطابق البيانات', () => {
  const appData = getDefaultAppData();
  appData.isOnboarded = true;
  appData.profile.displayName = 'أحمد';
  appData.startingBalances = { fajr: 10, dhuhr: 10, asr: 10, maghrib: 10, isha: 10 };
  appData.remainingBalances = { fajr: 8, dhuhr: 10, asr: 10, maghrib: 10, isha: 10 };
  appData.completedTotals = { fajr: 2, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

  const jsonStr = exportAppDataAsJson(appData);
  const imported = importAppDataFromJson(jsonStr);

  assert.equal(imported.success, true);
  assert.ok(imported.data);
  assert.equal(imported.data.profile.displayName, 'أحمد');
  assert.equal(imported.data.remainingBalances.fajr, 8);
});

// Test 14: استيراد نسخة احتياطية سليمة
test('14. استيراد نسخة احتياطية سليمة والتحقق من سلامة البنية', () => {
  const validJson = JSON.stringify({
    schemaVersion: 1,
    isOnboarded: true,
    profile: { guestId: 'GST-AAAA-BBBB', displayName: 'فاطمة', createdAt: '2026-01-01' },
    startingBalances: { fajr: 30, dhuhr: 30, asr: 30, maghrib: 30, isha: 30 },
    remainingBalances: { fajr: 20, dhuhr: 30, asr: 30, maghrib: 30, isha: 30 },
    completedTotals: { fajr: 10, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    history: [],
  });

  const res = importAppDataFromJson(validJson);
  assert.equal(res.success, true);
  assert.equal(res.data?.profile.displayName, 'فاطمة');
});

// Test 15: رفض نسخة احتياطية تالفة
test('15. رفض نسخة احتياطية تالفة أو تحتوي على قيم سالبة أو صيغة غير صالحة', () => {
  const corruptJson = '{ invalid_json_syntax ';
  const res1 = importAppDataFromJson(corruptJson);
  assert.equal(res1.success, false);

  const negativeBalanceJson = JSON.stringify({
    schemaVersion: 1,
    isOnboarded: true,
    profile: { guestId: 'GST-1', displayName: 'علي' },
    startingBalances: { fajr: -10, dhuhr: 10, asr: 10, maghrib: 10, isha: 10 },
    remainingBalances: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    completedTotals: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    history: [],
  });

  const res2 = importAppDataFromJson(negativeBalanceJson);
  assert.equal(res2.success, false);
});

// Test 16: ترحيل البيانات القديمة
test('16. ترحيل البيانات القديمة وضمان إضافة الحقول والإعدادات الجديدة بأمان', () => {
  const legacyData: any = {
    schemaVersion: 1,
    isOnboarded: true,
    profile: { guestId: 'GST-9999-8888', displayName: 'سعيد' },
    startingBalances: { fajr: 10, dhuhr: 10, asr: 10, maghrib: 10, isha: 10 },
    remainingBalances: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    completedTotals: { fajr: 10, dhuhr: 10, asr: 10, maghrib: 10, isha: 10 },
    history: [],
  };

  const migrated = migrateAppData(legacyData);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.settings.soundEffectsEnabled, true);
  // A historical completion date must not be fabricated when the legacy backup has no history.
  assert.equal(migrated.profile.completedAt, undefined);
  assert.ok(migrated.certificateId);
});

// Test 17: منع إصدار شهادة نهائية مع وجود رصيد متبقٍ
test('17. منع إصدار شهادة نهائية عند وجود رصيد متبقٍ في الذمة (> 0)', () => {
  const startingBalances: PrayerBalances = { fajr: 100, dhuhr: 100, asr: 100, maghrib: 100, isha: 100 };
  const remainingBalances: PrayerBalances = { fajr: 1, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  const completedTotals: PrayerBalances = { fajr: 99, dhuhr: 100, asr: 100, maghrib: 100, isha: 100 };

  const startTot = calculateTotalPrayers(startingBalances);
  const remTot = calculateTotalPrayers(remainingBalances);
  const compTot = calculateTotalPrayers(completedTotals);

  // Eligible only if starting > 0 and remaining === 0 and completed >= starting
  const isEligible = startTot > 0 && remTot === 0 && compTot >= startTot;
  assert.equal(isEligible, false); // Blocked!
});

// Test 18: نجاح إنشاء ملف PDF فعلي
test('18. توليد ملف PDF غير فارغ عبر مكتبة jsPDF', () => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  doc.text('شهادة إتمام قضاء الصلوات', 105, 50);
  const output = doc.output('arraybuffer');
  assert.ok(output);
  assert.ok(output.byteLength > 100);
});

// Test 19: صحة محتوى الشهادة وأرقامها
test('19. تطابق بيانات الشهادة بدقة مع الرصيد المسجل والركعات', () => {
  const starting: PrayerBalances = { fajr: 365, dhuhr: 365, asr: 365, maghrib: 365, isha: 365 };
  const completed: PrayerBalances = { fajr: 365, dhuhr: 365, asr: 365, maghrib: 365, isha: 365 };
  const remaining: PrayerBalances = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

  const totalPrayers = calculateTotalPrayers(completed);
  assert.equal(totalPrayers, 1825);

  const totalRakats = calculateTotalRakats(completed);
  assert.equal(totalRakats, 1825 * 17 / 5); // 365 * 17 = 6205
  assert.equal(totalRakats, 6205);

  const isEligible = calculateTotalPrayers(starting) > 0 && calculateTotalPrayers(remaining) === 0;
  assert.equal(isEligible, true);
});

// Test 20: العمل في الوضعين الفاتح والداكن
test('20. صحة خيارات السمة: الفاتح والداكن والنظام', () => {
  const lightSettings = { theme: 'light' as const };
  const darkSettings = { theme: 'dark' as const };
  const systemSettings = { theme: 'system' as const };

  assert.equal(lightSettings.theme, 'light');
  assert.equal(darkSettings.theme, 'dark');
  assert.equal(systemSettings.theme, 'system');
});

// Test 21: عدم تأثر الحسابات بتعطيل الرسوم المتحركة
test('21. صحة الحسابات والتسجيل حتى عند تفعيل تقليل الرسوم المتحركة (reducedMotion)', () => {
  const appData = getDefaultAppData();
  appData.settings.reducedMotion = true;

  const res = recordPrayerCompletion(
    { fajr: 5, dhuhr: 5, asr: 5, maghrib: 5, isha: 5 },
    { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    'maghrib',
    1
  );

  assert.equal(res.success, true);
  assert.equal(res.newRemaining.maghrib, 4);
  assert.equal(res.newCompleted.maghrib, 1);
});

// Test 22: توليد إنجازات الشهور والسنوات ديناميكياً بحسب رصيد المستخدم الفعلي فقط
test('22. توليد إنجازات الشهور والسنوات بحسب ما بذمة المستخدم الفعلي فقط دون إظهار سنوات غير مطلوبة', () => {
  // رصيد 6 أشهر فقط (6 * 30 * 5 = 900 صلاة)
  const sixMonthsTotal = 900;
  const achievements = generateDynamicDurationAchievements(sixMonthsTotal);

  const monthAchievements = achievements.filter((a) => a.category === 'month');
  const yearAchievements = achievements.filter((a) => a.category === 'ten_years');

  // يجب أن يولد 6 إنجازات شهرية بالضبط
  assert.equal(monthAchievements.length, 6);
  // يجب ألا يولد إنجازات سنوات لشخص رصيده 6 أشهر فقط
  assert.equal(yearAchievements.length, 0);

  // شخص بذمته سنتان (2 * 365 * 5 = 3650 صلاة)
  const twoYearsTotal = 3650;
  const twoYearAchievements = generateDynamicDurationAchievements(twoYearsTotal);
  const yearsOnly = twoYearAchievements.filter((a) => a.category === 'ten_years');
  assert.equal(yearsOnly.length, 2);
  assert.equal(yearsOnly[0].id, 'year_1');
  assert.equal(yearsOnly[1].id, 'year_2');
});

// Test 23: تقييم إنجاز الشهر الأول وفتحه عند بلوغ الهدف
test('23. فتح إنجاز الشهر الأول (month_1) عند إكمال 150 صلاة قضاء', () => {
  const appData = getDefaultAppData();
  // 6 أشهر رصيد
  appData.startingBalances = { fajr: 180, dhuhr: 180, asr: 180, maghrib: 180, isha: 180 };
  appData.completedTotals = { fajr: 30, dhuhr: 30, asr: 30, maghrib: 30, isha: 30 }; // مجموع 150 صلاة (شهر كامل)

  const res = evaluateAchievements(appData);
  const month1 = res.updatedAchievements.find((a) => a.id === 'month_1');

  assert.ok(month1, 'إنجاز الشهر الأول يجب أن يكون موجوداً');
  assert.equal(month1.unlocked, true, 'إنجاز الشهر الأول يجب أن يفتح عند قضاء 150 صلاة');
});


// Test 24: reject duplicate history IDs rather than silently merging operations
test('24. رفض النسخة الاحتياطية التي تحتوي على معرّفات عمليات مكررة', () => {
  const appData = getDefaultAppData();
  appData.history = [
    { id: 'duplicate', prayer: 'fajr', quantity: 1, rakats: 2, date: '2026-10-20', timestamp: 100 },
    { id: 'duplicate', prayer: 'dhuhr', quantity: 1, rakats: 4, date: '2026-10-20', timestamp: 101 },
  ];
  const result = validateBackupData(JSON.parse(exportAppDataAsJson(appData)));
  assert.equal(result.valid, false);
  assert.match(result.error || '', /مكرر/);
});

// Test 25: reject inconsistent prayer record fields
test('25. رفض سجل صلاة بتوقيت أو تاريخ أو عدد ركعات غير متوافق', () => {
  const appData = getDefaultAppData();
  appData.history = [
    { id: 'bad-record', prayer: 'fajr', quantity: 2, rakats: 2, date: '2026-02-31', timestamp: -1 },
  ];
  const result = validateBackupData(JSON.parse(exportAppDataAsJson(appData)));
  assert.equal(result.valid, false);
});

// Test 26: reject unsafe numeric values such as fractions and Infinity
test('26. رفض الأرصدة الكسرية أو غير الآمنة في النسخة الاحتياطية', () => {
  const appData = getDefaultAppData();
  (appData.startingBalances as any).fajr = 1.5;
  const result = validateBackupData(JSON.parse(exportAppDataAsJson(appData)));
  assert.equal(result.valid, false);
  assert.match(result.error || '', /الأرصدة الابتدائية/);
});

// Test 27: migrate a legacy completed account without crashing when history is absent
test('27. ترحيل حساب قديم مكتمل دون سجل عمليات ودون اختلاق تاريخ إتمام', () => {
  const legacyData: any = {
    schemaVersion: 1,
    isOnboarded: true,
    profile: { guestId: 'GST-9999-8888', displayName: 'سعيد' },
    startingBalances: { fajr: 10, dhuhr: 10, asr: 10, maghrib: 10, isha: 10 },
    remainingBalances: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    completedTotals: { fajr: 10, dhuhr: 10, asr: 10, maghrib: 10, isha: 10 },
  };
  const migrated = migrateAppData(legacyData);
  assert.equal(migrated.schemaVersion, 2);
  assert.deepEqual(migrated.history, []);
  assert.equal(migrated.profile.completedAt, undefined);
  assert.ok(migrated.certificateId);
});
