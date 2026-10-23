import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { getArabicFormattedDate } from '../utils/prayerLogic';
import { PWAInstallButton } from './PWAInstallButton';

interface Props {
  onOpenMenu: () => void;
  userName: string;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
  activeScreenTitle?: string;
}

export const Navbar: React.FC<Props> = ({
  onOpenMenu,
  userName,
  theme,
  onToggleTheme,
  activeScreenTitle,
}) => {
  const arabicDate = getArabicFormattedDate();
  const isDarkActive =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <header className="sticky top-0 z-30 bg-emerald-950/95 backdrop-blur-md border-b border-emerald-800/40 text-stone-100 shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Right side in RTL: App Brand & Logo */}
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}assets/aistudio/1792715656850_9e02955c.jpg`}
            alt="شعار صلاتي"
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-amber-400/50 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-amber-300 font-tajawal">
                صلاتي
              </h1>
              <span className="hidden xs:inline-block text-[11px] px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-200 border border-emerald-700/50 font-medium">
                قضاء ما في الذمة
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80 line-clamp-1">
              {activeScreenTitle ? activeScreenTitle : `مرحباً بك، ${userName || 'ضيف كريم'}`}
            </p>
          </div>
        </div>

        {/* Left side in RTL: Quick tools & Menu Drawer button */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <div className="hidden sm:block">
            <PWAInstallButton variant="button" />
          </div>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            aria-label={isDarkActive ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
            className="p-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-amber-300 border border-emerald-700/50 transition cursor-pointer active:scale-95"
            title={isDarkActive ? 'الوضع الفاتح' : 'الوضع الداكن'}
          >
            {isDarkActive ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Hamburger Menu button */}
          <button
            onClick={onOpenMenu}
            aria-label="فتح القائمة الرئيسية للتطبيق"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-amber-200 border border-amber-400/40 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Menu className="w-5 h-5 text-amber-300" />
            <span className="text-xs font-bold hidden sm:inline">القائمة</span>
          </button>
        </div>
      </div>

      {/* Date banner */}
      <div className="bg-emerald-900/70 border-t border-emerald-800/30 px-4 py-1 text-[11px] text-emerald-200 text-center flex items-center justify-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        <span>{arabicDate}</span>
      </div>
    </header>
  );
};
