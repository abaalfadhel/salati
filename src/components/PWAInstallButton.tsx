import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  variant?: 'button' | 'banner';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 3000);
    }
  };

  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className="bg-gradient-to-l from-emerald-900 via-emerald-800 to-emerald-900 border border-emerald-600/40 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-200">تثبيت تطبيق صلاتي</h4>
              <p className="text-xs text-emerald-100">ثبّت التطبيق على شاشتك الرئيسية للوصول السريع والعمل دون إنترنت</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-900 text-xs font-bold rounded-xl shadow-md transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            {installSuccess ? <Check className="w-4 h-4 inline" /> : 'تثبيت الآن'}
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        title="تثبيت التطبيق على جهازك"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-amber-200 border border-amber-400/30 text-xs font-medium transition cursor-pointer shadow-sm active:scale-95"
      >
        <Download className="w-4 h-4 text-amber-300" />
        <span>تثبيت التطبيق</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="تثبيت التطبيق على آيفون"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-amber-200 border border-amber-400/30 text-xs font-medium transition cursor-pointer shadow-sm"
        >
          <Smartphone className="w-4 h-4 text-amber-300" />
          <span>تثبيت على آيفون</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-emerald-800/30 p-6 shadow-2xl relative text-right">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 left-4 p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-3">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-2">
                تثبيت صلاتي على iPhone و iPad
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
                لإضافة التطبيق كبرنامج مستقل يعمل بدون إنترنت:
              </p>

              <ol className="text-xs space-y-2.5 text-stone-700 dark:text-stone-200 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200 dark:border-stone-700 mb-4 list-decimal list-inside">
                <li>اضغط على زر المشاركة <span className="font-bold">Share</span> أسفل متصفح Safari.</li>
                <li>مرر لأسفل واختر <span className="font-bold">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</span>.</li>
                <li>اضغط على <span className="font-bold">إضافة (Add)</span> في الزاوية العلوية.</li>
              </ol>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-amber-200 font-bold text-xs rounded-xl transition"
              >
                فهمت، حسناً
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
