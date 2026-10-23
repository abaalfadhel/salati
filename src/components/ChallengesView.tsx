import React, { useState } from 'react';
import {
  Swords,
  Calendar,
  Flame,
  Plus,
  Trophy,
  CheckCircle2,
  Users,
  Sparkles,
  Info,
} from 'lucide-react';
import { PersonalChallenge } from '../types';

interface Props {
  challenges: PersonalChallenge[];
  onAddCustomChallenge: (challenge: {
    title: string;
    description: string;
    target: number;
    days: number;
    reward: string;
  }) => void;
}

export const ChallengesView: React.FC<Props> = ({ challenges, onAddCustomChallenge }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customTarget, setCustomTarget] = useState(15);
  const [customDays, setCustomDays] = useState(3);
  const [customReward, setCustomReward] = useState('وسام التحدي الخاص');

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || customTarget <= 0) return;

    onAddCustomChallenge({
      title: customTitle.trim(),
      description: `قضاء ${customTarget} صلاة خلال ${customDays} أيام`,
      target: customTarget,
      days: customDays,
      reward: customReward.trim() || 'وسام العزم',
    });

    setCustomTitle('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-5 shadow-sm text-stone-900 dark:text-stone-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-tajawal">التحديات الفردية</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                أهداف شخصية لرفع وتيرة الإنجاز وتحفيز النفس على الوفاء بالذمة
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>تحدٍ جديد</span>
          </button>
        </div>

        {/* Future Community Competitions Disclaimer Banner */}
        <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold">المسابقات الجماعية وقوائم الصدارة:</span> صُممت هذه النسخة لتعمل محلياً وبشكل فردي آمن. مسابقات التنافس الجماعي وقوائم المتصدرين ستُتاح في تحديث قادم مع السحابة الاختيارية بمشيئة الله، دون إظهار أي متسابقين وهميين.
          </p>
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-3.5">
        {challenges.map((c) => {
          const pct = Math.min(100, Math.round((c.completed / c.target) * 100));
          return (
            <div
              key={c.id}
              className={`bg-white dark:bg-stone-900 border rounded-2xl p-4 shadow-xs transition-all ${
                c.isCompleted
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20'
                  : 'border-stone-200 dark:border-stone-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                      c.isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {c.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      {c.title}
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">{c.description}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                    c.isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {c.isCompleted ? 'مكتمل بنجاح ✓' : `ينتهي في ${c.endDate}`}
                </span>
              </div>

              {/* Progress */}
              <div className="space-y-1.5 mt-3">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-stone-600 dark:text-stone-400">
                    المنجز: <span className="font-bold text-emerald-700 dark:text-emerald-400">{c.completed}</span> من {c.target} صلاة
                  </span>
                  <span className="text-amber-600 dark:text-amber-300 font-bold">{pct}%</span>
                </div>
                <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      c.isCompleted ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Reward info */}
              <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>المكافأة: <span className="font-bold text-stone-800 dark:text-stone-200">{c.reward}</span></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to add custom challenge */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-emerald-800/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-right text-stone-900 dark:text-stone-100">
            <h3 className="text-base font-bold mb-3 font-tajawal">إنشاء تحدٍ شخصي مخصص</h3>

            <form onSubmit={handleCreateChallenge} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">اسم التحدي:</label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="مثال: همة نهاية الأسبوع"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">الهدف (عدد الصلوات):</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={customTarget}
                  onChange={(e) => setCustomTarget(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-center font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">المدة (بالأيام):</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={customDays}
                  onChange={(e) => setCustomDays(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-center font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">اسم المكافأة / الوسام:</label>
                <input
                  type="text"
                  value={customReward}
                  onChange={(e) => setCustomReward(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 font-bold shadow-md cursor-pointer"
                >
                  حفظ وبدء التحدي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
