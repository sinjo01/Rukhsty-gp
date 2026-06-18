import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Car, CircleDot, Construction, Leaf, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const cardBackground = {
  backgroundImage: `linear-gradient(135deg, rgba(74,184,225,.98), rgba(45,157,214,.99)), url("data:image/svg+xml,%3Csvg width='42' height='42' viewBox='0 0 42 42' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21 4l3.3 10.3h10.8l-8.7 6.3 3.3 10.4L21 24.6 12.3 31l3.3-10.4-8.7-6.3h10.8z' fill='none' stroke='%23074d75' stroke-width='1.05' opacity='.20'/%3E%3C/svg%3E")`,
  backgroundSize: "cover, 31px 31px",
};

function formatDate(value: string | undefined) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function categoryText(license: any, language: "en" | "ar") {
  const category = license?.licenseCategory;
  if (!category) return fieldValue(license?.licenseCategoryCode ?? license?.category ?? license?.categoryCode);
  const code = category.code ? `${category.code} - ` : "";
  const en = category.nameEn ?? category.code ?? "-";
  const ar = category.nameAr ?? category.code ?? "-";
  return `${code}${language === "ar" ? ar : en}`;
}

function fieldValue(value?: string | number | null) {
  return value !== undefined && value !== null && String(value).trim() ? String(value) : "-";
}

function verificationUrl(serial: string) {
  const origin = typeof window !== "undefined" ? window.location.origin.replace(/^http:/, "https:") : "https://rukhsty.local";
  return `${origin}/verify/${encodeURIComponent(serial)}`;
}

export function DigitalLicenseCard({ license, className = "" }: { license: any; className?: string }) {
  const { language } = useLanguage();
  const [flipped, setFlipped] = useState(false);
  const serial = fieldValue(license?.licenseSerial ?? license?.licenseNumber ?? license?.id);
  const verify = useMemo(() => verificationUrl(serial), [serial]);

  return (
    <div className={`rukhsty-license-print license-language-${language} mx-auto w-full max-w-[620px] ${className}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;600;700&family=Tinos:wght@400;700&display=swap');
        .rukhsty-license-card-face { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .rukhsty-license-ar { font-family: "Noto Naskh Arabic", "Amiri", serif; }
        .rukhsty-license-en { font-family: "Tinos", Georgia, "Times New Roman", serif; }
        .rukhsty-license-value { font-family: "Tinos", "Noto Naskh Arabic", serif; letter-spacing: 0; }
        .license-language-en .license-copy-ar { display: none !important; }
        .license-language-ar .license-copy-en { display: none !important; }
        @media print {
          body * { visibility: hidden !important; }
          .rukhsty-license-print, .rukhsty-license-print * { visibility: visible !important; }
          .rukhsty-license-print { position: absolute !important; inset: 10mm auto auto 10mm !important; width: 92mm !important; max-width: 92mm !important; }
          .rukhsty-license-interactive { display: none !important; }
          .rukhsty-license-print-stack { display: grid !important; gap: 8mm !important; }
          .rukhsty-license-card-face { box-shadow: none !important; }
        }
      `}</style>

      <div className="rukhsty-license-interactive">
        <button
          type="button"
          aria-label="Flip digital driving license"
          className="block w-full cursor-pointer rounded-[18px] text-left focus:outline-none focus:ring-2 focus:ring-[#d6a537] focus:ring-offset-4"
          onClick={() => setFlipped((value) => !value)}
        >
          <div className="relative mx-auto aspect-[1.585/1] w-full [perspective:1400px]">
            <motion.div
              className="absolute inset-0 [transform-style:preserve-3d]"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 [backface-visibility:hidden]">
                <LicenseFront license={license} verify={verify} />
              </div>
              <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <LicenseBack verify={verify} />
              </div>
            </motion.div>
          </div>
        </button>
        <QrVerification verify={verify} />
        <p className="mt-2 text-center text-xs text-slate-500">{language === "ar" ? "اضغط على البطاقة لقلبها" : "Click the card to flip"}</p>
      </div>

      <div className="rukhsty-license-print-stack hidden">
        <LicenseFront license={license} verify={verify} />
        <LicenseBack verify={verify} />
        <QrVerification verify={verify} />
      </div>
    </div>
  );
}

