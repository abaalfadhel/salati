import React, { useState } from 'react';
import {
  Trophy,
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
  Sun,
  Lock,
  Filter,
} from 'lucide-react';
import { Achievement, AchievementCategory } from '../types';
import { calculateUserLevel } from '../utils/achievementsList';

interface Props {
  achievements: Achievement[];
  completedTotal: number;
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

type CategoryFilter = 'all' | 'prayers' | 'month' | 'ten_years' | 'volume' | 'streak' | 'challenge';

export const AchievementsView: React.FC<Props> = ({ achievements, completedTotal }) => {
  const [selectedFilter, setSelectedFilter] = useState<CategoryFilter>('all');
  const [onlyUnlocked, setOnlyUnlocked] = useState(false);

  const userLevel = calculateUserLevel(completedTotal);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const filteredAchievements = achievements.filter((ach) => {
    if (onlyUnlocked && !ach.unlocked) return false;

    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'prayers') {
      return ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(ach.category);
    }
    if (selectedFilter === 'month') {
      return ach.category === 'month';
    }
    if (selectedFilter === 'ten_years') {
      return ach.category === 'ten_years';
    }
    if (selectedFilter === 'volume') {
      return ach.category === 'volume' || ach.category === 'percentage';
    }
    if (selectedFilter === 'streak') {
      return ach.category === 'streak';
    }
    if (selectedFilter === 'challenge') {
      return ach.category === 'challenge';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Level Header Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-3xl p-6 shadow-md border border-emerald-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-black text-xl shadow-lg shrink-0">
              {userLevel.levelNumber}
            </div>
            <div>
              <span className="text-[11px] text-amber-300 font-bold block">
                مستوى الهمة الحالي
              </span>
              <h2 className="text-xl font-black font-tajawal text-white">
                {userLevel.levelName}
              </h2>
              <p className="text-xs text-emerald-200">
                إجمالي الصلوات المنجزة: {completedTotal.toLocaleString('ar-SA')} صلاة
              </p>
            </div>
          </div>

          <div className="bg-emerald-950/80 rounded-2xl p-3 border border-emerald-700/60 text-center shrink-0">
            <span className="text-[10px] text-emerald-300 block mb-0.5 font-bold">الأوسمة المفتوحة</span>
            <span className="text-lg font-black text-amber-300">
              {unlockedCount} / {achievements.length}
            </span>
          </div>
        </div>

        {/* Level Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-emerald-200">
            <span>التقدم نحو المستوى التالي:</span>
            <span className="font-bold text-amber-300">{userLevel.progressToNext}%</span>
          </div>
          <div className="w-full bg-emerald-950 h-2.5 rounded-full overflow-hidden border border-emerald-800">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${userLevel.progressToNext}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'month', label: 'الأشهر' },
            { id: 'ten_years', label: 'السنوات' },
            { id: 'prayers', label: 'الصلوات الخمس' },
            { id: 'volume', label: 'الإجمالي والنسب' },
            { id: 'streak', label: 'الاستمرارية' },
            { id: 'challenge', label: 'التحديات' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id as CategoryFilter)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                selectedFilter === tab.id
                  ? 'bg-emerald-800 text-amber-200 shadow-xs'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyUnlocked}
            onChange={(e) => setOnlyUnlocked(e.target.checked)}
            className="w-3.5 h-3.5 accent-emerald-700 rounded"
          />
          <span>المفتوحة فقط</span>
        </label>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filteredAchievements.map((ach) => {
          const Icon = ICON_MAP[ach.icon] || Trophy;
          const isUnlocked = ach.unlocked;
          const pct = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100));

          return (
            <div
              key={ach.id}
              className={`p-4 rounded-2xl border transition-all ${
                isUnlocked
                  ? 'bg-white dark:bg-stone-900 border-amber-400/50 shadow-xs ring-1 ring-amber-400/20'
                  : 'bg-stone-100/60 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 ring-2 ring-amber-300/40'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-400'
                  }`}
                >
                  {isUnlocked ? <Icon className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3
                      className={`text-xs font-bold truncate ${
                        isUnlocked
                          ? 'text-stone-900 dark:text-amber-300'
                          : 'text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {ach.title}
                    </h3>
                    {isUnlocked && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                        مكتمل ✓
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 mb-2 leading-relaxed">
                    {ach.description}
                  </p>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-stone-400">
                      <span>{ach.requirement}</span>
                      <span>
                        {ach.progress.toLocaleString('ar-SA')} / {ach.maxProgress.toLocaleString('ar-SA')}
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isUnlocked ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {ach.unlockedAt && (
                    <span className="text-[10px] text-stone-400 block mt-2">
                      تاريخ الفتح: {new Date(ach.unlockedAt).toLocaleDateString('ar-SA')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
