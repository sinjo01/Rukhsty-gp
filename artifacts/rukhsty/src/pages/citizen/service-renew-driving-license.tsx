import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitalLicenseCard } from "./digital-license-card";
import { currentStepLabel, STATUS_COLORS, statusLabel } from "./application-utils";
import { AlertCircle, CalendarCheck2, CheckCircle2, FileCheck2, Home, Stethoscope } from "lucide-react";

function authHeaders() {
  return {
    accept: "application/json",
    "content-type": "application/json",
    authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`,
  };
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message ?? `HTTP ${response.status}`);
  return data;
}

export default function ServiceRenewDrivingLicense() {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [application, setApplication] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["licenses-me-renewal"],
    queryFn: () => api<{ license: any }>("/api/licenses/me"),
  });
  const { data: applications } = useQuery({
    queryKey: ["renew-driving-license-applications"],
    queryFn: () => api<any[]>("/api/applications"),
  });
  const license = data?.license;
  const latestRenewalApplication = applications?.find((app) => app.service?.code === "RENEW_DRIVING_LICENSE" || String(app.status ?? "").startsWith("RENEWAL_") || app.status === "LICENSE_RENEWED");

  const t = {
    title: language === "ar" ? "تجديد رخصة القيادة" : "Renew Driving License",
    subtitle: language === "ar" ? "قدّم طلب التجديد ثم احجز فحص النظر. عند الموافقة الطبية يتم تجديد الرخصة تلقائياً." : "Submit your renewal request, then book the medical/vision test. Approved medical results renew the license automatically.",
    noLicense: language === "ar" ? "لا توجد رخصة قيادة مسجلة. يجب إصدار رخصة قيادة أولاً قبل التجديد." : "No driving license found. You need to issue a driving license first before renewal.",
    issue: language === "ar" ? "إصدار رخصة قيادة" : "Go to Issue Driving License",
    back: language === "ar" ? "العودة للخدمات" : "Back to Services",
    currentLicense: language === "ar" ? "الرخصة الحالية" : "Current License",
    submit: language === "ar" ? "تقديم طلب التجديد" : "Submit Renewal Request",
    bookMedical: language === "ar" ? "حجز فحص النظر" : "Book Medical / Vision Test",
    submitted: language === "ar" ? "تم تقديم طلب التجديد" : "Renewal request submitted",
    submittedHint: language === "ar" ? "الخطوة التالية هي حجز فحص النظر. عند اعتماد النتيجة سيتم تجديد الرخصة تلقائياً." : "Next step is booking the medical/vision test. Once approved, your license will be renewed automatically.",
  };

  const flow = [
    language === "ar" ? "تقديم طلب التجديد" : "Submit Renewal Request",
    language === "ar" ? "حجز فحص النظر" : "Book Medical / Vision",
    language === "ar" ? "اعتماد النتيجة الطبية" : "Medical Review",
    language === "ar" ? "تجديد الرخصة" : "License Renewed",
  ];

  async function startRenewal() {
    setBusy(true);
    try {
      const result = await api<any>("/api/services/renew-driving-license/apply", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setApplication(result.application);
      queryClient.invalidateQueries({ queryKey: ["licenses-me-renewal"] });
      queryClient.invalidateQueries({ queryKey: ["renew-driving-license-applications"] });
      queryClient.invalidateQueries({ queryKey: ["getDashboardSummary"] });
      toast({ title: result.duplicate ? (language === "ar" ? "يوجد طلب تجديد نشط" : "Active renewal found") : t.submitted });
    } catch (error) {
      toast({ variant: "destructive", title: language === "ar" ? "تعذر بدء التجديد" : "Could not start renewal", description: error instanceof Error ? error.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-80 rounded-2xl" /></div>;

  if (isError || !license) {
    return (
      <div className="mx-auto max-w-2xl space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{language === "ar" ? "لا توجد رخصة" : "No License Found"}</AlertTitle>
          <AlertDescription>{t.noLicense}</AlertDescription>
        </Alert>
        <div className="flex flex-wrap gap-3">
          <Link href="/services/issue-driving-license"><Button>{t.issue}</Button></Link>
          <Link href="/services"><Button variant="outline">{t.back}</Button></Link>
        </div>
      </div>
    );
  }

  const activeApplication = application ?? latestRenewalApplication;
  const isBooked = activeApplication?.status === "RENEWAL_MEDICAL_BOOKED";
  const isRenewed = activeApplication?.status === "LICENSE_RENEWED";

  return (
    <div className="mx-auto max-w-5xl space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          {flow.map((item, index) => (
            <div key={item} className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index === 0 || activeApplication ? "bg-emerald-700 text-white" : "bg-muted text-muted-foreground"}`}>
                {index + 1}
              </div>
              <span className="text-sm font-medium">{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {activeApplication && (
        <Alert className="border-emerald-200 bg-emerald-50">
          {isRenewed ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <CalendarCheck2 className="h-4 w-4 text-emerald-700" />}
          <AlertTitle>{isRenewed ? statusLabel("LICENSE_RENEWED", language) : t.submitted}</AlertTitle>
          <AlertDescription className="mt-1">
            <span className="block">{t.submittedHint}</span>
            <Badge className={`mt-2 ${STATUS_COLORS[activeApplication.status] ?? "bg-slate-100 text-slate-700"}`}>
              {statusLabel(activeApplication.status, language)} · {currentStepLabel(activeApplication.currentStep, language)}
            </Badge>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileCheck2 className="h-4 w-4 text-primary" />{t.currentLicense}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[280px_1fr]">
          <DigitalLicenseCard license={license} />
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label={language === "ar" ? "رقم الرخصة" : "License number"} value={license.licenseNumber} />
            <Info label={language === "ar" ? "الرقم الوطني" : "National ID"} value={license.nationalId} />
            <Info label={language === "ar" ? "الفئة" : "Category"} value={license.category ?? license.licenseCategory?.code} />
            <Info label={language === "ar" ? "الحالة" : "Status"} value={license.status} />
            <Info label={language === "ar" ? "تاريخ الإصدار" : "Issue date"} value={license.issueDate} />
            <Info label={language === "ar" ? "تاريخ الانتهاء" : "Expiry date"} value={license.expiryDate} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        {!activeApplication && (
          <Button className="gap-2" onClick={startRenewal} disabled={busy}>
            <FileCheck2 className="h-4 w-4" />
            {t.submit}
          </Button>
        )}
        {activeApplication && !isBooked && !isRenewed && (
          <Link href={`/applications/${activeApplication.id}/book-medical`}>
            <Button className="gap-2 bg-emerald-700 hover:bg-emerald-800">
              <Stethoscope className="h-4 w-4" />
              {t.bookMedical}
            </Button>
          </Link>
        )}
        {isBooked && (
          <Link href={`/applications/${activeApplication.id}`}>
            <Button className="gap-2" variant="outline">
              <CalendarCheck2 className="h-4 w-4" />
              {language === "ar" ? "تتبع الموعد" : "Track Appointment"}
            </Button>
          </Link>
        )}
        {isRenewed && (
          <Link href="/my-license">
            <Button className="gap-2 bg-emerald-700 hover:bg-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              {language === "ar" ? "عرض رخصتي" : "View My License"}
            </Button>
          </Link>
        )}
        <Link href="/dashboard">
          <Button variant="outline" className="gap-2"><Home className="h-4 w-4" />{language === "ar" ? "لوحة التحكم" : "Back to Dashboard"}</Button>
        </Link>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-lg border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value ?? "-"}</p></div>;
}
