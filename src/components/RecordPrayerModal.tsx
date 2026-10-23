import React, { useState } from 'react';
import { X, Check, Calendar, StickyNote, Plus, AlertCircle } from 'lucide-react';
import { PrayerType } from '../types';
import { PRAYER_NAMES, STANDARD_RAKATS } from '../utils/prayerLogic';

interface Props {
  prayer: PrayerType | null;
  remainingCount: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    prayer: PrayerType;
    quantity: number;
    note?: string;
    date: string;
  }) => void;
}

export const RecordPrayerModal: React.FC<Props> = ({
  prayer,
  remainingCount,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !prayer) return null;

  const prayerName = PRAYER_NAMES[prayer];
  const rakatsPerPrayer = STANDARD_RAKATS[prayer];
  const totalRakats = quantity * rakatsPerPrayer;

  const handleQuickAdd = (amount: number) => {
    const next = quantity + amount;
    if (next <= remainingCount) {
      setQuantity(next);
      setErrorMessage(null);
    } else {
      setQuantity(remainingCount);
      setErrorMessage(`تم تحديد الحد الأقصى للمتبقي (${remainingCount})`);
    }
  };

  const handleQuantityInput = (val: number) => {
    const clean = Math.max(1, Math.floor(val || 1));
    if (clean > remainingCount) {
      setQuantity(remainingCount);
      setErrorMessage(`لا يمكن تجاوز الرصيد المتبقي (${remainingCount})`);
    } else {
      setQuantity(clean);
      setErrorMessage(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submit

    if (quantity <= 0) {
      setErrorMessage('يرجى تحديد عدد أكبر من صفر');
      return;
    }

    if (quantity > remainingCount) {
      setErrorMessage(`العدد المحدد (${quantity}) يتجاوز المتبقي (${remainingCount})`);
      return;
    }

    setIsSubmitting(true);
    onConfirm({
      prayer,
      quantity,
      note: note.trim() || undefined,
      date,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-prayer-title"
        className="bg-white dark:bg-stone-900 border border-emerald-800/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-right text-stone-900 dark:text-stone-100 animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="إغلاق نافذة التسجيل"
          className="absolute top-4 left-4 p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h3 id="record-prayer-title" className="text-lg font-black text-stone-900 dark:text-amber-300 font-tajawal">
              تسجيل قضاء: صلاة {prayerName}
            </h3>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            الرصيد المتبقي في ذمتك حالياً: <span className="font-bold text-emerald-700 dark:text-emerald-400">{remainingCount} صلاة</span>
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity Selector */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-stone-700 dark:text-stone-300">
              عدد الصلوات المنجزة:
            </label>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-black text-base flex items-center justify-center hover:bg-stone-200 transition"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={remainingCount}
                value={quantity}
                onChange={(e) => handleQuantityInput(Number(e.target.value))}
                className="flex-1 py-2 text-center text-xl font-black rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="button"
                onClick={() => handleQuickAdd(1)}
                className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-200 font-black text-base flex items-center justify-center hover:bg-emerald-700 transition"
              >
                +
              </button>
            </div>

            {/* Quick Add Pills */}
            <div className="flex items-center gap-1.5 justify-center">
              {[1, 2, 5, 10].map((add) => (
                <button
                  key={add}
                  type="button"
                  onClick={() => handleQuickAdd(add)}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-[11px] font-bold text-stone-700 dark:text-stone-300 transition"
                >
                  +{add}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setQuantity(remainingCount)}
                className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-[11px] font-bold text-amber-900 dark:text-amber-300 transition"
              >
                الكل ({remainingCount})
              </button>
            </div>
          </div>

          {/* Rakat Estimate Box */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-emerald-800 dark:text-emerald-300 font-medium">
              الركعات المقابلة لهذا العدد:
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-300 text-xs sm:text-sm">
              {totalRakats.toLocaleString('ar-SA')} ركعة ({rakatsPerPrayer} × {quantity})
            </span>
          </div>

          {/* Completion Date */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>تاريخ الإنجاز:</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5 text-stone-500" />
              <span>ملاحظة أو سبب (اختياري):</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثال: قضاء مع الجماعة، صلاة ليل..."
              maxLength={150}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || quantity <= 0 || quantity > remainingCount}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-amber-200 text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-amber-300" />
              <span>تأكيد تسجيل {quantity} صلاة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