function LicenseShell({ children }: { children: React.ReactNode }) {
  const { isRTL } = useLanguage();
  return (
    <section
      className="rukhsty-license-card-face relative h-full w-full overflow-hidden rounded-[10px] bg-[#3fb0e5] text-[#0d1820] shadow-[0_18px_45px_rgba(15,45,65,.22)]"
      style={cardBackground}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,.20),transparent_29%),linear-gradient(90deg,rgba(255,255,255,.14),transparent_38%,rgba(255,255,255,.10)),repeating-linear-gradient(0deg,rgba(255,255,255,.05)_0,rgba(255,255,255,.05)_1px,transparent_1px,transparent_5px)]" />
      <div className="relative h-full w-full">{children}</div>
    </section>
  );
}

function LicenseFront({ license, verify }: { license: any; verify: string }) {
  const { language } = useLanguage();
  const fullNameEn = fieldValue(license?.fullNameEn ?? license?.fullName);
  const fullNameAr = fieldValue(license?.fullNameAr ?? license?.fullName);
  const photoUrl = license?.photoUrl ?? license?.profilePhotoUrl;
  const dob = license?.dateOfBirth ?? license?.birthDate;
  const address = fieldValue(license?.address ?? license?.governorate);
  const issueDate = formatDate(license?.issueDate);
  const expiryDate = formatDate(license?.expiryDate);
  const licenseNo = fieldValue(license?.licenseNumber);
  const center = fieldValue(license?.licenseCenter ?? license?.centerName);
  const lastProcedure = fieldValue(license?.lastProcedure ?? license?.lastProc);
  const remarks = fieldValue(license?.remarks);
  const restrictions = fieldValue(license?.restrictions);

  return (
    <LicenseShell>
      <div className="relative z-10 h-full w-full overflow-hidden">
        <div className="license-copy-en absolute left-[7.2%] top-[7.2%] rukhsty-license-en leading-tight text-[#172b48]">
          <p className="text-[12px] font-bold sm:text-[14px]">The Hashemite Kingdom of Jordan</p>
          <p className="mt-0.5 text-[6px] font-bold sm:text-[7px]">Ministry of Interior - Licensing Department</p>
        </div>

        <div className="absolute left-1/2 top-[4%] -translate-x-1/2">
          <HeaderEmblemFlags />
        </div>

        <div className="license-copy-ar absolute right-[6.5%] top-[6%] rukhsty-license-ar text-right leading-tight text-[#24324f]" dir="rtl">
          <p className="text-[16px] font-bold sm:text-[19px]">المملكة الأردنية الهاشمية</p>
          <p className="mt-0.5 text-[8px] font-semibold sm:text-[9px]">وزارة الداخلية - إدارة الترخيص</p>
        </div>

        <div className="pointer-events-none absolute inset-x-[4.3%] bottom-[6%] top-[23%] z-30 rounded-[20px] border-[5px] border-[#25333c] bg-transparent">
          <div className="absolute inset-[5px] rounded-[14px] border-[5px] border-[#168458]">
            <div className="absolute inset-[3px] rounded-[9px] border border-white/85" />
          </div>
        </div>

        <div className="absolute left-[8.2%] top-[36%] z-20 h-[39.5%] w-[26.2%] overflow-hidden border-[3px] border-white bg-white shadow-sm">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile photograph" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
              <User className="h-12 w-12" />
            </div>
          )}
        </div>

        <div className="absolute left-[37%] right-[7.4%] top-[33.5%] z-20">
          <div className="relative mb-[2px] h-[20px] border-b-2 border-[#1d303b]">
            <p className="license-copy-en rukhsty-license-en absolute left-[1%] top-[-4px] text-[17px] font-bold underline">Driving License</p>
            <p className="license-copy-ar rukhsty-license-ar absolute right-[1%] top-[-5px] text-[19px] font-bold" dir="rtl">رخصة القيادة</p>
          </div>
          <ExactFrontRow ar="الاسم" en="Name" valueAr={fullNameAr} value={fullNameEn} />
          <ExactFrontRow ar="الجنسية" en="Nationality" valueAr="الأردن" value="Jordanian" />
          <ExactFrontRow ar="الرقم الوطني" en="National No" value={fieldValue(license?.nationalId)} mono />
          <div className="grid grid-cols-[.54fr_.46fr]">
            <ExactFrontRow ar="فصيلة الدم" en="Blood Group" value={fieldValue(license?.bloodGroup)} />
            <ExactFrontRow ar="تاريخ الولادة" en="D.O.B" value={formatDate(dob)} />
          </div>
          <ExactFrontRow ar="العنوان" en="Address" valueAr={address} value="" />
          <div className="grid grid-cols-[.46fr_.54fr]">
            <ExactFrontRow ar="مركز الترخيص" en="License Cent." value={center} />
            <ExactFrontRow ar="رقم الرخصة" en="License No." value={licenseNo} mono />
          </div>
          <div className="grid grid-cols-[.48fr_.52fr]">
            <ExactFrontRow ar="تاريخ الانتهاء" en="Exp. Date" value={expiryDate} />
            <ExactFrontRow ar="تاريخ الاصدار" en="Issue Date" value={issueDate} />
          </div>
          <ExactFrontRow ar="آخر إجراء" en="Last Proc." value={lastProcedure} />
          <div className="grid grid-cols-[1fr_96px] border-b-2 border-[#1d303b]">
            <ExactFrontRow ar="ملاحظات" en="Remarks" value={remarks} noBorder />
            <div className="grid grid-cols-4 border-l-2 border-[#1d303b]">
              {[1, 2, 3, 4].map((item) => <span key={item} className="min-h-[14px] border-r border-[#1d303b] last:border-r-0" />)}
            </div>
          </div>
        </div>

        <div className="absolute left-[8.6%] top-[76.6%] z-20 grid w-[26.5%] grid-cols-[1fr_44%] border-b-2 border-[#1d303b] text-[#142833]">
          <div className="rukhsty-license-en text-center text-[6px] font-black leading-none sm:text-[7px]">
            <p className="license-copy-en">License Type</p>
          </div>
          <p className="license-copy-ar rukhsty-license-ar text-right text-[8px] font-bold leading-none sm:text-[9px]" dir="rtl">فئة الرخصة</p>
          <p className="col-span-2 truncate text-center text-[10px] font-black leading-none sm:text-[12px]">{categoryText(license, language)}</p>
        </div>

        <div className="absolute bottom-[7px] left-[10px] right-[10px] flex items-center justify-between text-[6px] font-bold text-[#103747]/55">
          <span>{verify.replace(/^https?:\/\//, "")}</span>
          <span className="license-copy-ar rukhsty-license-ar" dir="rtl">نموذج رقمي عبر منصة رخصتي</span>
        </div>
      </div>
    </LicenseShell>
  );
}

