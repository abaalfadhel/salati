import React, { useState } from 'react';
import { History, RotateCcw, AlertTriangle, Check, Calendar } from 'lucide-react';
import { PrayerRecord } from '../types';
import { PRAYER_NAMES } from '../utils/prayerLogic';

interface Props {
  history: PrayerRecord[];
  onUndoLastRecord: (record: PrayerRecord) => void;
}

export const RecentActivityList: React.FC<Props> = ({ history, onUndoLastRecord }) => {
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [recordToUndo, setRecordToUndo] = useState<PrayerRecord | null>(null);

  const displayedRecords = showFullHistory ? history : history.slice(0, 5);
  const latestRecord = history[0];

  const handleConfirmUndo = () => {
    if (recordToUndo) {
      onUndoLastRecord(recordToUndo);
      setRecordToUndo(null);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-5 shadow-sm text-stone-900 dark:text-stone-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-tajawal">سجل العمليات الأخير</h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              توثيق زمني فوري مع إمكانية التراجع الآمن
            </p>
          </div>
        </div>

        {/* Undo latest button */}
        {latestRecord && (
          <button
            onClick={() => setRecordToUndo(latestRecord)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 text-xs font-bold transition hover:bg-amber-100 cursor-pointer"
            title="التراجع عن آخر عملية تسجيل"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تراجع عن الأخيرة</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-6 text-stone-400 text-xs">
          لا يوجد عمليات قضاء مسجلة حتى الآن. ابدأ بتسجيل أول صلاة من البطاقات أعلاه!
        </div>
      ) : (
        <div className="space-y-2">
          {displayedRecords.map((item, index) => {
            const isLatest = index === 0;
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs transition ${
                  isLatest
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                    : 'bg-stone-50 dark:bg-stone-800/30 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      قضاء صلاة {PRAYER_NAMES[item.prayer]}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 mr-2">
                      ({item.quantity} صلوات • {item.rakats} ركعة)
                    </span>
                    {item.note && (
                      <p className="text-[10px] text-stone-400 mt-0.5 italic">
                        "{item.note}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono" dir="ltr">
                    {item.date}
                  </span>
                  {isLatest && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                      الأحدث
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {history.length > 5 && (
        <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 text-center">
          <button
            onClick={() => setShowFullHistory(!showFullHistory)}
            className="text-xs font-bold text-emerald-800 dark:text-amber-300 hover:underline cursor-pointer"
          >
            {showFullHistory ? 'عرض أقل' : `عرض السجل كاملاً (${history.length} عملية)`}
          </button>
        </div>
      )}

      {/* Confirmation modal for Undo */}
      {recordToUndo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-amber-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-right">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-2 font-tajawal">
              تأكيد التراجع عن آخر عملية
            </h3>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
              هل أنت متأكد من إلغاء تسجيل صلاة <span className="font-bold text-emerald-700 dark:text-emerald-400">{PRAYER_NAMES[recordToUndo.prayer]}</span> بعدد <span className="font-bold">{recordToUndo.quantity}</span> صلاة؟ سيتم إعادة الرصيد إلى ما في ذمتك.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setRecordToUndo(null)}
                className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmUndo}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow transition"
              >
                تأكيد التراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
