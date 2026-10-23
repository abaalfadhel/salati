import React, { useState } from 'react';
import { Layers, TrendingUp, Sparkles, CheckCircle2, Flame } from 'lucide-react';
import { AppData, DailySession, PrayerBalances, PrayerType } from '../types';
import { PRAYER_NAMES, PRAYER_ORDER, STANDARD_RAKATS, calculateTotalPrayers } from '../utils/prayerLogic';

interface Props {
  appData: AppData;
  todaySession: DailySession;
}

type PeriodFilter = 'all' | 'day' | 'week';

export const PrayerCompletionChart: React.FC<Props> = ({ appData, todaySession }) => {
  const [furoodPeriod, setFuroodPeriod] = useState<PeriodFilter>('all');
  const [summaryPeriod, setSummaryPeriod] = useState<PeriodFilter>('all');

  // Compute percentages based on period
  const startingTotal = calculateTotalPrayers(appData.startingBalances);
  const completedTotal = calculateTotalPrayers(appData.completedTotals);

  // 1. Overall obligatory prayer percentage
  let fardPct = startingTotal > 0 ? Math.min(100, Math.round((completedTotal / startingTotal) * 100)) : 0;
  if (summaryPeriod === 'day') {
    const todayTarget = todaySession.target || 1;
    fardPct = Math.min(100, Math.round((todaySession.completed / todayTarget) * 100));
  } else if (summaryPeriod === 'week') {
    let weekSum = 0;
    const now = Date.now();
    for (const h of appData.history) {
      if (now - h.timestamp <= 7 * 86400000) weekSum += h.quantity;
    }
    const weekTarget = (appData.activePlan.dailyTotal || 5) * 7;
    fardPct = Math.min(100, Math.round((weekSum / weekTarget) * 100));
  }

  // 2. Rakats compensation percentage (صلاة النافلة / ركعات القضاء)
  const totalRakatsStarting =
    (appData.startingBalances.fajr || 0) * 2 +
    (appData.startingBalances.dhuhr || 0) * 4 +
    (appData.startingBalances.asr || 0) * 4 +
    (appData.startingBalances.maghrib || 0) * 3 +
    (appData.startingBalances.isha || 0) * 4;
  const totalRakatsCompleted =
    (appData.completedTotals.fajr || 0) * 2 +
    (appData.completedTotals.dhuhr || 0) * 4 +
    (appData.completedTotals.asr || 0) * 4 +
    (appData.completedTotals.maghrib || 0) * 3 +
    (appData.completedTotals.isha || 0) * 4;
  const nafilaPct =
    totalRakatsStarting > 0
      ? Math.min(100, Math.round((totalRakatsCompleted / totalRakatsStarting) * 100))
      : 0;

  // 3. Consistency / streak percentage (الأعمال الجيدة)
  const recordedDates = new Set(appData.history.map((h) => h.date));
  const activeDays = recordedDates.size;
  // Out of a 30-day milestone
  const goodDeedsPct = Math.min(100, Math.round((activeDays / 30) * 100));

  // Compute individual prayer completion rates for the curve
  const prayerPoints = PRAYER_ORDER.map((p, index) => {
    let pct = 0;
    if (furoodPeriod === 'all') {
      const start = appData.startingBalances[p] || 0;
      const comp = appData.completedTotals[p] || 0;
      pct = start > 0 ? Math.min(100, Math.round((comp / start) * 100)) : 0;
    } else if (furoodPeriod === 'day') {
      const target = todaySession.breakdown[p]?.target || 1;
      const comp = todaySession.breakdown[p]?.completed || 0;
      pct = Math.min(100, Math.round((comp / target) * 100));
    } else if (furoodPeriod === 'week') {
      const now = Date.now();
      let prayerWeekSum = 0;
      for (const h of appData.history) {
        if (h.prayer === p && now - h.timestamp <= 7 * 86400000) {
          prayerWeekSum += h.quantity;
        }
      }
      const target = (appData.activePlan.distribution[p] || 1) * 7;
      pct = Math.min(100, Math.round((prayerWeekSum / target) * 100));
    }

    // Coordinates on 400x160 SVG canvas
    // X goes from right to left in RTL: fajr (right) -> isha (left)
    const x = 340 - index * 70; // 340, 270, 200, 130, 60
    // Y: 100% -> Y=30, 0% -> Y=130
    const y = 130 - (pct / 100) * 100;

    return {
      prayer: p,
      name: PRAYER_NAMES[p],
      pct,
      x,
      y,
    };
  });

  // Generate smooth cubic bezier SVG path across the 5 points
  // Points are sorted by X ascending: isha (60), maghrib (130), asr (200), dhuhr (270), fajr (340)
  const sortedPoints = [...prayerPoints].sort((a, b) => a.x - b.x);

  let pathD = `M ${sortedPoints[0].x} ${sortedPoints[0].y}`;
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const p0 = sortedPoints[i];
    const p1 = sortedPoints[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  // Closed area path for soft green gradient under the curve
  const areaD = `${pathD} L ${sortedPoints[sortedPoints.length - 1].x} 140 L ${sortedPoints[0].x} 140 Z`;

  return (
    <div className="space-y-4 select-none">
      {/* 1. الموجز (Summary Rings Card) */}
      <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs">
            <button
              onClick={() => setSummaryPeriod('all')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                summaryPeriod === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setSummaryPeriod('day')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                summaryPeriod === 'day'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              يوم
            </button>
            <button
              onClick={() => setSummaryPeriod('week')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                summaryPeriod === 'week'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              اسبوع
            </button>
          </div>

          <h3 className="text-base font-black text-emerald-800 dark:text-emerald-400 font-tajawal">
            الموجز
          </h3>
        </div>

        {/* Three Circular Progress Rings */}
        <div className="grid grid-cols-3 gap-2 text-center py-2">
          {/* Ring 1: صلاة الفرض */}
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-stone-200 dark:stroke-stone-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#gradient-fard)"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (fardPct / 100) * 251.2}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="gradient-fard" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 font-tajawal">
                %{fardPct.toFixed(1)}
              </span>
            </div>
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 mt-2 block">
              صلاة الفرض
            </span>
          </div>

          {/* Ring 2: صلاة النافلة / ركعات القضاء */}
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-stone-200 dark:stroke-stone-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (nafilaPct / 100) * 251.2}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 font-tajawal">
                %{nafilaPct.toFixed(1)}
              </span>
            </div>
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 mt-2 block">
              ركعات القضاء
            </span>
          </div>

          {/* Ring 3: الاعمال الجيدة / الاستمرارية */}
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-stone-200 dark:stroke-stone-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (goodDeedsPct / 100) * 251.2}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 font-tajawal">
                %{goodDeedsPct.toFixed(1)}
              </span>
            </div>
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 mt-2 block">
              الاستمرارية
            </span>
          </div>
        </div>
      </div>

      {/* 2. الفروض (Obligatory Prayer Curve & Completion Map) */}
      <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs">
            <button
              onClick={() => setFuroodPeriod('all')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                furoodPeriod === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFuroodPeriod('day')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                furoodPeriod === 'day'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              يوم
            </button>
            <button
              onClick={() => setFuroodPeriod('week')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                furoodPeriod === 'week'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              اسبوع
            </button>
          </div>

          <h3 className="text-base font-black text-emerald-800 dark:text-emerald-400 font-tajawal">
            الفروض
          </h3>
        </div>

        {/* SVG Wave Chart */}
        <div className="relative w-full h-44 sm:h-52 overflow-hidden">
          <svg viewBox="0 0 400 160" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              {/* Soft green area gradient */}
              <linearGradient id="curveAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal guideline markers */}
            {/* 100% line */}
            <line x1="40" y1="30" x2="360" y2="30" stroke="#94a3b8" strokeDasharray="4 4" strokeOpacity="0.3" />
            <text x="35" y="34" fill="#94a3b8" fontSize="10" textAnchor="end" className="select-none font-bold">100%</text>

            {/* 50% line */}
            <line x1="40" y1="80" x2="360" y2="80" stroke="#94a3b8" strokeDasharray="4 4" strokeOpacity="0.3" />
            <text x="35" y="84" fill="#94a3b8" fontSize="10" textAnchor="end" className="select-none font-bold">50%</text>

            {/* Bottom 0% axis line */}
            <line x1="40" y1="130" x2="360" y2="130" stroke="#94a3b8" strokeOpacity="0.3" />

            {/* Vertical dashed guideline for each prayer */}
            {prayerPoints.map((pt) => (
              <g key={pt.prayer}>
                <line
                  x1={pt.x}
                  y1={pt.y}
                  x2={pt.x}
                  y2="130"
                  stroke="#facc15"
                  strokeWidth="2"
                  strokeOpacity="0.8"
                />
              </g>
            ))}

            {/* Translucent area under curve */}
            <path d={areaD} fill="url(#curveAreaGrad)" />

            {/* The main green smooth curve line */}
            <path
              d={pathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />

            {/* Golden glowing nodes on top of curve */}
            {prayerPoints.map((pt) => (
              <g key={`node-${pt.prayer}`} className="transition-all duration-700 ease-out">
                {/* Node Outer Halo */}
                <circle cx={pt.x} cy={pt.y} r="7" fill="#ffffff" stroke="#facc15" strokeWidth="3" />
                {/* Node Inner Core */}
                <circle cx={pt.x} cy={pt.y} r="3" fill="#f59e0b" />
                {/* Percentage Text above node */}
                <text
                  x={pt.x}
                  y={Math.max(18, pt.y - 10)}
                  fill="#1c1917"
                  className="dark:fill-stone-100 font-bold select-none text-[10px]"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                >
                  %{pt.pct}
                </text>
              </g>
            ))}

            {/* Prayer Names at Bottom Axis */}
            {prayerPoints.map((pt) => (
              <text
                key={`label-${pt.prayer}`}
                x={pt.x}
                y="152"
                fill="#57534e"
                className="dark:fill-stone-300 font-bold select-none"
                textAnchor="middle"
                fontSize="11"
              >
                {pt.name}
              </text>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};
