import React from 'react';
import {
  Sparkles,
  Trophy,
  Award,
  Crown,
  Star,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
  Compass,
  Medal,
  Sun,
  Flame,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Achievement } from '../types';

interface Props {
  achievement: Achievement | null;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Flame,
  ShieldCheck,
  Award,
  Crown,
  Star,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
  Compass,
  Medal,
  Trophy,
  Sun,
};

export const AchievementCelebrationModal: React.FC<Props> = ({ achievement, onClose }) => {
  if (!achievement) return null;

  const Icon = ICON_MAP[achievement.icon] || Trophy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ach-celebration-title"
        className="bg-white dark:bg-stone-900 border-2 border-amber-400 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative text-stone-900 dark:text-stone-100 animate-in zoom-in-95 duration-300"
      >
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute top-4 left-4 p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Floating Glow & Icon */}
        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-400/30 rounded-3xl blur-xl animate-pulse" />
          <div className="relative w-18 h-18 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-stone-950 flex items-center justify-center shadow-lg ring-4 ring-amber-300/40">
            <Icon className="w-9 h-9" />
          </div>
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800 mb-2">
          مبارك! وسام إنجاز جديد 🏆
        </span>

        <h3 id="ach-celebration-title" className="text-xl font-black font-tajawal text-emerald-950 dark:text-amber-300 mb-1">
          {achievement.title}
        </h3>

        <p className="text-xs text-stone-600 dark:text-stone-300 mb-4 leading-relaxed max-w-xs mx-auto">
          {achievement.description}
        </p>

        <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 mb-5 text-xs text-stone-500 dark:text-stone-400">
          <span className="font-semibold text-stone-700 dark:text-stone-300 block mb-0.5">شرط الفتح المحقق:</span>
          <span>{achievement.requirement}</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-amber-200 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer border border-amber-400/30"
        >
          الحمد لله • استمرار
        </button>
      </div>
    </div>
  );
};
