import React, { useRef, useState } from 'react';
import {
  Award,
  Download,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  AlertCircle,
  BadgeCheck,
  Image as ImageIcon,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { AppData, AppSettings, PrayerType } from '../types';
import {
  calculateTotalPrayers,
  calculateTotalRakats,
  getArabicFormattedDate,
  PRAYER_NAMES,
  STANDARD_RAKATS,
} from '../utils/prayerLogic';
import { formatDateToArabicSlash } from '../utils/dateUtils';

interface Props {
  appData: AppData;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const CertificateGallery: React.FC<Props> = ({ appData }) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const startingTotal = calculateTotalPrayers(appData.startingBalances);
  const remainingTotal = calculateTotalPrayers(appData.remainingBalances);
  const completedTotal = calculateTotalPrayers(appData.completedTotals);

  // Strict condition: Certificate is unlocked ONLY when debt is strictly 0 and starting > 0
  const isEligible = startingTotal > 0 && remainingTotal === 0 && completedTotal >= startingTotal;

  // Actual completion date
  // Never fabricate today's date for an older completion whose date was not recorded.
  const rawCompletionDate = appData.profile.completedAt || null;
  const actualCompletionDate = rawCompletionDate ? getArabicFormattedDate(new Date(rawCompletionDate)) : 'غير مسجل';
  // Eastern Arabic numerals date for the certificate when a real completion date exists.
  const arabicSlashDate = rawCompletionDate ? formatDateToArabicSlash(rawCompletionDate) : 'غير مسجل';

  // Helper to sanitize colors in cloned canvas, inject fonts, and fix Arabic text rendering
  const prepareCloneForCapture = (clonedDoc: Document, clonedElement: HTMLElement) => {
    // 1. Reset documentElement and body background to avoid oklch parsing in parseBackgroundColor
    clonedDoc.documentElement.style.backgroundColor = '#ffffff';
    clonedDoc.body.style.backgroundColor = '#ffffff';
    clonedDoc.documentElement.style.color = '#1c1917';
    clonedDoc.body.style.color = '#1c1917';
    clonedDoc.documentElement.className = '';
    clonedDoc.body.className = '';

    // 2. Clone all stylesheet links and style elements into cloned document head
    Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach((node) => {
      try {
        clonedDoc.head.appendChild(node.cloneNode(true));
      } catch {
        // Ignore any external cloning restrictions
      }
    });

    // 3. Inject global fonts and Arabic ligatures preservation style
    const styleTag = clonedDoc.createElement('style');
    styleTag.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Tajawal:wght@300;400;500;700;800;900&display=swap');
      * {
        letter-spacing: 0px !important;
        word-spacing: normal !important;
        font-feature-settings: "liga" 1, "calt" 1, "rlig" 1 !important;
        -webkit-font-smoothing: antialiased;
        text-rendering: geometricPrecision !important;
      }
      .font-amiri {
        font-family: 'Amiri', 'Traditional Arabic', 'Scheherazade New', Georgia, serif !important;
      }
      .font-tajawal {
        font-family: 'Tajawal', 'Cairo', 'Segoe UI', Tahoma, -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
      }
      .recipient-name {
        font-family: 'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif !important;
        color: #022c22 !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
      }
      .completion-badge {
        display: inline-flex !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      .seal-container {
        display: flex !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
    `;
    clonedDoc.head.appendChild(styleTag);

    // 4. Force exact proportional canvas dimensions (1188px x 840px = A4 Landscape ratio 297/210)
    clonedElement.style.width = '1188px';
    clonedElement.style.minWidth = '1188px';
    clonedElement.style.maxWidth = '1188px';
    clonedElement.style.height = '840px';
    clonedElement.style.minHeight = '840px';
    clonedElement.style.maxHeight = '840px';
    clonedElement.style.boxSizing = 'border-box';
    clonedElement.style.transform = 'none';

    // 5. Convert any oklch color string to sRGB hex/rgb using 2D canvas context
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = 1;
    colorCanvas.height = 1;
    const ctx = colorCanvas.getContext('2d');

    const sanitizeColor = (colorStr: string): string => {
      if (!colorStr || !colorStr.includes('oklch')) return colorStr;
      if (!ctx) return '#ffffff';
      try {
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = colorStr;
        return ctx.fillStyle;
      } catch {
        return '#ffffff';
      }
    };

    const colorProps = [
      'color',
      'background-color',
      'border-top-color',
      'border-right-color',
      'border-bottom-color',
      'border-left-color',
      'outline-color',
    ];

    const allElements = clonedElement.querySelectorAll('*');
    allElements.forEach((node) => {
      const el = node as HTMLElement;
      const style = clonedDoc.defaultView?.getComputedStyle(el);
      if (!style) return;

      for (const prop of colorProps) {
        const val = style.getPropertyValue(prop);
        if (val && val.includes('oklch')) {
          el.style.setProperty(prop, sanitizeColor(val), 'important');
        }
      }

      const bgImg = style.getPropertyValue('background-image');
      if (bgImg && bgImg.includes('oklch')) {
        el.style.setProperty('background-image', 'none', 'important');
      }

      const boxShadow = style.getPropertyValue('box-shadow');
      if (boxShadow && boxShadow.includes('oklch')) {
        el.style.setProperty('box-shadow', 'none', 'important');
      }
    });
  };

  const handleDownloadPdf = async () => {
    if (!certificateRef.current) return;
    setIsGeneratingPdf(true);
    setDownloadError(null);
    setDownloadSuccess(null);

    try {
      const element = certificateRef.current;

      // Ensure all web fonts are fully loaded
      if (document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 350));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 1188,
        height: 840,
        windowWidth: 1200,
        windowHeight: 900,
        onclone: (clonedDoc, clonedElement) => {
          prepareCloneForCapture(clonedDoc, clonedElement);
        },
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      // A4 Landscape dimensions in mm: 297mm x 210mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Zero extra margin or distortion - exact 1188/840 ratio match
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      const safeName = (appData.profile.displayName || 'فاعل_خير').replace(/[^\w\u0600-\u06FF]/g, '_');
      pdf.save(`شهادة_إتمام_قضاء_الصلوات_${safeName}.pdf`);

      setDownloadSuccess('تم تنزيل ملف PDF الفاخر للشهادة بنجاح بدون أي هوامش زائدة!');
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (error) {
      console.error('فشل إنشاء ملف PDF للشهادة:', error);
      setDownloadError('حدث خطأ أثناء معالجة ملف PDF. يرجى إعادة المحاولة.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!certificateRef.current) return;
    setIsGeneratingImage(true);
    setDownloadError(null);
    setDownloadSuccess(null);

    try {
      const element = certificateRef.current;

      if (document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 350));

      const canvas = await html2canvas(element, {
        scale: 2, // 2376px x 1680px ultra-high resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 1188,
        height: 840,
        windowWidth: 1200,
        windowHeight: 900,
        onclone: (clonedDoc, clonedElement) => {
          prepareCloneForCapture(clonedDoc, clonedElement);
        },
      });

      const imgUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const safeName = (appData.profile.displayName || 'فاعل_خير').replace(/[^\w\u0600-\u06FF]/g, '_');
      link.download = `شهادة_إتمام_قضاء_الصلوات_${safeName}.png`;
      link.href = imgUrl;
      link.click();

      setDownloadSuccess('تم تنزيل صورة الشهادة فائقة الدقة (PNG) بنجاح وبأبعاد متناسقة تماماً!');
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (error) {
      console.error('فشل حفظ صورة الشهادة:', error);
      setDownloadError('حدث خطأ أثناء حفظ صورة الشهادة.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and status banner */}
      <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-5 shadow-sm text-stone-900 dark:text-stone-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-bold shadow-md">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold font-tajawal">
              {isEligible ? 'شهادة إنجاز قضاء الصلوات' : 'وثيقة المتابعة وتقرير الإنجاز المرحلي'}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {isEligible
                ? 'شهادة إنجاز رقمية من تطبيق صلاتي، توثق البيانات المسجلة داخل التطبيق'
                : 'تقرير مرحلي يوضح تقدمك نحو إتمام قضاء ما في الذمة'}
            </p>
          </div>
        </div>

        {/* Status notification */}
        {isEligible ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-400 dark:border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                  مبارك إكمال الرصيد المسجل! شهادة الإنجاز جاهزة للتنزيل
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  تم تسجيل إكمال الرصيد المعتمد داخل التطبيق ({completedTotal.toLocaleString('ar-SA')} صلاة).
                </span>
              </div>
            </div>

            {/* Clean Download Buttons without any print button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf || isGeneratingImage}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50 border border-amber-400/40"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>{isGeneratingPdf ? 'جاري تجهيز PDF...' : 'تنزيل الشهادة (PDF)'}</span>
              </button>

              <button
                onClick={handleDownloadImage}
                disabled={isGeneratingPdf || isGeneratingImage}
                className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 transition border border-stone-300 dark:border-stone-700 cursor-pointer disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <span>{isGeneratingImage ? 'جاري التجهيز...' : 'حفظ كصورة (PNG)'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
            <div className="flex items-start gap-2.5">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                  شهادة إتمام الإنجاز متاحة بعد اكتمال الرصيد المسجل
                </span>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed mt-0.5">
                  وفقاً للضوابط الشرعية، لا يمكن إصدار شهادة إتمام نهائي طالما بقي في الذمة صلوات غير مقضية. الرصيد المتبقي حالياً هو:{' '}
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {remainingTotal.toLocaleString('ar-SA')} صلاة
                  </span>{' '}
                  من أصل <span className="font-bold">{startingTotal.toLocaleString('ar-SA')} صلاة</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {downloadSuccess && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {downloadError && (
          <div className="mt-3 p-3 rounded-xl bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{downloadError}</span>
          </div>
        )}
      </div>

      {/* VIEW 1: Ultra-Luxurious Royal Final Certificate (Displayed when fully eligible) */}
      {isEligible ? (
        <div className="overflow-x-auto pb-6">
          <div
            ref={certificateRef}
            className="certificate-frame mx-auto relative select-none"
            dir="rtl"
            style={{
              width: '1188px',
              height: '840px',
              minWidth: '1188px',
              maxWidth: '1188px',
              minHeight: '840px',
              maxHeight: '840px',
              boxSizing: 'border-box',
              backgroundColor: '#fdfcf7',
              color: '#1c1917',
              border: '10px double #b45309',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
              letterSpacing: '0px',
              position: 'relative',
            }}
          >
            {/* 🎀 Luxury Hanging Top-Left Ribbon & Golden Medallion with Platform Logo 🎀 */}
            <div
              className="absolute top-0 left-10 z-30 flex flex-col items-center pointer-events-none"
              style={{ width: '96px' }}
            >
              {/* Ribbon hanging tails with royal chevron cuts */}
              <div className="flex gap-1.5 justify-center">
                <div
                  style={{
                    width: '18px',
                    height: '52px',
                    backgroundColor: '#064e3b',
                    border: '1px solid #d4af37',
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.25)',
                  }}
                />
                <div
                  style={{
                    width: '26px',
                    height: '64px',
                    backgroundColor: '#b45309',
                    border: '1.5px solid #fef08a',
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)',
                    boxShadow: '0 5px 8px rgba(0,0,0,0.35)',
                  }}
                />
                <div
                  style={{
                    width: '18px',
                    height: '52px',
                    backgroundColor: '#064e3b',
                    border: '1px solid #d4af37',
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.25)',
                  }}
                />
              </div>

              {/* Rosette Medal / Golden Seal */}
              <div
                className="rounded-full flex flex-col items-center justify-center p-1 shadow-2xl relative -mt-7"
                style={{
                  width: '74px',
                  height: '74px',
                  background: 'radial-gradient(circle, #fef08a 0%, #f59e0b 50%, #92400e 100%)',
                  border: '3px solid #fde047',
                  boxShadow: '0 10px 20px -3px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
                }}
              >
                {/* Platform logo inside rosette */}
                <img
                  src={`${import.meta.env.BASE_URL}assets/aistudio/1792715656850_9e02955c.jpg`}
                  alt="شعار المنصة"
                  className="rounded-full object-cover"
                  style={{
                    width: '42px',
                    height: '42px',
                    border: '2px solid #ffffff',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                  }}
                />
                <div
                  className="flex items-center gap-0.5 mt-0.5"
                  style={{
                    fontSize: '7.5px',
                    fontWeight: 900,
                    color: '#451a03',
                    letterSpacing: '0px',
                  }}
                >
                  <span>★</span>
                  <span>موثق معتمد</span>
                  <span>★</span>
                </div>
              </div>
            </div>

            {/* Corner Arabesque Motifs */}
            <div className="absolute top-4 right-4 font-amiri text-3xl select-none" style={{ color: '#d97706' }}>
              ۞
            </div>
            <div className="absolute top-4 left-4 font-amiri text-3xl select-none opacity-40" style={{ color: '#d97706' }}>
              ۞
            </div>
            <div className="absolute bottom-4 right-4 font-amiri text-3xl select-none" style={{ color: '#d97706' }}>
              ۞
            </div>
            <div className="absolute bottom-4 left-4 font-amiri text-3xl select-none" style={{ color: '#d97706' }}>
              ۞
            </div>

            {/* Inner Guilloche Ornamental Border Box with perfect flex distribution */}
            <div
              className="rounded-2xl p-6 text-center relative flex flex-col justify-between"
              style={{
                border: '2px solid #d97706',
                backgroundColor: '#ffffff',
                boxShadow: 'inset 0 0 25px rgba(212, 175, 55, 0.08)',
                height: '100%',
                boxSizing: 'border-box',
              }}
            >
              {/* Header: Basmala & App Logo */}
              <div className="flex flex-col items-center">
                <img
                  src={`${import.meta.env.BASE_URL}assets/aistudio/1792715656850_9e02955c.jpg`}
                  alt="شعار صلاتي"
                  className="w-14 h-14 rounded-2xl shadow mb-1.5 object-cover"
                  style={{ border: '2px solid #d97706' }}
                />
                <p
                  className="font-amiri text-xl font-bold"
                  style={{ color: '#064e3b', letterSpacing: '0px' }}
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
                <p
                  className="font-amiri text-xs mt-0.5"
                  style={{ color: '#92400e', letterSpacing: '0px' }}
                >
                  «إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا»
                </p>
              </div>

              {/* Certificate Main Title & 100% Arabic Noble Subtitle (No English) */}
              <div className="my-1.5">
                <h1
                  className="text-3xl font-black font-amiri pb-1 inline-block px-8"
                  style={{
                    color: '#064e3b',
                    borderBottom: '2.5px solid #d97706',
                    letterSpacing: '0px',
                  }}
                >
                  شهادة إتمام قضاء الصلوات
                </h1>
                <p
                  className="text-xs mt-1.5 font-bold font-tajawal"
                  style={{ color: '#b45309', letterSpacing: '0px' }}
                >
                  شهادة إنجاز رقمية توثق ما سجله المستخدم في تطبيق صلاتي، وليست وثيقة صادرة عن جهة شرعية مستقلة
                </p>
              </div>

              {/* Certificate Body Text */}
              <p
                className="text-xs leading-relaxed max-w-xl mx-auto my-1"
                style={{ color: '#44403c', letterSpacing: '0px' }}
              >
                تشهد إدارة ومنظومة تطبيق{' '}
                <span className="font-bold" style={{ color: '#064e3b' }}>
                  «صلاتي | قضاء ما في الذمة»
                </span>{' '}
                بأن الأخ/الأخت:
              </p>

              {/* Full Triple Name - Clean cursive Arabic ligatures with explicit guaranteed visibility */}
              <div
                className="my-1.5 py-2 px-12 rounded-2xl inline-block shadow-sm mx-auto"
                style={{
                  backgroundColor: '#fefce8',
                  border: '2px solid #facc15',
                }}
              >
                <span
                  className="recipient-name text-2xl sm:text-3xl font-black font-tajawal block"
                  style={{
                    color: '#022c22',
                    letterSpacing: '0px',
                    fontFeatureSettings: '"liga" 1, "calt" 1',
                    fontFamily: "'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif",
                    visibility: 'visible',
                    opacity: 1,
                  }}
                >
                  {appData.profile.displayName || 'فاعل خير'}
                </span>
              </div>

              <p
                className="text-xs leading-relaxed max-w-xl mx-auto my-1"
                style={{ color: '#44403c', letterSpacing: '0px' }}
              >
                قد أتمّ بحمد الله وتوفيقه تسجيل وتوثيق قضاء كامل صلواته المفروضة التي كانت في ذمته، وبلغ رصيده المتبقي{' '}
                <span className="font-bold" style={{ color: '#064e3b' }}>
                  صفراً من الصلوات (براءة ذمة تامة)
                </span>
                ، سائلين المولى عز وجل له القبول وحسن العاقبة.
              </p>

              {/* 5 Prayers Breakdown Grid */}
              <div className="grid grid-cols-5 gap-3 my-2 max-w-xl mx-auto text-center w-full">
                {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map((p) => (
                  <div
                    key={p}
                    className="p-2.5 rounded-2xl shadow-xs"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #fcd34d',
                    }}
                  >
                    <span
                      className="text-xs font-bold block"
                      style={{ color: '#064e3b', letterSpacing: '0px' }}
                    >
                      {PRAYER_NAMES[p]}
                    </span>
                    <span
                      className="text-base font-black block my-0.5 font-tajawal"
                      style={{ color: '#b45309', letterSpacing: '0px' }}
                    >
                      {appData.completedTotals[p].toLocaleString('ar-SA')}
                    </span>
                    <span
                      className="text-[10px] block"
                      style={{ color: '#78716c', letterSpacing: '0px' }}
                    >
                      {appData.completedTotals[p] * STANDARD_RAKATS[p]} ركعة
                    </span>
                  </div>
                ))}
              </div>

              {/* Overall Totals Bar */}
              <div
                className="rounded-2xl p-2.5 max-w-lg mx-auto flex items-center justify-around text-xs font-bold my-1 shadow-sm w-full"
                style={{
                  backgroundColor: '#064e3b',
                  color: '#fef08a',
                  border: '1px solid #d4af37',
                  letterSpacing: '0px',
                }}
              >
                <span>إجمالي الصلوات المقضية: {completedTotal.toLocaleString('ar-SA')} صلاة</span>
                <span>•</span>
                <span>
                  إجمالي الركعات المقضية: {calculateTotalRakats(appData.completedTotals).toLocaleString('ar-SA')} ركعة
                </span>
              </div>

              {/* Truthfulness Notice */}
              <p
                className="text-[10px] max-w-lg mx-auto italic my-1 leading-relaxed"
                style={{ color: '#78716c', letterSpacing: '0px' }}
              >
                * هذه شهادة رقمية صادرة عن تطبيق صلاتي وفق البيانات المسجلة فيه، ولا تمثل اعتمادًا شرعيًا أو حكوميًا من جهة مستقلة.
              </p>

              {/* Footer with Dynamic Actual Date, Official Arabic Seal, and Manager Signature */}
              <div
                className="pt-3 flex items-center justify-between max-w-2xl mx-auto w-full"
                style={{
                  borderTop: '2px solid #fcd34d',
                  color: '#44403c',
                }}
              >
                {/* Right: Actual Completion Date with Security Insignia & "سجل إتمام القضاء" Badge */}
                <div className="text-right flex flex-col items-start" style={{ minWidth: '170px' }}>
                  <div className="flex items-center gap-1.5 mb-0.5 text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span className="text-[11px] font-bold" style={{ letterSpacing: '0px' }}>
                      تاريخ إتمام القضاء:
                    </span>
                  </div>
                  <span
                    className="font-bold text-xs block font-amiri"
                    style={{ color: '#1c1917', letterSpacing: '0px' }}
                  >
                    {actualCompletionDate}
                  </span>
                  <span
                    className="text-[10px] block mt-0.5 font-mono"
                    style={{ color: '#b45309' }}
                  >
                    {rawCompletionDate || 'غير مسجل'}
                  </span>

                  {/* Guaranteed Visible "سجل إتمام القضاء" Badge */}
                  <div
                    className="completion-badge inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg mt-2"
                    style={{
                      backgroundColor: '#ecfdf5',
                      border: '1.5px solid #059669',
                      fontSize: '11px',
                      color: '#065f46',
                      fontWeight: 800,
                      letterSpacing: '0px',
                    }}
                  >
                    <CheckCircle2 style={{ width: '14px', height: '14px', color: '#059669', flexShrink: 0 }} />
                    <span>سجل إتمام القضاء</span>
                  </div>
                </div>

                {/* Center: In-Bounds 100% Arabic Royal Accreditation Seal (Never clipped or missing on download) */}
                <div className="seal-container flex flex-col items-center justify-center select-none px-4">
                  <svg
                    width="88"
                    height="88"
                    viewBox="0 0 100 100"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ display: 'block' }}
                  >
                    {/* Concentric ornamental circles */}
                    <circle cx="50" cy="50" r="47" fill="#fffdfa" stroke="#b45309" strokeWidth="2.5" />
                    <circle cx="50" cy="50" r="43" fill="none" stroke="#d97706" strokeWidth="1" strokeDasharray="3,2" />
                    <circle cx="50" cy="50" r="38" fill="#064e3b" stroke="#fde047" strokeWidth="1.5" />
                    <circle cx="50" cy="50" r="27" fill="#ffffff" stroke="#b45309" strokeWidth="1.5" />

                    {/* Top Arc Text */}
                    <text
                      x="50"
                      y="25"
                      textAnchor="middle"
                      fill="#fef08a"
                      fontSize="7"
                      fontWeight="bold"
                      fontFamily="'Tajawal', 'Cairo', sans-serif"
                    >
                      ★ معتمد رسمياً ★
                    </text>

                    {/* Center Main Text */}
                    <text
                      x="50"
                      y="46"
                      textAnchor="middle"
                      fill="#064e3b"
                      fontSize="8.5"
                      fontWeight="900"
                      fontFamily="'Tajawal', 'Cairo', sans-serif"
                    >
                      إتمام القضاء
                    </text>

                    {/* Center Sub Text */}
                    <text
                      x="50"
                      y="56"
                      textAnchor="middle"
                      fill="#b45309"
                      fontSize="6.5"
                      fontWeight="bold"
                      fontFamily="'Tajawal', 'Cairo', sans-serif"
                    >
                      إتمام الرصيد
                    </text>

                    {/* Bottom Arc Text */}
                    <text
                      x="50"
                      y="83"
                      textAnchor="middle"
                      fill="#fef08a"
                      fontSize="6.5"
                      fontWeight="bold"
                      fontFamily="'Tajawal', 'Cairo', sans-serif"
                    >
                      شهادة رقمية
                    </text>
                  </svg>
                </div>

                {/* Left: Supervisor & Clean Signature with Dynamic Completion Date (No Engineer title) */}
                <div className="text-left flex flex-col items-center" style={{ minWidth: '170px' }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <BadgeCheck className="w-4 h-4 text-emerald-700" />
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: '#064e3b', letterSpacing: '0px' }}
                    >
                      إعداد تطبيق صلاتي:
                    </span>
                  </div>
                  <span
                    className="text-xs block font-bold mb-1"
                    style={{ color: '#1c1917', letterSpacing: '0px' }}
                  >
                    أباالفضل نهاد حسن
                  </span>

                  {/* Clean signature presentation: Pristine transparent PNG with zero cutoffs */}
                  <div className="relative flex flex-col items-center select-none" style={{ minWidth: '145px' }}>
                    <img
                      src={`${import.meta.env.BASE_URL}assets/aistudio/manager_signature_clean.png`}
                      alt="توقيع زخرفي على شهادة تطبيق صلاتي"
                      style={{
                        width: '140px',
                        height: 'auto',
                        display: 'block',
                        filter: 'drop-shadow(0 1px 1px rgba(16, 56, 92, 0.15))',
                      }}
                    />

                    {/* Dynamic completion date positioned under signature stroke in matching Eastern Arabic numerals */}
                    <div
                      className="font-bold -mt-3 mr-10 select-none font-amiri"
                      style={{
                        fontSize: '12px',
                        color: '#10385c',
                        letterSpacing: '0px',
                      }}
                      dir="ltr"
                    >
                      {arabicSlashDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: Milestone Progress Report Card */
        <div className="bg-white dark:bg-stone-900 border border-emerald-800/20 dark:border-emerald-700/30 rounded-3xl p-6 shadow-sm text-stone-900 dark:text-stone-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
            <div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-1">
                تقرير مرحلي لمسار القضاء
              </span>
              <h3 className="text-lg font-black font-tajawal text-emerald-900 dark:text-emerald-300">
                بيان التقدم الحالي للأخ/الأخت: {appData.profile.displayName}
              </h3>
            </div>
            <div className="text-left">
              <span className="text-xs text-stone-500 dark:text-stone-400 block">نسبة الإنجاز الكلية:</span>
              <span className="text-2xl font-black text-emerald-700 dark:text-amber-300">
                {startingTotal > 0 ? Math.round((completedTotal / startingTotal) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Breakdown per prayer */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
              تفصيل الصلوات الخمس المنجزة والمتبقية:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerType[]).map((p) => {
                const rem = appData.remainingBalances[p] || 0;
                const comp = appData.completedTotals[p] || 0;
                const start = appData.startingBalances[p] || 0;
                const pct = start > 0 ? Math.min(100, Math.round((comp / start) * 100)) : 0;
                return (
                  <div
                    key={p}
                    className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/70 text-center"
                  >
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block mb-1">
                      صلاة {PRAYER_NAMES[p]}
                    </span>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 block">
                      {comp.toLocaleString('ar-SA')} منجز
                    </span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 block mt-0.5">
                      {rem.toLocaleString('ar-SA')} متبقٍ
                    </span>
                    <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              «واصل سعيك المبارك واثبت على خطتك اليومية، وعند بلوغك نسبة 100% وانعدام الرصيد المتبقي، سيفتح لك التطبيق شهادة إنجاز رقمية مع إمكانية تنزيلها بصيغة PDF أو PNG.»
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
