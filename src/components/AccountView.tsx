import React, { useState } from 'react';
import {
  User,
  Shield,
  Calendar,
  Download,
  Trash2,
  Edit3,
  Award,
  AlertTriangle,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { AppData, UserProfile } from '../types';
import { calculateTotalPrayers, calculateTotalRakats } from '../utils/prayerLogic';
import { calculateUserLevel } from '../utils/achievementsList';

interface Props {
  appData: AppData;
  onUpdateProfile: (profile: UserProfile) => void;
  onExportBackup: () => void;
  onNavigateToCertificates: () => void;
  onDeleteProfile: () => void;
}

export const AccountView: React.FC<Props> = ({
  appData,
  onUpdateProfile,
  onExportBackup,
  onNavigateToCertificates,
  onDeleteProfile,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editName, setEditName] = useState(appData.profile.displayName);

  const startingTotal = calculateTotalPrayers(appData.startingBalances);
  const completedTotal = calculateTotalPrayers(appData.completedTotals);
  const remainingTotal = calculateTotalPrayers(appData.remainingBalances);
  const userLevel = calculateUserLevel(completedTotal);

  const creationDate = appData.profile.createdAt
    ? new Date(appData.profile.createdAt).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'غير محدد';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...appData.profile,
      displayName: editName.trim() || 'فاعل خير',
      nickname: undefined,
    });
    setShowEditModal(false);
  };

  return (
    <div className="space-y-6 text-stone-900 dark:text-stone-100">
      {/* Profile Card */}
      <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-amber-300 flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-amber-400/30">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black font-tajawal text-stone-900 dark:text-stone-100">
                  {appData.profile.displayName}
                </h2>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1 rounded-lg text-stone-400 hover:text-emerald-700 transition"
                  title="تعديل الاسم"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <span>تاريخ إنشاء الملف:</span>
                <span className="font-medium text-stone-700 dark:text-stone-300">{creationDate}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3 text-right">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block mb-0.5">
              مستوى الهمة
            </span>
            <span className="text-sm font-black text-amber-700 dark:text-amber-400">
              {userLevel.levelName} (مستوى {userLevel.levelNumber})
            </span>
          </div>
        </div>

        {/* Local Storage Privacy Explanation */}
        <div className="mt-5 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/70 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-stone-900 dark:text-stone-100">
                معرف الضيف المحلي (Guest ID):
              </span>
            </div>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-400 text-xs px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700" dir="ltr">
              {appData.profile.guestId}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
            هذا الملف التعريفي وسجل الصلوات مخزنان كلياً داخل متصفح هذا الجهاز باستخدام IndexedDB و LocalStorage. التطبيق لا يرسل بياناتك لأي خادم خارجي، ولن تنتقل البيانات لجهاز آخر إلا عبر تصدير نسخة احتياطية يدوياً أو تفعيل المزامنة السحابية المستقبلية.
          </p>
        </div>

        {/* Balance Statistics */}
        <div className="mt-6">
          <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-3">
            إحصائيات الرصيد المسجل:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800/40">
              <span className="text-[11px] text-stone-500 block mb-1">الرصيد الابتدائي</span>
              <span className="text-base font-black text-stone-800 dark:text-stone-200">
                {startingTotal.toLocaleString('ar-SA')} صلاة
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block mb-1 font-bold">
                إجمالي المنجز
              </span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                {completedTotal.toLocaleString('ar-SA')} صلاة
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
              <span className="text-[11px] text-amber-800 dark:text-amber-300 block mb-1 font-bold">
                المتبقي في الذمة
              </span>
              <span className="text-base font-black text-amber-700 dark:text-amber-400">
                {remainingTotal.toLocaleString('ar-SA')} صلاة
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-5 border-t border-stone-200 dark:border-stone-800 flex flex-wrap gap-2.5">
          <button
            onClick={onNavigateToCertificates}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>عرض الشهادات</span>
          </button>

          <button
            onClick={onExportBackup}
            className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير نسخة احتياطية</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="py-2.5 px-4 rounded-xl border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>حذف الملف والبيانات</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-emerald-800/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-right">
            <h3 className="text-base font-bold mb-3 font-tajawal">تعديل الملف الشخصي</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">الاسم الثلاثي الكامل (بدون ألقاب):</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="مثال: عبد الله أحمد المنصور"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  يُستخدم الاسم الثلاثي الكامل في توثيق الشهادة الرسمية لإتمام القضاء.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 font-bold cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-red-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-right">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-red-600 dark:text-red-400 mb-2 font-tajawal">
              تحذير: حذف الملف المحلي والبيانات
            </h3>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
              سيؤدي هذا الإجراء إلى حذف جميع سجلات الصلوات، الأرصدة، الأوسمة، والخطة اليومية المخزنة على هذا الجهاز نهائياً. لا يمكن التراجع عن هذا الإجراء إلا إذا قمت بتصدير نسخة احتياطية مسبقاً.
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl mb-5 text-[11px] text-amber-900 dark:text-amber-200">
              💡 ننصحك بالضغط على زر "تصدير نسخة احتياطية" والاحتفاظ بملف JSON قبل المتابعة.
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 font-bold text-xs"
              >
                إلغاء والتراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  onDeleteProfile();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow cursor-pointer"
              >
                تأكيد الحذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
