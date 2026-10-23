import React from 'react';
import { ShieldCheck, Lock, Database, RefreshCw, AlertCircle, Mail, Send } from 'lucide-react';

export const PrivacyPolicyView: React.FC = () => {
  return (
    <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-6 shadow-sm text-stone-900 dark:text-stone-100 space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black font-tajawal">سياسة الخصوصية وأمان البيانات</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            تطبيق «صلاتي | قضاء ما في الذمة» — التزام صريح بالخصوصية المحلية
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-5 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-1.5">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>1. الغرض من التطبيق</span>
          </h3>
          <p>
            تطبيق «صلاتي | قضاء ما في الذمة» أُنشئ لمساعدة المسلم على تنظيم وتوثيق ومتابعة قضاء صلواته الفائتة في بيئة شخصية محفزة تحترم قدسية وخصوصية العبادة إبراءً للذمة أمام الله تعالى.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-1.5">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>2. البيانات التي يتم إدخالها ومعالجتها</span>
          </h3>
          <p>
            تقتصر البيانات على ما يدخله المستخدم بنفسه: (الاسم المفضل للعرض، اللقب الاختياري، الرصيد الابتدائي للصلوات الفائتة، سجل الصلوات المقضية وتواريخها والملاحظات الشخصية، وأهداف الخطة اليومية والأوسمة المكتسبة).
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-1.5">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>3. التخزين المحلي الكامل (Local Storage)</span>
          </h3>
          <p>
            في هذا الإصدار الأول (v1.0)، تُحفظ جميع السجلات والبيانات <span className="font-bold text-emerald-700 dark:text-emerald-400">محلياً على جهاز المستخدم حصراً</span> عبر قواعد بيانات المتصفح (IndexedDB و LocalStorage). لا يتطلب التطبيق كلمة مرور أو رقم هاتف أو بريد إلكتروني للتسجيل، ولا يتم إرسال أي جزء من سجلات صلواتك إلى أي خادم أو طرف ثالث.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-1.5">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>4. خلو التطبيق من المتتبعات والإعلانات</span>
          </h3>
          <p>
            التطبيق خالٍ تماماً من أي ملفات تعريف ارتباط دعائية، ولا يتضمن أي شفرات تتبع أو حزم إعلانات تجارية أو تحليلات استهدافية تخرق خصوصيتك.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-1.5">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>5. حدود التخزين المحلي وأهمية النسخ الاحتياطي</span>
          </h3>
          <p>
            نظراً لأن البيانات محفوظة داخل مساحة المتصفح على جهازك، فإن مسح بيانات التصفح، أو حذف تطبيق الويب من الجهاز، أو تعطل المتصفح قد يؤدي إلى فقدان السجلات المخزنة. ولذلك وفرنا أداة تصدير واسترجاع نسخة احتياطية بصيغة ملف JSON. نوصي المستخدم بالاحتفاظ بنسخة دورية على هاتفه أو حاسوبه. لا ندّعي حماية مطلقة أو بقاءً دائماً للبيانات دون أخذ المستخدم لنسخته الاحتياطية.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-1.5">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>6. كيفية تصدير واستعادة وحذف البيانات</span>
          </h3>
          <p>
            يمكنك في أي لحظة من شاشة «الإعدادات» أو شاشة «الحساب»:
          </p>
          <ul className="list-disc list-inside space-y-1 pr-2 text-stone-600 dark:text-stone-400">
            <li>الضغط على <span className="font-semibold">«تصدير نسخة احتياطية»</span> لتحميل ملف JSON يحتوي على كامل بياناتك.</li>
            <li>استيراد ملف نسخة احتياطية بعد فحصه والتحقق من سلامته قبل التطبيق.</li>
            <li>الضغط على <span className="font-semibold">«حذف البيانات»</span> لمحو كافة السجلات من ذاكرة الجهاز.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-1.5 pt-3 border-t border-stone-200 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>7. التواصل والاستفسارات</span>
          </h3>
          <p>
            لأي استفسارات حول الخصوصية أو التطبيق، نرحب بتواصلكم مع المطور أباالفضل نهاد حسن:
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <a
              href="mailto:abaalfadheln@gmail.com"
              className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>abaalfadheln@gmail.com</span>
            </a>
            <a
              href="https://t.me/xd_4o"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram: @xd_4o</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};
