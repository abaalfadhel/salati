import React from 'react';
import { Award, CheckCircle, Clock, Sparkles, Hourglass, TrendingUp, Calendar } from 'lucide-react';

interface Props {
  completionPercentage: number;
  startingTotal: number;
  completedTotal: number;
  remainingTotal: number;
  todayTarget: number;
  todayCompleted: number;
  estimatedRemainingText?: string;
  mostAdvancedPrayerText?: string;
  weekCompletions?: number;
  monthCompletions?: number;
}

export const OverallProgress: React.FC<Props> = ({
  completionPercentage,
  startingTotal,
  completedTotal,
  remainingTotal,
  todayTarget,
  todayCompleted,
  estimatedRemainingText,
  mostAdvancedPrayerText,
  weekCompletions = 0,
  monthCompletions = 0,
}) => {
  // Semicircular SVG gauge math:
  // Circumference of semi-circle = PI * r
  const radius = 80;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <div className="bg-gradient-to-b from-white to-stone-50 dark:from-stone-900 dark:to-stone-900/90 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-tajawal">
              التقدم العام لإبراء الذمة
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              متابعة مباشرة وموثقة لصلواتك الفائتة
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          {completionPercentage}% منجز
        </span>
      </div>

      {/* Semicircular Progress SVG Gauge */}
      <div className="flex flex-col items-center justify-center my-2 relative">
        <svg viewBox="0 0 200 115" className="w-56 h-32 overflow-visible">
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#d4af37" />
            </linearGradient>
          </defs>
          {/* Background track arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinecap="round"
            className="text-stone-200 dark:text-stone-800"
          />
          {/* Active progress arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#progressGrad)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Gauge Center Text */}
        <div className="absolute bottom-2 flex flex-col items-center text-center">
          <span className="text-3xl font-black text-emerald-900 dark:text-amber-300 font-tajawal">
            {completionPercentage}%
          </span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
            نسبة الوفاء بالذمة
          </span>
        </div>
      </div>

      {/* Grid of Key Numbers */}
      <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-stone-200 dark:border-stone-800">
        <div className="bg-stone-100 dark:bg-stone-800/60 rounded-2xl p-2.5 text-center">
          <span className="text-[10px] text-stone-500 dark:text-stone-400 block mb-0.5">
            الرصيد الابتدائي
          </span>
          <span className="text-sm font-black text-stone-800 dark:text-stone-200">
            {startingTotal.toLocaleString('ar-SA')}
          </span>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-2.5 text-center border border-emerald-200 dark:border-emerald-800/40">
          <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block mb-0.5 font-bold">
            المنجز بفضل الله
          </span>
          <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
            {completedTotal.toLocaleString('ar-SA')}
          </span>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 rounded-2xl p-2.5 text-center border border-amber-200 dark:border-amber-800/40">
          <span className="text-[10px] text-amber-800 dark:text-amber-300 block mb-0.5 font-bold">
            المتبقي في الذمة
          </span>
          <span className="text-sm font-black text-amber-700 dark:text-amber-400">
            {remainingTotal.toLocaleString('ar-SA')}
          </span>
        </div>
      </div>

      {/* Velocity / Period Statistics */}
      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
        <div className="p-2 rounded-xl bg-stone-100/70 dark:bg-stone-800/40 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>إنجاز الأسبوع (7 أيام):</span>
          </span>
          <span className="font-bold text-stone-900 dark:text-stone-100">{weekCompletions} صلاة</span>
        </div>
        <div className="p-2 rounded-xl bg-stone-100/70 dark:bg-stone-800/40 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span>إنجاز الشهر (30 يوماً):</span>
          </span>
          <span className="font-bold text-stone-900 dark:text-stone-100">{monthCompletions} صلاة</span>
        </div>
      </div>

      {/* Estimated Duration Notice */}
      {estimatedRemainingText && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
          <Hourglass className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-stone-400 block">المدة التقديرية المتبقية لإتمام الرصيد:</span>
            <span className="font-semibold text-emerald-800 dark:text-amber-300 text-xs">
              {estimatedRemainingText}
            </span>
          </div>
        </div>
      )}

      {/* Most Advanced Prayer Notice */}
      {mostAdvancedPrayerText && (
        <div className="mt-2 text-[11px] text-stone-500 dark:text-stone-400 text-left px-1">
          {mostAdvancedPrayerText}
        </div>
      )}

      {/* Daily Target Sub-Bar */}
      {todayTarget > 0 && (
        <div className="mt-3 bg-stone-100 dark:bg-stone-800/40 rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-amber-300" />
            <span className="text-stone-700 dark:text-stone-300">هدف اليوم:</span>
            <span className="font-bold text-stone-900 dark:text-stone-100">
              {todayCompleted} من {todayTarget} صلاة
            </span>
          </div>
          <div className="w-24 bg-stone-200 dark:bg-stone-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 dark:bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((todayCompleted / todayTarget) * 100))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
