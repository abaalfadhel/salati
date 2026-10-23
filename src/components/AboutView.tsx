import React from 'react';
import { Mail, Send, Instagram, HeartHandshake, Shield, Sparkles, Smartphone } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-6 shadow-sm text-stone-900 dark:text-stone-100 space-y-6">
      {/* Hero */}
      <div className="flex flex-col items-center text-center pb-6 border-b border-stone-200 dark:border-stone-800">
        <img
          src={`${import.meta.env.BASE_URL}assets/aistudio/1792715656850_9e02955c.jpg`}
          alt="صلاتي"
          className="w-24 h-24 rounded-3xl ring-4 ring-amber-400/60 shadow-lg object-cover mb-3"
        />
        <h2 className="text-2xl font-black text-emerald-900 dark:text-amber-300 font-tajawal">
          صلاتي | قضاء ما في الذمة
        </h2>
        <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800 mt-1 mb-2">
          الإصدار 1.0.0 (النسخة المستقلة PWA)
        </span>
        <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md leading-relaxed">
          تطبيق متكامل لمساعدة المؤمنين والمؤمنات على توثيق وحساب ومتابعة قضاء الصلوات اليومية الفائتة في بيئة تقنية هادئة تحترم الخصوصية وتحفز على الاستمرار حتى براءة الذمة التامة.
        </p>
      </div>

      {/* Credits Card */}
      <div className="text-xs">
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/70">
          <span className="text-[11px] text-stone-500 dark:text-stone-400 block mb-1">
            فكرة وتطوير وبرمجة:
          </span>
          <h3 className="text-sm font-bold text-emerald-900 dark:text-amber-300">
            أباالفضل نهاد حسن
          </h3>
          <p className="text-[11px] text-stone-500 mt-1">
            مطور حلول تقنية وتطبيقات إسلامية هادفة
          </p>
        </div>
      </div>

      {/* Working Contact Links */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200">
          قنوات التواصل الرسمية مع المطور:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <a
            href="https://instagram.com/prg.fl"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-stone-200 dark:border-stone-700 transition group text-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/80 text-pink-600 flex items-center justify-center shrink-0">
              <Instagram className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-stone-800 dark:text-stone-200 block group-hover:text-emerald-700 dark:group-hover:text-amber-300">
                Instagram
              </span>
              <span className="text-[10px] text-stone-400" dir="ltr">@prg.fl</span>
            </div>
          </a>

          <a
            href="https://t.me/xd_4o"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-stone-200 dark:border-stone-700 transition group text-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 flex items-center justify-center shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-stone-800 dark:text-stone-200 block group-hover:text-emerald-700 dark:group-hover:text-amber-300">
                Telegram
              </span>
              <span className="text-[10px] text-stone-400" dir="ltr">@xd_4o</span>
            </div>
          </a>

          <a
            href="mailto:abaalfadheln@gmail.com"
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-stone-200 dark:border-stone-700 transition group text-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-stone-800 dark:text-stone-200 block group-hover:text-emerald-700 dark:group-hover:text-amber-300">
                البريد الإلكتروني
              </span>
              <span className="text-[10px] text-stone-400 font-mono" dir="ltr">abaalfadheln@gmail.com</span>
            </div>
          </a>
        </div>
      </div>

      {/* Mandatory Arabic footer credit */}
      <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800 text-center space-y-1 text-xs text-stone-600 dark:text-stone-400">
        <p className="font-bold text-stone-800 dark:text-stone-200">
          © صلاتي | قضاء ما في الذمة
        </p>
        <p>تطوير أباالفضل نهاد حسن</p>
      </div>
    </div>
  );
};
