import React, { useEffect } from 'react';
import {
  X,
  Home,
  User,
  Award,
  Trophy,
  Swords,
  ShieldCheck,
  Info,
  Settings,
  HeartHandshake,
} from 'lucide-react';

export type ScreenId =
  | 'dashboard'
  | 'account'
  | 'certificates'
  | 'achievements'
  | 'challenges'
  | 'privacy'
  | 'about'
  | 'settings';

interface MenuItem {
  id: ScreenId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: Home },
  { id: 'account', label: 'الحساب', icon: User },
  { id: 'certificates', label: 'الشهادات', icon: Award },
  { id: 'achievements', label: 'الإنجازات والجوائز', icon: Trophy },
  { id: 'challenges', label: 'المسابقات والتحديات', icon: Swords },
  { id: 'privacy', label: 'سياسة الخصوصية', icon: ShieldCheck },
  { id: 'about', label: 'عن التطبيق', icon: Info },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  userName: string;
  guestId: string;
}

export const NavigationDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  activeScreen,
  onNavigate,
  userName,
  guestId,
}) => {
  // Listen for Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Drawer Panel (RTL: slides from right) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="قائمة التنقل الرئيسية"
        className="absolute top-0 bottom-0 right-0 w-full max-w-xs bg-stone-900 text-stone-100 shadow-2xl flex flex-col z-10 border-l border-emerald-800/40 transform transition-transform animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-b from-emerald-950 to-stone-900 border-b border-emerald-800/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL}assets/aistudio/1792715656850_9e02955c.jpg`}
                alt="صلاتي"
                className="w-11 h-11 rounded-2xl ring-2 ring-amber-400/50 shadow"
              />
              <div>
                <h2 className="text-base font-bold text-amber-300 font-tajawal">صلاتي</h2>
                <p className="text-[11px] text-emerald-200">قضاء ما في الذمة</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="إغلاق القائمة"
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Profile Summary */}
          <div className="bg-emerald-900/40 rounded-xl p-2.5 border border-emerald-700/40 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-100 truncate">{userName || 'ضيف كريم'}</p>
              <p className="text-[10px] text-amber-300/80 font-mono" dir="ltr">{guestId}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-800 text-emerald-200 border border-emerald-600/40">
              محلي 🔒
            </span>
          </div>
        </div>

        {/* Menu Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-800 to-emerald-900 text-amber-300 border border-amber-400/30 shadow-md font-bold'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-emerald-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer with Developer Credits */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300/90 font-medium mb-1">
            <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
            <span>تطوير أباالفضل نهاد حسن</span>
          </div>
          <p className="text-[10px] text-stone-500 mt-2 font-mono">الإصدار 1.0.0 (بياناتك محفوظة محلياً)</p>
        </div>
      </div>
    </div>
  );
};