function LicenseBack({ verify }: { verify: string }) {
  const rows = [
    ["1-1", "Motorcycle", "دراجة آلية", "motorcycle"],
    ["1-2", "Scooter", "دراجة آلية (سكوتر)", "motorcycle"],
    ["2-1", "Construction vehicle", "مركبة انشائية", "construction"],
    ["2-2", "Agricultural vehicle", "مركبة زراعية", "agricultural"],
    ["3-1", "Private passenger/rental vehicle <=5000kg, manual", "مركبة ركوب خصوصية أو تأجير لا يزيد وزنها الإجمالي على ٥٠٠٠ كغم، يدوي", "car"],
    ["3-2", "Private passenger/rental vehicle <=5000kg, automatic", "مركبة ركوب خصوصية أو تأجير لا يزيد وزنها الإجمالي على ٥٠٠٠ كغم، أوتوماتيك", "car"],
    ["4", "Commercial passenger & cargo <=7500kg", "مركبة ركوب عمومية أو شحن لا يزيد وزنها الإجمالي على ٧٥٠٠ كغم", "car"],
    ["5", "Minibus & cargo >7500kg", "حافلة متوسطة ومركبة شحن يزيد وزنها الإجمالي على ٧٥٠٠ كغم", "bus"],
    ["6-1", "Trailer and semi-trailer", "مقطورة ونصف مقطورة", "trailer"],
    ["6-2", "Bus", "حافلة", "bus"],
    ["7", "Disabled vehicle", "مركبة معاقين", "car"],
  ];

  return (
    <LicenseShell>
      <div className="relative z-10 flex h-full flex-col">
        <div className="absolute left-2 top-[42%] -rotate-90 text-[11px] font-black italic text-[#103747]">www.dvld.gov.jo</div>
        <div className="grid grid-cols-[1fr_82px_1fr] items-center">
          <div className="h-8 w-28 rounded-sm bg-gradient-to-r from-pink-400/75 to-pink-200/40 blur-[1px]" />
          <div className="mx-auto opacity-75"><Emblem mono /></div>
          <div />
        </div>

        <div className="mt-0 flex items-end justify-center gap-8 border-b-2 border-[#1b3441]/80 pb-0.5">
          <p className="license-copy-en rukhsty-license-en text-[16px] font-black">License Types</p>
          <p className="license-copy-ar rukhsty-license-ar text-[18px] font-bold" dir="rtl">فئات الرخص</p>
        </div>

        <div className="mt-1 flex-1 pl-8">
          <table className="h-full w-full table-fixed border-collapse text-[6px] font-bold leading-[1.05] text-[#122737] sm:text-[7px]">
            <tbody>
              {rows.map(([code, en, ar, icon]) => (
                <tr key={code} className="border-b border-[#1b3441]/80">
                  <td className="w-[9%] border-r border-[#1b3441]/80 px-0.5">{code}</td>
                  <td className="license-copy-en w-[42%] border-r border-[#1b3441]/80 px-1">{en}</td>
                  <td className="w-[8%] border-r border-[#1b3441]/80 text-center"><VehicleIcon kind={icon} /></td>
                  <td className="license-copy-ar rukhsty-license-ar px-1 text-right" dir="rtl">{ar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-1 grid grid-cols-5 border-2 border-[#1b3441]/80 text-center text-[6px] font-bold leading-tight sm:text-[7px]">
          <Restriction labelEn="License Restrictions" labelAr="شروط الرخصة" />
          <Restriction number="1" labelEn="Glasses" labelAr="نظارات" />
          <Restriction number="2" labelEn="Earphones" labelAr="سماعات" />
          <Restriction number="3" labelEn="Lenses" labelAr="عدسات" />
          <Restriction number="4" labelEn="Deaf" labelAr="أصم" />
        </div>

        <div className="mt-1 border-t-4 border-[#1f7a44] bg-[#d72b38] px-2 py-1 text-[5px] font-bold leading-tight text-white sm:text-[6px]">
          <div className="flex gap-2">
            <span className="license-copy-en">1. Give Way to Ambulances, Fire Department, Police & Official Convoy Vehicles.</span>
            <span className="license-copy-ar rukhsty-license-ar flex-1 text-right" dir="rtl">١. إفساح المجال لسيارات الإسعاف والدفاع المدني والشرطة والمواكب الرسمية.</span>
          </div>
          <div className="mt-0.5 flex gap-2">
            <span className="license-copy-en">2. This license must be carried at all times while driving. Show it to policemen when asked.</span>
            <span className="license-copy-ar rukhsty-license-ar flex-1 text-right" dir="rtl">٢. يجب حمل الرخصة أثناء القيادة وإبرازها لرجال الأمن العام عند الطلب.</span>
          </div>
        </div>

        <span className="absolute bottom-1 right-2 text-[5px] font-bold text-[#103747]/60">{verify.replace(/^https?:\/\//, "")}</span>
      </div>
    </LicenseShell>
  );
}

function JordanFlag({ width = 32, flip = false }: { width?: number; flip?: boolean }) {
  const h = width / 2;
  return (
    <svg width={width} height={h} viewBox="0 0 120 60" preserveAspectRatio="none"
      style={{
        transform: flip ? "scaleX(-1)" : "none",
        display: "block",
        filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,.35))",
      }}>
      <rect x="0" y="0" width="120" height="20" fill="#000000" />
      <rect x="0" y="20" width="120" height="20" fill="#ffffff" />
      <rect x="0" y="40" width="120" height="20" fill="#1f7a44" />
      <polygon points="0,0 60,30 0,60" fill="#c8102e" />
      <polygon fill="#fff"
        points="20,23 21.4,27.1 25.5,25.6 23.1,29.3 26.8,31.6
        22.5,32 23,36.3 20,33.2 17,36.3 17.5,32 13.2,31.6 14.5,25.6 18.6,27.1"
      />
    </svg>
  );
}

function HeaderEmblemFlags() {
  return (
    <div style={{ position: "relative", width: 86, height: 50 }}>
      <div style={{ position: "absolute", left: 2, top: 24, transform: "rotate(26deg)", transformOrigin: "right center" }}>
        <JordanFlag flip />
      </div>
      <div style={{ position: "absolute", right: 2, top: 24, transform: "rotate(-26deg)", transformOrigin: "left center" }}>
        <JordanFlag />
      </div>
      <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", zIndex: 2 }}>
        <Emblem size={40} />
      </div>
    </div>
  );
}

function ExactFrontRow({
  ar,
  en,
  value,
  valueAr,
  mono,
  noBorder,
}: {
  ar: string;
  en: string;
  value: string;
  valueAr?: string;
  mono?: boolean;
  noBorder?: boolean;
}) {
  return (
    <div className={`grid min-h-[14px] grid-cols-[1fr_72px] items-center leading-none ${noBorder ? "" : "border-b-2 border-[#1d303b]"}`}>
      <div className="min-w-0 px-1 text-center">
        {valueAr && (
          <p className="license-copy-ar rukhsty-license-ar truncate text-[9px] font-bold sm:text-[10px]" dir="rtl">
            {fieldValue(valueAr)}
          </p>
        )}
        <p className={`${valueAr ? "license-copy-en" : ""} rukhsty-license-value truncate text-[9px] font-bold ${mono ? "font-mono tracking-normal" : ""} ${en === "Name" ? "uppercase" : ""} sm:text-[10px]`}>
          {fieldValue(value)}
        </p>
      </div>
      <div className="pr-1 text-right text-[#142833]" dir="rtl">
        <p className="license-copy-ar rukhsty-license-ar text-[8px] font-bold sm:text-[9px]">{ar}</p>
        <p className="license-copy-en rukhsty-license-en text-[5px] font-bold sm:text-[6px]">{en}</p>
      </div>
    </div>
  );
}

function Emblem({ mono = false, size }: { mono?: boolean; size?: number }) {
  const sizeClass = mono ? "h-[clamp(34px,6.4vw,54px)] w-[clamp(34px,6.4vw,54px)]" : "h-[clamp(48px,9.2vw,78px)] w-[clamp(48px,9.2vw,78px)]";
  return (
    <img
      src="/assets/jordan-coat-of-arms.png"
      alt="Hashemite Kingdom emblem"
      className={`block object-contain ${size ? "" : sizeClass}`}
      style={size ? { width: size, height: size } : undefined}
      draggable={false}
    />
  );
}

function VehicleIcon({ kind }: { kind: string }) {
  if (kind === "motorcycle") return <CircleDot className="mx-auto h-3 w-3" />;
  if (kind === "construction") return <Construction className="mx-auto h-3 w-3" />;
  if (kind === "agricultural") return <Leaf className="mx-auto h-3 w-3" />;
  return <Car className="mx-auto h-3 w-3" />;
}

function Restriction({ number, labelEn, labelAr }: { number?: string; labelEn: string; labelAr: string }) {
  return (
    <div className="border-r border-[#1b3441]/80 px-1 py-0.5 last:border-r-0">
      {number && <span className="float-left text-[clamp(5px,.9vw,8px)]">{number}</span>}
      <p className="license-copy-ar rukhsty-license-ar" dir="rtl">{labelAr}</p>
      <p className="license-copy-en rukhsty-license-en">{labelEn}</p>
    </div>
  );
}

function QrVerification({ verify }: { verify: string }) {
  const { language } = useLanguage();
  return (
    <div className="mx-auto mt-5 flex w-full max-w-[220px] flex-col items-center rounded-xl bg-white p-3 shadow-sm print:shadow-none">
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(verify)}`}
        alt="Rukhsty license verification QR code"
        className="h-40 w-40"
      />
      <p className="mt-2 text-center text-xs font-bold text-[#0e5c3a]" dir={language === "ar" ? "rtl" : "ltr"}>
        {language === "ar" ? "تحقق عبر منصة رخصتي" : "Verify via Rukhsty"}
      </p>
    </div>
  );
}
