import React, { useEffect, useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface Props {
  onFinishSplash: () => void;
}

export const SplashScreen: React.FC<Props> = ({ onFinishSplash }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Auto transition after 2.5 seconds or user can tap "متابعة"
    const timer = setTimeout(() => {
      handleProceed();
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  const handleProceed = () => {
    setIsFading(true);
    setTimeout(() => {
      onFinishSplash();
    }, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#032a20] via-[#064e3b] to-[#021f17] text-white transition-opacity duration-400 select-none ${
        isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      {/* Top spiritual subtle badge */}
      <div className="pt-6 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/60 border border-amber-400/30 text-amber-300 text-xs font-medium backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
        </span>
      </div>

      {/* Center Hero */}
      <div className="flex flex-col items-center text-center max-w-sm px-4">
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-amber-400/20 rounded-full blur-xl animate-pulse" />
          <img
            src={`${import.meta.env.BASE_URL}assets/aistudio/1792715656850_9e02955c.jpg`}
            alt="شعار صلاتي"
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover relative ring-4 ring-amber-400/70 shadow-2xl"
          />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-amber-300 tracking-wide font-tajawal mb-2 drop-shadow-sm">
          صلاتي
        </h1>
        <h2 className="text-lg sm:text-xl font-bold text-emerald-100 mb-3 font-tajawal">
          قضاء ما في الذمة
        </h2>
        <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
          رفيقك الموثوق لتنظيم، ومتابعة، وتوثيق صلواتك الفائتة في بيئة خاصة وآمنة تماماً على جهازك.
        </p>
      </div>

      {/* Bottom Button & Credits */}
      <div className="w-full max-w-xs flex flex-col items-center pb-6 space-y-4">
        <button
          onClick={handleProceed}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer"
        >
          <span>متابعة</span>
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center text-[11px] text-emerald-300/80">
          <p>تطوير أباالفضل نهاد حسن</p>
        </div>
      </div>
    </div>
  );
};
