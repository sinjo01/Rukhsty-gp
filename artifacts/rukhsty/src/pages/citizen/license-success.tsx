import { getGetApplicationQueryKey, getGetMyLicenseQueryKey, useGetApplication, useGetMyLicense } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Download, Home, Printer, Sparkles, WalletCards } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { DigitalLicenseCard } from "./digital-license-card";

function downloadLicense(license: any, language: "en" | "ar") {
  const lines = [
    language === "ar" ? "تم إصدار رخصة القيادة بنجاح" : "Driving license issued successfully",
    `${language === "ar" ? "رقم الرخصة" : "License number"}: ${license.licenseNumber ?? "-"}`,
    `${language === "ar" ? "الاسم" : "Name"}: ${language === "ar" ? license.fullNameAr ?? license.fullNameEn : license.fullNameEn ?? license.fullNameAr}`,
    `${language === "ar" ? "الرقم الوطني" : "National ID"}: ${license.nationalId ?? "-"}`,
    `${language === "ar" ? "تاريخ الإصدار" : "Issue date"}: ${license.issueDate ?? "-"}`,
    `${language === "ar" ? "تاريخ الانتهاء" : "Expiry date"}: ${license.expiryDate ?? "-"}`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${license.licenseNumber ?? "rukhsty-license"}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function fetchApplicationLicense(applicationId: string) {
  const response = await fetch(`/api/applications/${applicationId}/license`, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message ?? `HTTP ${response.status}`);
  return data;
}

export default function LicenseSuccess({ params }: { params?: { id?: string } }) {
  const { data: license, isLoading } = useGetMyLicense({ query: { queryKey: getGetMyLicenseQueryKey() } });
  const { language, isRTL } = useLanguage();
  const applicationId = params?.id;
  const { data: app, isLoading: appLoading } = useGetApplication(applicationId ?? "", {
    query: { queryKey: getGetApplicationQueryKey(applicationId ?? ""), enabled: Boolean(applicationId) },
  });
  const { data: appLicense, isLoading: appLicenseLoading } = useQuery({
    queryKey: ["application-license", applicationId],
    enabled: Boolean(applicationId),
    queryFn: () => fetchApplicationLicense(applicationId!),
  });
  const displayLicense = (appLicense as any)?.license ?? license;
  const detail = app as any;

  if (isLoading || appLoading || appLicenseLoading) {
    return <div className="space-y-4"><Skeleton className="h-12 w-72" /><Skeleton className="h-96 rounded-2xl" /></div>;
  }

  if (!displayLicense || (applicationId && detail?.status !== "LICENSE_ISSUED" && !(appLicense as any)?.license)) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center" dir={isRTL ? "rtl" : "ltr"}>
        <WalletCards className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">{language === "ar" ? "لا توجد رخصة بعد" : "No License Yet"}</h1>
        <Link href="/dashboard"><Button className="mt-6">{language === "ar" ? "العودة للوحة الرئيسية" : "Back to Dashboard"}</Button></Link>
      </div>
    );
  }

  return (
    <div className="relative -m-6 min-h-[calc(100vh-4rem)] overflow-hidden bg-[#f7faf7] px-4 py-10 sm:px-8" dir={isRTL ? "rtl" : "ltr"}>
      <Confetti />
      <div className="relative mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-300 bg-[#0b3f31] text-amber-200 shadow-lg">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-4xl font-bold text-[#0b3f31] sm:text-5xl">{language === "ar" ? "مبارك!" : "Congratulations!"}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
            {language === "ar" ? "تم إصدار رخصة القيادة بنجاح." : "Your driving license has been issued successfully."}
          </p>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-500">
          {language === "ar" ? "لقد أكملت جميع مراحل الترخيص بنجاح، وأصبحت رخصتك الرقمية متاحة الآن." : "You have completed all licensing steps. Your digital license is now available."}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.2 }} className="mt-10">
          <DigitalLicenseCard license={displayLicense} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
          <Link href="/license-card">
            <Button className="gap-2 bg-[#0b3f31] hover:bg-[#092f25]"><WalletCards className="h-4 w-4" />{language === "ar" ? "عرض رخصتي" : "View My License"}</Button>
          </Link>
          <Button variant="outline" className="gap-2 border-amber-300 text-[#0b3f31]" onClick={() => downloadLicense(displayLicense as any, language)}><Download className="h-4 w-4" />{language === "ar" ? "تنزيل الرخصة" : "Download License"}</Button>
          <Button variant="outline" className="gap-2 border-amber-300 text-[#0b3f31]" onClick={() => window.print()}><Printer className="h-4 w-4" />{language === "ar" ? "طباعة الرخصة" : "Print License"}</Button>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2"><Home className="h-4 w-4" />{language === "ar" ? "العودة للوحة الرئيسية" : "Back to Dashboard"}</Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 46 }, (_, index) => ({
    left: `${(index * 19) % 100}%`,
    delay: (index % 12) * 0.12,
    duration: 2.8 + (index % 5) * 0.18,
    color: index % 3 === 0 ? "#d6a537" : index % 3 === 1 ? "#0b6b4b" : "#ffffff",
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((piece, index) => (
        <motion.span
          key={index}
          className="absolute h-2.5 w-2 rounded-sm shadow-sm"
          style={{ left: piece.left, top: -16, backgroundColor: piece.color }}
          initial={{ y: -20, rotate: 0, opacity: 0 }}
          animate={{ y: ["0vh", "92vh"], rotate: [0, 180, 360], opacity: [0, 1, 1, 0] }}
          transition={{ duration: piece.duration, delay: piece.delay, repeat: 1, repeatDelay: 0.35, ease: "easeOut" }}
        />
      ))}
      {[0, 1, 2].map((item) => (
        <motion.span
          key={`burst-${item}`}
          className="absolute rounded-full border-2 border-amber-300"
          style={{ left: `${26 + item * 22}%`, top: `${16 + (item % 2) * 12}%` }}
          initial={{ width: 0, height: 0, opacity: 0.7 }}
          animate={{ width: 130, height: 130, opacity: 0 }}
          transition={{ delay: 0.35 + item * 0.22, duration: 1.2, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
