import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { DailySession, PlanningMode, PrayerType } from '../types';
import { PRAYER_NAMES } from '../utils/prayerLogic';

interface Props {
  todaySession: DailySession;
  planningMode: PlanningMode;
  nextEligiblePrayer: PrayerType | null;
  onContinueSession: () => void;
  onPostponeUnfinished: (postponeCount: number, notes?: string) => void;
  onAdjustTodayTarget: (newTarget: number) => void;
}

export const DailySessionCard: React.FC<Props> = ({
  todaySession,
  planningMode,
  nextEligiblePrayer,
  onContinueSession,
  onPostponeUnfinished,
  onAdjustTodayTarget,
}) => {
  const [showManageModal, setShowManageModal] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [adjustTargetInput, setAdjustTargetInput] = useState(todaySession.target);

  const target = todaySession.target || 0;
  const completed = todaySession.completed || 0;
  const remainingForToday = Math.max(0, target - completed);
  const postponed = todaySession.postponed || 0;
  const progressPercent = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;
  const isTargetAchieved = target > 0 && completed >= target;

  const handleConfirmPostpone = () => {
    if (remainingForToday > 0) {
      onPostponeUnfinished(remainingForToday);
      setShowManageModal(false);
    }
  };

  const handleSaveTarget = () => {
    if (adjustTargetInput >= 0) {
      onAdjustTodayTarget(adjustTargetInput);
      setShowManageModal(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-5 shadow-sm text-stone-900 dark:text-stone-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-tajawal">جلسة اليوم</h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {planningMode === 'sequential'
                ? 'النظام التتابعي المستمر'
                : planningMode === 'flexible'
                ? 'الخطة المرنة المخصصة'
                : 'الهدف الإجمالي اليومي'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowManageModal(true)}
          className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-amber-300 transition flex items-center gap-1 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>إدارة الجلسة</span>
        </button>
      </div>

      {/* Target & Completed counts */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-emerald-800 dark:text-amber-300">
            {completed}
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400">من {target} صلاة محددة لليوم</span>
        </div>

        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isTargetAchieved
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}
        >
          {isTargetAchieved ? 'تم إنجاز الهدف اليومي ✓' : `متبقي لليوم: ${remainingForToday}`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-stone-200 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isTargetAchieved
              ? 'bg-gradient-to-r from-emerald-600 to-amber-400'
              : 'bg-emerald-600 dark:bg-emerald-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onContinueSession}
          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-98 cursor-pointer"
        >
          <Clock className="w-4 h-4 text-amber-300" />
          <span>
            {planningMode === 'sequential' && nextEligiblePrayer
              ? `متابعة: صلاة ${PRAYER_NAMES[nextEligiblePrayer]}`
              : 'متابعة جلسة اليوم'}
          </span>
        </button>

        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition"
          title="تفاصيل توزيع الصلوات لليوم"
        >
          {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Breakdown if toggled */}
      {showBreakdown && (
        <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800 space-y-1.5 animate-in fade-in duration-200">
          {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerType[]).map((p) => {
            const item = todaySession.breakdown[p] || { target: 0, completed: 0, postponed: 0 };
            return (
              <div
                key={p}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-stone-50 dark:bg-stone-800/40"
              >
                <span className="font-semibold">{PRAYER_NAMES[p]}:</span>
                <span className="text-stone-500 dark:text-stone-400">
                  منجز: <span className="font-bold text-emerald-700 dark:text-emerald-400">{item.completed}</span> / هدف: {item.target}
                  {item.postponed > 0 && <span className="text-amber-600 mr-2">(مؤجل: {item.postponed})</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Session Management Modal */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-emerald-800/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-right">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-2 font-tajawal">
              إدارة جلسة اليوم والصلوات غير المنجزة
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
              يمكنك تأجيل المتبقي من هدف اليوم أو إعادة ضبط الهدف، مع العلم أن التأجيل لا يمس رصيدك الإجمالي في الذمة.
            </p>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/50 rounded-xl p-3 mb-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p>
                <span className="font-bold">تنبيه أمين:</span> تأجيل عنصر من هدف اليوم لا يحذفه من رصيد ما في ذمتك، ولا يحتسب كمنجز.
              </p>
            </div>

            {/* Postpone button if unfinished */}
            {remainingForToday > 0 ? (
              <div className="mb-4 p-3 rounded-xl bg-stone-100 dark:bg-stone-800">
                <div className="flex justify-between items-center mb-2 text-xs font-bold">
                  <span>تأجيل صلوات اليوم المتبقية:</span>
                  <span className="text-amber-700 dark:text-amber-300">{remainingForToday} صلوات</span>
                </div>
                <button
                  onClick={handleConfirmPostpone}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  ترحيل {remainingForToday} صلوات كـ (مؤجل اليوم)
                </button>
              </div>
            ) : (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-4 font-bold">
                لقد أنجزت كامل هدف اليوم! بارك الله فيك.
              </p>
            )}

            {/* Change today's target */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1.5">
                تعديل هدف اليوم:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={adjustTargetInput}
                  onChange={(e) => setAdjustTargetInput(Math.max(0, Number(e.target.value)))}
                  className="w-20 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-bold text-center bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
                <button
                  onClick={handleSaveTarget}
                  className="flex-1 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-amber-200 text-xs font-bold rounded-lg transition"
                >
                  حفظ الهدف المعدل
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowManageModal(false)}
              className="w-full py-2 text-xs font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition"
            >
              إلغاء وإغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
