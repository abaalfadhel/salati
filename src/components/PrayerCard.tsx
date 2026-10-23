import React, { useState } from 'react';
import { Plus, Check, Sparkles, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { PrayerType } from '../types';
import { PRAYER_NAMES, STANDARD_RAKATS } from '../utils/prayerLogic';

interface Props {
  prayer: PrayerType;
  remainingCount: number;
  completedCount: number;
  dailyTarget: number;
  todayCompleted: number;
  onQuickRecord: (prayer: PrayerType) => void;
  onOpenCustomModal: (prayer: PrayerType) => void;
  isNextSequential?: boolean;
}

export const PrayerCard: React.FC<Props> = ({
  prayer,
  remainingCount,
  completedCount,
  dailyTarget,
  todayCompleted,
  onQuickRecord,
  onOpenCustomModal,
  isNextSequential = false,
}) => {
  const [isPressing, setIsPressing] = useState(false);
  const [showPlusOne, setShowPlusOne] = useState(false);

  const name = PRAYER_NAMES[prayer];
  const rakatsPerPrayer = STANDARD_RAKATS[prayer];
  const remainingRakats = remainingCount * rakatsPerPrayer;
  const initialEstimate = remainingCount + completedCount;
  const progressPercent =
    initialEstimate > 0 ? Math.min(100, Math.round((completedCount / initialEstimate) * 100)) : 0;
  const isAllCleared = remainingCount === 0;

  const handleQuickRecordClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAllCleared || isPressing || remainingCount <= 0) return;

    // Throttle / debounce: 400ms lockout against accidental double-tap
    setIsPressing(true);
    setShowPlusOne(true);

    onQuickRecord(prayer);

    setTimeout(() => {
      setShowPlusOne(false);
      setIsPressing(false);
    }, 450);
  };

  return (
    <div
      className={`relative bg-white dark:bg-stone-900 border rounded-3xl p-4 shadow-xs transition-all hover:shadow-md ${
        isNextSequential
          ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/25'
          : isAllCleared
          ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20'
          : 'border-stone-200 dark:border-stone-800'
      }`}
    >
      {/* Floating +1 feedback animation */}
      {showPlusOne && (
        <span className="absolute top-2 left-1/2 -translate-x-1/2 -translate-y-2 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-xs shadow-lg animate-bounce pointer-events-none z-20">
          +1 قضاء!
        </span>
      )}

      {/* Badge if it is next sequential */}
      {isNextSequential && (
        <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 text-[10px] font-bold shadow-xs flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>الدور التالي في الترتيب</span>
        </span>
      )}

      {/* Top Header of Card */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shadow-xs ${
              isAllCleared
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {isAllCleared ? <Check className="w-4 h-4" /> : rakatsPerPrayer}
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-tajawal">
              صلاة {name}
            </h4>
            <p className="text-[10px] text-stone-500 dark:text-stone-400">
              {rakatsPerPrayer} ركعات مفروضة
            </p>
          </div>
        </div>

        {/* Custom amount trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenCustomModal(prayer);
          }}
          disabled={isAllCleared}
          title="تسجيل كمية مخصصة أو إضافة ملاحظة"
          className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-emerald-700 dark:hover:text-amber-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Key Counts Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/50">
          <span className="text-[10px] text-stone-500 dark:text-stone-400 block mb-0.5">
            المتبقي في الذمة:
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-base font-black ${
                isAllCleared
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {remainingCount.toLocaleString('ar-SA')}
            </span>
            <span className="text-[10px] text-stone-400">صلاة</span>
          </div>
          <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
            {remainingRakats.toLocaleString('ar-SA')} ركعة
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/50">
          <span className="text-[10px] text-stone-500 dark:text-stone-400 block mb-0.5">
            المنجز بفضل الله:
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
              {completedCount.toLocaleString('ar-SA')}
            </span>
            <span className="text-[10px] text-stone-400">صلاة</span>
          </div>
          <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
            اليوم: <span className="font-bold text-stone-800 dark:text-stone-200">{todayCompleted}</span> / {dailyTarget}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 mb-1">
        <span>نسبة الإنجاز: {progressPercent}%</span>
        {isAllCleared && <span className="text-emerald-600 dark:text-emerald-400 font-bold">تم إبراء الذمة ✓</span>}
      </div>
      <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden mb-3.5">
        <div
          className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Direct 1-Click Action Button */}
      <button
        onClick={handleQuickRecordClick}
        disabled={isAllCleared || isPressing}
        className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer select-none active:scale-97 ${
          isAllCleared
            ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-800 cursor-not-allowed shadow-none'
            : isPressing
            ? 'bg-emerald-900 text-amber-300 scale-98'
            : 'bg-emerald-800 hover:bg-emerald-700 text-amber-200 hover:text-amber-100 border border-amber-400/30 shadow-sm'
        }`}
      >
        {isAllCleared ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>مكتملة بحمد الله</span>
          </>
        ) : (
          <>
            <Check className="w-4 h-4 text-amber-300" />
            <span>قضيت صلاة {name} (+1)</span>
          </>
        )}
      </button>
    </div>
  );
};
