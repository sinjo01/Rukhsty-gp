import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMyLicense, getGetMyLicenseQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CreditCard, Download, Home, Printer } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { DigitalLicenseCard } from "./digital-license-card";

function referencePreview() {
  const date = new Date();
  const compact = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `RKH-${compact}-${Math.floor(100000 + Math.random() * 900000)}`;
}

function downloadLicense(license: any, language: "en" | "ar") {
  const content = [
    language === "ar" ? "رخصة قيادة رقمية" : "Digital Driving License",
    `${language === "ar" ? "رقم الرخصة" : "License number"}: ${license.licenseNumber ?? "-"}`,
    `${language === "ar" ? "الرقم الوطني" : "National ID"}: ${license.nationalId ?? "-"}`,
    `${language === "ar" ? "الاسم" : "Name"}: ${language === "ar" ? license.fullNameAr ?? license.fullNameEn : license.fullNameEn ?? license.fullNameAr}`,
    `${language === "ar" ? "تاريخ الإصدار" : "Issue date"}: ${license.issueDate ?? "-"}`,
    `${language === "ar" ? "تاريخ الانتهاء" : "Expiry date"}: ${license.expiryDate ?? "-"}`,
    `${language === "ar" ? "الحالة" : "Status"}: ${license.status ?? "-"}`,
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${license.licenseNumber ?? "rukhsty-license"}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function LicenseCard() {
  const queryClient = useQueryClient();
  const { data: license, isLoading } = useGetMyLicense({ query: { queryKey: getGetMyLicenseQueryKey() } });
  const { language, isRTL } = useLanguage();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paidLicense, setPaidLicense] = useState<any>(null);
  const [preview] = useState(referencePreview);
  const displayLicense = paidLicense ?? license;
  const isPaid = (displayLicense as any)?.paymentStatus === "paid";

  const handlePayment = async () => {
    if (!(displayLicense as any)?.id) return;
    setPaymentLoading(true);
    try {
      const response = await fetch(`/api/licenses/${(displayLicense as any).id}/mock-pay`, {
        method: "PATCH",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`,
        },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? "Payment failed");
      setPaidLicense(result?.data?.license ?? displayLicense);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetMyLicenseQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
      ]);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-80 rounded-2xl" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{language === "ar" ? "رخصة القيادة الرقمية" : "Digital Driving License"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{language === "ar" ? "بطاقة رسمية رقمية بتصميم آمن وجاهزة للعرض." : "A secure, official-style digital card ready for display."}</p>
        </div>
        {displayLicense && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => downloadLicense(displayLicense as any, language)}><Download className="h-4 w-4" />{language === "ar" ? "تنزيل الرخصة" : "Download License"}</Button>
            <Button variant="outline" className="gap-2" onClick={() => window.print()}><Printer className="h-4 w-4" />{language === "ar" ? "طباعة الرخصة" : "Print License"}</Button>
          </div>
        )}
      </motion.div>

      {!displayLicense ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">{language === "ar" ? "لا توجد رخصة صادرة بعد." : "No issued license yet."}</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
            {language === "ar" ? "أكمل طلب رخصة القيادة لاستلام الرخصة الرقمية." : "Complete your driving license application to receive your digital license card."}
          </p>
          <Link href="/services/issue-driving-license">
            <Button className="mt-6">{language === "ar" ? "ابدأ طلباً جديداً" : "Start Application"}</Button>
          </Link>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 }}>
          <Card className="overflow-hidden border-emerald-200 bg-white shadow-sm">
            <CardContent className="p-4 sm:p-8">
              <DigitalLicenseCard license={displayLicense} />
              {!isPaid && (
                <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-emerald-950">{language === "ar" ? "ادفع رسوم الرخصة عبر إي فواتيركم" : "Pay License Fees via eFAWATEERcom"}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {language === "ar" ? "المرجع" : "Reference"}: <span className="font-mono">{(displayLicense as any).paymentReference ?? preview}</span> · 3.00 JOD
                      </p>
                    </div>
                    <Button onClick={handlePayment} disabled={paymentLoading} className="bg-emerald-700 hover:bg-emerald-800">
                      {paymentLoading ? (language === "ar" ? "جارٍ الدفع..." : "Paying...") : (language === "ar" ? "ادفع عبر إي فواتيركم" : "Pay by eFAWATEERcom")}
                    </Button>
                  </div>
                </div>
              )}
              <div className="mt-6 flex justify-center">
                <Link href="/dashboard">
                  <Button variant="outline" className="gap-2"><Home className="h-4 w-4" />{language === "ar" ? "العودة للوحة الرئيسية" : "Back to Dashboard"}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
