import React, { useRef, useState } from 'react';
import {
  Settings,
  Moon,
  Sun,
  User,
  Sliders,
  Bell,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Check,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { AppData, AppSettings, DailyPlan, PlanningMode, PrayerBalances, PrayerType, UserProfile } from '../types';
import { importAppDataFromJson, exportAppDataAsJson } from '../utils/storage';
import { PRAYER_NAMES } from '../utils/prayerLogic';

interface Props {
  appData: AppData;
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdatePlan: (plan: DailyPlan) => void;
  onUpdateBalances: (starting: PrayerBalances, remaining: PrayerBalances) => void;
  onRestoreBackup: (importedData: AppData) => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<Props> = ({
  appData,
  onUpdateSettings,
  onUpdateProfile,
  onUpdatePlan,
  onUpdateBalances,
  onRestoreBackup,
  onResetAllData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form states
  const [nameInput, setNameInput] = useState(appData.profile.displayName);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Balances adjustment modal
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [editRemaining, setEditRemaining] = useState<PrayerBalances>({ ...appData.remainingBalances });
  const [editStarting, setEditStarting] = useState<PrayerBalances>({ ...appData.startingBalances });

  // Plan adjustment
  const [planMode, setPlanMode] = useState<PlanningMode>(appData.activePlan.mode);
  const [planTotal, setPlanTotal] = useState(appData.activePlan.dailyTotal);
  const [planDistribution, setPlanDistribution] = useState<Record<PrayerType, number>>({
    ...appData.activePlan.distribution,
  });
  const [planSuccess, setPlanSuccess] = useState(false);

  // Backup Import preview modal
  const [importCandidate, setImportCandidate] = useState<AppData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Web Notifications support check
  const isNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...appData.profile,
      displayName: nameInput.trim() || 'فاعل خير',
      nickname: undefined,
    });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 2500);
  };

  const handleSavePlan = () => {
    const finalTotal =
      planMode === 'flexible'
        ? (Object.keys(planDistribution) as PrayerType[]).reduce(
            (acc, p) => acc + (planDistribution[p] || 0),
            0
          )
        : planTotal;

    onUpdatePlan({
      mode: planMode,
      dailyTotal: finalTotal,
      distribution: planDistribution,
    });
    setPlanSuccess(true);
    setTimeout(() => setPlanSuccess(false), 2500);
  };

  const handleSaveBalances = () => {
    onUpdateBalances(editStarting, editRemaining);
    setShowBalanceModal(false);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importAppDataFromJson(content);
      if (res.success && res.data) {
        setImportCandidate(res.data);
        setImportError(null);
      } else {
        setImportError(res.error || 'تعذر استيراد الملف');
        setImportCandidate(null);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = () => {
    if (importCandidate) {
      onRestoreBackup(importCandidate);
      setImportCandidate(null);
    }
  };

  const handleExportDownload = () => {
    const jsonStr = exportAppDataAsJson(appData);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `نسخة_صلاتي_الاحتياطية_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRequestNotification = async () => {
    if (!isNotificationSupported) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        onUpdateSettings({ ...appData.settings, notificationsEnabled: true });
        new Notification('صلاتي | قضاء ما في الذمة', {
          body: 'تم تفعيل التنبيهات بنجاح. سنذكرك بموعد قضاء صلواتك.',
          icon: `${import.meta.env.BASE_URL}assets/aistudio/1792715656850_9e02955c.jpg`,
        });
      } else {
        onUpdateSettings({ ...appData.settings, notificationsEnabled: false });
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
    }
  };

  return (
    <div className="space-y-6 text-stone-900 dark:text-stone-100">
      {/* Settings Header */}
      <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-tajawal">إعدادات التطبيق</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              تخصيص الخطة، المظهر، الأرصدة، وإدارة النسخ الاحتياطية
            </p>
          </div>
        </div>
      </div>

      {/* 1. Theme & Accessibility Settings */}
      <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
            المظهر والسمة البصرية
          </h3>
          <p className="text-[11px] text-stone-500">اختر السمة المريحة لعينيك أثناء الاستخدام اليومي</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            onClick={() => onUpdateSettings({ ...appData.settings, theme: 'light' })}
            className={`p-2.5 rounded-2xl border flex items-center justify-center gap-1.5 font-bold transition cursor-pointer ${
              appData.settings.theme === 'light'
                ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 shadow-xs'
                : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500 shrink-0" />
            <span>فاتح</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ ...appData.settings, theme: 'dark' })}
            className={`p-2.5 rounded-2xl border flex items-center justify-center gap-1.5 font-bold transition cursor-pointer ${
              appData.settings.theme === 'dark'
                ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 shadow-xs'
                : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
            }`}
          >
            <Moon className="w-4 h-4 text-amber-400 shrink-0" />
            <span>داكن</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ ...appData.settings, theme: 'system' })}
            className={`p-2.5 rounded-2xl border flex items-center justify-center gap-1.5 font-bold transition cursor-pointer ${
              appData.settings.theme === 'system'
                ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 shadow-xs'
                : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>تلقائي (النظام)</span>
          </button>
        </div>

        {/* Sensory: Sound & Motion */}
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 cursor-pointer">
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              المؤثرات الصوتية والاحتفالية:
            </span>
            <input
              type="checkbox"
              checked={appData.settings.soundEffectsEnabled}
              onChange={(e) =>
                onUpdateSettings({ ...appData.settings, soundEffectsEnabled: e.target.checked })
              }
              className="w-4 h-4 accent-emerald-700 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 cursor-pointer">
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              تقليل الرسوم المتحركة (Reduced Motion):
            </span>
            <input
              type="checkbox"
              checked={appData.settings.reducedMotion}
              onChange={(e) =>
                onUpdateSettings({ ...appData.settings, reducedMotion: e.target.checked })
              }
              className="w-4 h-4 accent-emerald-700 rounded"
            />
          </label>
        </div>
      </div>

      {/* 2. Display Name Setting */}
      <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200">
          الاسم الثلاثي الكامل الموثق
        </h3>
        <p className="text-[11px] text-stone-500">يظهر هذا الاسم في شهادة إتمام القضاء الرسمية والوثائق المعتمدة</p>
        <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
          <div>
            <label className="block text-stone-600 dark:text-stone-400 mb-1">الاسم الثلاثي الكامل (بدون لقب):</label>
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="مثال: عبد الله أحمد المنصور"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 font-bold text-xs shadow-xs transition cursor-pointer"
            >
              حفظ بيانات الاسم
            </button>
            {profileSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> تم الحفظ
              </span>
            )}
          </div>
        </form>
      </div>

      {/* 3. Daily Plan & Mode Setting */}
      <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200">
            تعديل نمط وخطة القضاء اليومية
          </h3>
          <span className="text-[10px] text-stone-400">يحفظ الصلوات المنجزة السابقة</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {[
            { id: 'daily_total', label: 'الهدف الإجمالي اليومي' },
            { id: 'sequential', label: 'الإنجاز التتابعي بالترتيب' },
            { id: 'flexible', label: 'التوزيع المرن المستقل' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setPlanMode(m.id as PlanningMode)}
              className={`p-3 rounded-2xl border text-right font-bold transition cursor-pointer ${
                planMode === m.id
                  ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 shadow-xs'
                  : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {planMode === 'daily_total' && (
          <div className="pt-2 text-xs">
            <label className="block text-stone-600 dark:text-stone-400 mb-1">
              عدد الصلوات المستهدفة يومياً:
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={planTotal}
              onChange={(e) => setPlanTotal(Math.max(1, Number(e.target.value)))}
              className="w-24 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold text-center"
            />
          </div>
        )}

        {planMode === 'flexible' && (
          <div className="pt-2 space-y-2 text-xs">
            {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerType[]).map((p) => (
              <div key={p} className="flex items-center justify-between">
                <span>هدف صلاة {PRAYER_NAMES[p]}:</span>
                <input
                  type="number"
                  min={0}
                  value={planDistribution[p]}
                  onChange={(e) =>
                    setPlanDistribution({
                      ...planDistribution,
                      [p]: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="w-20 px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold text-center"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-800">
          <button
            onClick={handleSavePlan}
            className="py-2 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 font-bold text-xs shadow-xs transition cursor-pointer"
          >
            تطبيق وحفظ الخطة
          </button>
          {planSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <Check className="w-4 h-4" /> تم تحديث الخطة بنجاح
            </span>
          )}
        </div>
      </div>

      {/* 4. Adjust Balances */}
      <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200">
              تعديل أرصدة الصلوات الفائتة
            </h3>
            <p className="text-[11px] text-stone-500">
              لتصحيح أو زيادة رصيد الصلوات في حال تذكر صلوات أخرى
            </p>
          </div>
          <button
            onClick={() => {
              setEditRemaining({ ...appData.remainingBalances });
              setEditStarting({ ...appData.startingBalances });
              setShowBalanceModal(true);
            }}
            className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            تعديل الأرصدة
          </button>
        </div>
      </div>

      {/* 5. Notifications */}
      <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-5 shadow-sm space-y-3 text-xs">
        <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          <span>تنبيهات التذكير بالصلوات</span>
        </h3>
        {isNotificationSupported ? (
          <div className="flex items-center justify-between">
            <span className="text-stone-600 dark:text-stone-400">
              تفعيل إشعارات المتصفح اليومية للتذكير بالهدف:
            </span>
            <button
              onClick={handleRequestNotification}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                appData.settings.notificationsEnabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-emerald-800 text-amber-200 hover:bg-emerald-700'
              }`}
            >
              {appData.settings.notificationsEnabled ? 'التنبيهات مفعلة ✓' : 'تفعيل الإشعارات'}
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-[11px] leading-relaxed">
            الإشعارات غير مدعومة مباشرة في بيئة المعاينة الحالية أو في هذا المتصفح. عند تثبيت التطبيق كـ PWA على الهاتف سيتاح استلام التذكيرات بإذن الله.
          </div>
        )}
      </div>

      {/* 6. Backup & Restore (JSON) */}
      <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-5 shadow-sm space-y-4 text-xs">
        <div>
          <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
            النسخ الاحتياطي واستعادة البيانات (JSON)
          </h3>
          <p className="text-[11px] text-stone-500 leading-relaxed">
            احفظ نسخة كاملة من سجلاتك على هاتفك أو حاسوبك، أو استرجع نسخة محفوظة مسبقاً بعد فحص سلامتها.
          </p>
        </div>

        {importError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleExportDownload}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span>تصدير نسخة احتياطية</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>استيراد نسخة احتياطية</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            accept=".json,application/json"
            className="hidden"
          />
        </div>
      </div>

      {/* 7. Reset Application Data */}
      <div className="bg-white dark:bg-stone-900 border border-red-300 dark:border-red-900/40 rounded-3xl p-5 shadow-sm space-y-3 text-xs">
        <h3 className="text-xs font-bold text-red-600 dark:text-red-400">
          إعادة ضبط ومحو بيانات التطبيق
        </h3>
        <p className="text-[11px] text-stone-500 leading-relaxed">
          حذف كافة الأرصدة والسجلات والملف التعريفي المحلي من ذاكرة هذا الجهاز والبدء من جديد.
        </p>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="py-2 px-4 rounded-xl border border-red-300 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold transition cursor-pointer"
        >
          إعادة ضبط التطبيق بالكامل
        </button>
      </div>

      {/* Balance Edit Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-emerald-800/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-right text-xs">
            <h3 className="text-base font-bold mb-2 font-tajawal">تعديل الأرصدة المتبقية في الذمة</h3>
            <p className="text-stone-500 mb-4 text-[11px]">
              حدد الرصيد المتبقي بدقة لكل صلاة:
            </p>

            <div className="space-y-2 mb-5">
              {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerType[]).map((p) => (
                <div key={p} className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-stone-800">
                  <span className="font-bold">{PRAYER_NAMES[p]}:</span>
                  <input
                    type="number"
                    min={0}
                    value={editRemaining[p]}
                    onChange={(e) =>
                      setEditRemaining({
                        ...editRemaining,
                        [p]: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-24 px-2 py-1 text-center font-bold rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-700"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowBalanceModal(false)}
                className="py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveBalances}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 font-bold cursor-pointer"
              >
                حفظ وتحديث الأرصدة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview Modal */}
      {importCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-emerald-800/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-right text-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-3">
              <FileCheck className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold mb-2 font-tajawal text-stone-900 dark:text-stone-100">
              معاينة النسخة الاحتياطية قبل الاستعادة
            </h3>

            <p className="text-stone-500 mb-4 leading-relaxed">
              تم التحقق من سلامة ملف النسخة الاحتياطية بنجاح. راجع تفاصيلها قبل استبدال بياناتك الحالية:
            </p>

            <div className="space-y-2 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 mb-5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-500">اسم صاحب الملف:</span>
                <span className="font-bold">{importCandidate.profile.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">معرف الضيف:</span>
                <span className="font-mono" dir="ltr">{importCandidate.profile.guestId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">عدد العمليات المسجلة:</span>
                <span className="font-bold">{importCandidate.history.length} عملية</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">الأرصدة المتبقية:</span>
                <span className="font-bold">
                  فجر: {importCandidate.remainingBalances.fajr} • ظهر: {importCandidate.remainingBalances.dhuhr} • عصر: {importCandidate.remainingBalances.asr} • مغرب: {importCandidate.remainingBalances.maghrib} • عشاء: {importCandidate.remainingBalances.isha}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setImportCandidate(null)}
                className="py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 font-bold cursor-pointer"
              >
                تأكيد استعادة النسخة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-red-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-right text-xs">
            <h3 className="text-base font-bold text-red-600 dark:text-red-400 mb-2 font-tajawal">
              تأكيد إعادة الضبط الكلي
            </h3>
            <p className="text-stone-600 dark:text-stone-300 mb-4 leading-relaxed">
              هل أنت متأكد من مسح جميع البيانات والعودة إلى شاشة الإعداد الأولى؟ سيتم فقدان كافة سجلاتك إن لم تكن قد صدّرت نسخة احتياطية.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 font-bold"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetAllData();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
              >
                نعم، مسح كل شيء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
