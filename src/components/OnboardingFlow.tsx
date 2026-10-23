import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  Layers,
  ListOrdered,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { DailyPlan, PlanningMode, PrayerBalances, PrayerType, UserProfile } from '../types';
import {
  calculateTotalPrayers,
  calculateTotalRakats,
  estimateBalancesFromYearsAndMonths,
  generateGuestId,
  PRAYER_NAMES,
  STANDARD_RAKATS,
} from '../utils/prayerLogic';
import { calculateEstimatedTimeRemaining } from '../utils/dateUtils';

interface Props {
  onComplete: (data: {
    profile: UserProfile;
    startingBalances: PrayerBalances;
    activePlan: DailyPlan;
  }) => void;
}

type OnboardingStep = 'welcome' | 'profile' | 'estimate' | 'plan' | 'review';

export const OnboardingFlow: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState<OnboardingStep>('welcome');

  // Profile state
  const [guestId] = useState<string>(() => generateGuestId());
  const [displayName, setDisplayName] = useState('');
  const [nameError, setNameError] = useState('');

  // Estimate state
  const [estimateMode, setEstimateMode] = useState<'years_months' | 'manual'>('years_months');
  const [years, setYears] = useState(1);
  const [months, setMonths] = useState(0);
  const [customBalances, setCustomBalances] = useState<PrayerBalances>({
    fajr: 365,
    dhuhr: 365,
    asr: 365,
    maghrib: 365,
    isha: 365,
  });

  // Daily Plan state
  const [planningMode, setPlanningMode] = useState<PlanningMode>('daily_total');
  const [dailyTotalTarget, setDailyTotalTarget] = useState(5);
  const [dailyDistribution, setDailyDistribution] = useState<Record<PrayerType, number>>({
    fajr: 1,
    dhuhr: 1,
    asr: 1,
    maghrib: 1,
    isha: 1,
  });

  // Calculate current effective starting balances
  const effectiveBalances: PrayerBalances =
    estimateMode === 'years_months'
      ? estimateBalancesFromYearsAndMonths(years, months)
      : customBalances;

  const totalPrayers = calculateTotalPrayers(effectiveBalances);
  const totalRakats = calculateTotalRakats(effectiveBalances);

  // Sync custom balances when switching to manual or changing years/months
  const handleYearsMonthsChange = (newYears: number, newMonths: number) => {
    setYears(newYears);
    setMonths(newMonths);
    const calculated = estimateBalancesFromYearsAndMonths(newYears, newMonths);
    setCustomBalances(calculated);
  };

  const handleCustomBalanceChange = (prayer: PrayerType, value: number) => {
    setCustomBalances((prev) => ({
      ...prev,
      [prayer]: Math.max(0, Math.floor(value || 0)),
    }));
  };

  const handleDistributionChange = (prayer: PrayerType, value: number) => {
    const valid = Math.max(0, Math.floor(value || 0));
    const nextDist = { ...dailyDistribution, [prayer]: valid };
    setDailyDistribution(nextDist);
    if (planningMode === 'flexible') {
      const sum = (Object.keys(nextDist) as PrayerType[]).reduce(
        (acc, p) => acc + (nextDist[p] || 0),
        0
      );
      setDailyTotalTarget(sum);
    }
  };

  const handleComplete = () => {
    const profile: UserProfile = {
      guestId,
      displayName: displayName.trim() || 'فاعل خير',
      createdAt: new Date().toISOString(),
    };

    const activePlan: DailyPlan = {
      mode: planningMode,
      dailyTotal:
        planningMode === 'flexible'
          ? (Object.keys(dailyDistribution) as PrayerType[]).reduce(
              (acc, p) => acc + (dailyDistribution[p] || 0),
              0
            )
          : dailyTotalTarget,
      distribution: dailyDistribution,
    };

    onComplete({
      profile,
      startingBalances: effectiveBalances,
      activePlan,
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col justify-between islamic-pattern py-6 px-4">
      <div className="max-w-lg mx-auto w-full">
        {/* Step Indicator */}
        {step !== 'welcome' && (
          <div className="mb-6 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-bold text-emerald-800 dark:text-emerald-400">
              خطوة {step === 'profile' ? '1' : step === 'estimate' ? '2' : step === 'plan' ? '3' : '4'} من 4
            </span>
            <div className="flex gap-1.5">
              {(['profile', 'estimate', 'plan', 'review'] as OnboardingStep[]).map((s, idx) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    step === s
                      ? 'w-6 bg-amber-400'
                      : ['profile', 'estimate', 'plan', 'review'].indexOf(step) >= idx
                      ? 'w-3 bg-emerald-600'
                      : 'w-3 bg-stone-300 dark:bg-stone-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* SCREEN A: Welcome */}
        {step === 'welcome' && (
          <div className="text-center py-4 flex flex-col items-center">
            <div className="relative mb-6">
              <div className="absolute -inset-3 bg-amber-400/20 rounded-3xl blur-lg" />
              <img
                src={`${import.meta.env.BASE_URL}assets/aistudio/1792715656850_9e02955c.jpg`}
                alt="شعار صلاتي"
                className="w-28 h-28 rounded-3xl object-cover relative ring-4 ring-amber-400/70 shadow-xl"
              />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-3 border border-emerald-300 dark:border-emerald-800">
              <Sparkles className="w-3.5 h-3.5" />
              <span>أهلاً بك في تطبيق صلاتي</span>
            </span>

            <h1 className="text-3xl font-black text-emerald-900 dark:text-amber-300 mb-1 font-tajawal">
              صلاتي | قضاء ما في الذمة
            </h1>
            <p className="text-sm font-semibold text-stone-600 dark:text-stone-300 mb-6">
              تطبيق شخصي آمن ومحفز لإبراء الذمة وتنظيم قضاء الصلوات
            </p>

            <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 rounded-2xl p-5 shadow-sm text-right space-y-3.5 text-xs text-stone-700 dark:text-stone-200 mb-8 w-full">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100">خصوصية مطلقة ومحلية</h4>
                  <p className="text-stone-500 dark:text-stone-400">
                    بياناتك وسجلاتك مخزنة فقط على هذا الجهاز، بدون خوادم خارجية وبدون أي إعلانات أو متتبعات.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100">حساب دقيق ومرن</h4>
                  <p className="text-stone-500 dark:text-stone-400">
                    تقدير سهل بالسنوات والشهور مع حرية التعديل اليدوي التام لكل صلاة وعدد الركعات المقابل.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100">تحفيز مستمر وشهادات</h4>
                  <p className="text-stone-500 dark:text-stone-400">
                    أهداف يومية، أوسمة إنجاز، وشهادة إتمام قابلة للتصدير والطباعة عند تصفير رصيد ذمتك.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('profile')}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-800 text-amber-200 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-amber-400/30"
            >
              <span>ابدأ الآن</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SCREEN B: Guest profile */}
        {step === 'profile' && (
          <div className="py-2">
            <h2 className="text-xl font-black text-emerald-900 dark:text-amber-300 mb-1">
              ملفك الشخصي المحلي
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-6">
              يعمل التطبيق بمعرف محلي آمن دون الحاجة لكلمة مرور، رقم هاتف، أو بريد إلكتروني.
            </p>

            <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 rounded-2xl p-5 shadow-sm space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1.5">
                  الاسم الثلاثي الكامل (بدون ألقاب) *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder="مثال: عبد الله أحمد المنصور"
                  maxLength={60}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-white"
                />
                {nameError ? (
                  <p className="text-[11px] text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{nameError}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-stone-500 mt-1">
                    يرجى كتابة الاسم الثلاثي كاملاً بدون ألقاب تفخيم (سيُدرج في الشهادة الرسمية الموثقة).
                  </p>
                )}
              </div>

              {/* Guest ID Box */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    معرف الضيف المحلي (Guest ID):
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400" dir="ltr">
                    {guestId}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                  هذا المعرف مولّد ومخزن محلياً على جهازك لربط بياناتك. لا يُعد حساباً سحابياً.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('welcome')}
                className="py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>رجوع</span>
              </button>
              <button
                onClick={() => {
                  const trimmed = displayName.trim();
                  if (!trimmed) {
                    setNameError('يرجى إدخال الاسم الثلاثي الكامل للمتابعة.');
                    return;
                  }
                  const parts = trimmed.split(/\s+/).filter(Boolean);
                  if (parts.length < 2) {
                    setNameError('يرجى كتابة الاسم الثلاثي كاملاً (الاسم، واسم الأب، واسم العائلة).');
                    return;
                  }
                  setStep('estimate');
                }}
                className="flex-1 py-3 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>متابعة لتقدير الصلوات</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN C: Estimate missed prayers */}
        {step === 'estimate' && (
          <div className="py-2">
            <h2 className="text-xl font-black text-emerald-900 dark:text-amber-300 mb-1">
              تقدير رصيد الصلوات الفائتة
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-4">
              حدد رصيدك الابتدائي للصلوات الفائتة. يمكنك التقدير بالسنوات والشهور أو إدخال الأعداد يدوياً.
            </p>

            {/* Disclaimer box */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 mb-5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-bold">تنويه شرعي وحسابي:</span> هذه الأرقام تقديرية حسابية (بناءً على 365 يوماً في السنة و 30 يوماً في الشهر) وليست فتوى دينية. يمكنك تعديل أعداد أي صلاة بدقة في الأسفل قبل التأكيد.
              </p>
            </div>

            {/* Tabs for estimate mode */}
            <div className="flex rounded-xl bg-stone-200 dark:bg-stone-800 p-1 mb-5">
              <button
                onClick={() => setEstimateMode('years_months')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  estimateMode === 'years_months'
                    ? 'bg-white dark:bg-stone-700 text-emerald-900 dark:text-amber-300 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                تقدير بالسنوات والشهور
              </button>
              <button
                onClick={() => {
                  setEstimateMode('manual');
                  setCustomBalances(estimateBalancesFromYearsAndMonths(years, months));
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  estimateMode === 'manual'
                    ? 'bg-white dark:bg-stone-700 text-emerald-900 dark:text-amber-300 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                إدخال يدوي لكل صلاة
              </button>
            </div>

            {/* Years & Months Mode */}
            {estimateMode === 'years_months' && (
              <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 rounded-2xl p-5 shadow-sm space-y-4 mb-5">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span>عدد السنوات:</span>
                    <span className="text-emerald-700 dark:text-amber-300">{years} سنة ({years * 365} يوم)</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={years}
                    onChange={(e) => handleYearsMonthsChange(Number(e.target.value), months)}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>0 سنوات</span>
                    <span>5 سنوات</span>
                    <span>10 سنوات</span>
                    <span>20 سنة</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span>عدد الشهور الإضافية:</span>
                    <span className="text-emerald-700 dark:text-amber-300">{months} شهر ({months * 30} يوم)</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={11}
                    value={months}
                    onChange={(e) => handleYearsMonthsChange(years, Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>0 شهور</span>
                    <span>6 شهور</span>
                    <span>11 شهراً</span>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Prayer Balances Table */}
            <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 rounded-2xl p-4 shadow-sm mb-5">
              <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 mb-3 flex items-center justify-between">
                <span>توزيع الصلوات الخمس والركعات المقابلة:</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {estimateMode === 'manual' ? 'قابل للتعديل المباشر' : 'تلقائي حسب الأيام'}
                </span>
              </h3>

              <div className="space-y-2.5">
                {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerType[]).map((p) => {
                  const count = effectiveBalances[p] || 0;
                  const rakats = count * STANDARD_RAKATS[p];
                  return (
                    <div
                      key={p}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          {PRAYER_NAMES[p]}
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400">
                          ({STANDARD_RAKATS[p]} ركعات)
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {estimateMode === 'manual' ? (
                          <input
                            type="number"
                            min={0}
                            value={count}
                            onChange={(e) => handleCustomBalanceChange(p, Number(e.target.value))}
                            className="w-24 px-2 py-1 text-center rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-xs font-bold"
                          />
                        ) : (
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            {count.toLocaleString('ar-SA')} صلاة
                          </span>
                        )}
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-mono w-16 text-left" dir="ltr">
                          {rakats.toLocaleString()} ركعة
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals Summary */}
              <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-700 flex justify-between text-xs font-bold text-stone-900 dark:text-stone-100">
                <span>المجموع الكلي المقدر:</span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {totalPrayers.toLocaleString('ar-SA')} صلاة
                  </span>
                  <span>•</span>
                  <span className="text-amber-600 dark:text-amber-300">
                    {totalRakats.toLocaleString('ar-SA')} ركعة تقريبية
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('profile')}
                className="py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>رجوع</span>
              </button>
              <button
                onClick={() => setStep('plan')}
                className="flex-1 py-3 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>متابعة لاختيار الخطة اليومية</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN D: Daily plan */}
        {step === 'plan' && (
          <div className="py-2">
            <h2 className="text-xl font-black text-emerald-900 dark:text-amber-300 mb-1">
              اختر خطة القضاء اليومية
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-5">
              كيف تفضل توزيع وإنجاز صلواتك الفائتة كل يوم؟ اختر من بين 3 طرق عملية:
            </p>

            <div className="space-y-3 mb-6">
              {/* Mode 1: Daily Total */}
              <div
                onClick={() => setPlanningMode('daily_total')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer text-right ${
                  planningMode === 'daily_total'
                    ? 'border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      planningMode === 'daily_total'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      الطريقة الأولى: الهدف الإجمالي اليومي
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      تحديد عدد إجمالي يومي (مثلاً 5 صلوات) وتوزيعه بالتساوي أو كيفما تشاء.
                    </p>
                  </div>
                </div>

                {planningMode === 'daily_total' && (
                  <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/50">
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span>الهدف الإجمالي اليومي:</span>
                      <span className="text-emerald-700 dark:text-amber-300">{dailyTotalTarget} صلوات يومياً</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 3, 5, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setDailyTotalTarget(num)}
                          className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
                            dailyTotalTarget === num
                              ? 'bg-emerald-800 text-amber-200 shadow'
                              : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {num} صلوات
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mode 2: Sequential Order */}
              <div
                onClick={() => setPlanningMode('sequential')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer text-right ${
                  planningMode === 'sequential'
                    ? 'border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      planningMode === 'sequential'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    <ListOrdered className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      الطريقة الثانية: الإنجاز التتابعي بالترتيب
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      إنجاز الصلوات بالترتيب الشرعي (فجر، ظهر، عصر، مغرب، عشاء) تلقائياً واحدة تلو الأخرى.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mode 3: Flexible Distribution */}
              <div
                onClick={() => setPlanningMode('flexible')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer text-right ${
                  planningMode === 'flexible'
                    ? 'border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      planningMode === 'flexible'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      الطريقة الثالثة: التوزيع المرن المستقل
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      تحديد هدف يومي مستقل ومحدد لكل صلاة (مثال: 3 فجر، 2 ظهر، 2 عصر، 1 مغرب، 2 عشاء).
                    </p>
                  </div>
                </div>

                {planningMode === 'flexible' && (
                  <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/50 space-y-2">
                    {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerType[]).map((p) => (
                      <div key={p} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-800 dark:text-stone-200">
                          هدف صلاة {PRAYER_NAMES[p]}:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDistributionChange(p, Math.max(0, dailyDistribution[p] - 1))}
                            className="w-7 h-7 rounded-lg bg-stone-200 dark:bg-stone-700 text-sm font-bold flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-emerald-800 dark:text-amber-300">
                            {dailyDistribution[p]}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDistributionChange(p, dailyDistribution[p] + 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-800 text-white text-sm font-bold flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('estimate')}
                className="py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>رجوع</span>
              </button>
              <button
                onClick={() => setStep('review')}
                className="flex-1 py-3 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>مراجعة وتأكيد الخطة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN REVIEW: Confirmation */}
        {step === 'review' && (
          <div className="py-2">
            <h2 className="text-xl font-black text-emerald-900 dark:text-amber-300 mb-1">
              مراجعة وتأكيد البدء
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-5">
              راجع خياراتك وبياناتك قبل حفظها محلياً على جهازك والانتقال للوحة المتابعة.
            </p>

            <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 rounded-2xl p-5 shadow-sm space-y-4 mb-6">
              {/* Profile review */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <span className="text-xs text-stone-500 dark:text-stone-400 block">الملف الشخصي:</span>
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {displayName || 'فاعل خير'}
                  </span>
                </div>
                <span className="font-mono text-xs text-amber-700 dark:text-amber-400" dir="ltr">
                  {guestId}
                </span>
              </div>

              {/* Total Balance review */}
              <div className="pb-3 border-b border-stone-200 dark:border-stone-800">
                <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">
                  إجمالي الرصيد الابتدائي المقيد:
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-800 dark:text-amber-300">
                    {totalPrayers.toLocaleString('ar-SA')}
                  </span>
                  <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">صلاة قضاء</span>
                  <span className="text-xs text-stone-400">
                    (ما يقارب {totalRakats.toLocaleString('ar-SA')} ركعة)
                  </span>
                </div>
              </div>

              {/* Plan Mode review */}
              <div className="pb-3 border-b border-stone-200 dark:border-stone-800">
                <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">
                  الخطة اليومية المختارة:
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    {planningMode === 'daily_total'
                      ? 'الهدف الإجمالي اليومي'
                      : planningMode === 'sequential'
                      ? 'الإنجاز التتابعي بالترتيب'
                      : 'التوزيع المرن المستقل'}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {planningMode === 'flexible'
                      ? `${(Object.keys(dailyDistribution) as PrayerType[]).reduce(
                          (acc, p) => acc + (dailyDistribution[p] || 0),
                          0
                        )} صلاة يومياً`
                      : `${dailyTotalTarget} صلوات يومياً`}
                  </span>
                </div>
              </div>

              {/* Estimated Completion Duration */}
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">
                  المدة التقديرية المتوقعة للإنجاز:
                </span>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  {calculateEstimatedTimeRemaining(
                    totalPrayers,
                    planningMode === 'flexible'
                      ? (Object.keys(dailyDistribution) as PrayerType[]).reduce(
                          (acc, p) => acc + (dailyDistribution[p] || 0),
                          0
                        ) || 1
                      : dailyTotalTarget || 1
                  ).formattedText}
                </p>
                <p className="text-[10px] text-stone-400 mt-1">
                  * هذه المدة تقديرية مبنية على التزامك بالهدف اليومي وتتغير تلقائياً بتغير معدل إنجازك.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('plan')}
                className="py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>تعديل</span>
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-amber-200 font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-amber-400/30"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>توكلت على الله • ابدأ الآن</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer credit */}
      <footer className="text-center pt-6 text-[11px] text-stone-500 dark:text-stone-500">
        © صلاتي | قضاء ما في الذمة • تطوير أباالفضل نهاد حسن
      </footer>
    </div>
  );
};
