import React from "react";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useListNotifications, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { FileText, Calendar, Bell, CreditCard, ArrowRight, Shield, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { currentStepLabel, isMedicalBookingRequired, isPracticalBookingRequired, isTheoryBookingRequired, STATUS_COLORS, statusLabel } from "./application-utils";
import { DigitalLicenseCard } from "./digital-license-card";

const SERVICES = [
  { title: "Issue Driving License", titleAr: "استخراج رخصة قيادة", href: "/services/issue-driving-license", icon: CreditCard, description: "Apply for a new driving license" },
  { title: "Renew License", titleAr: "تجديد الرخصة", href: "/services/renew-driving-license", icon: Shield, description: "Renew your existing license" },
  { title: "Vehicle Registration", titleAr: "تجديد ترخيص المركبة", href: "/services/renew-vehicle-registration", icon: FileText, description: "Renew vehicle registration" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { language, isRTL } = useLanguage();
  const { data: summary, isLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: notifications } = useListNotifications({ query: { queryKey: getListNotificationsQueryKey() } });

  const unread = notifications?.filter((n: any) => !n.isRead) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const firstName = user?.profile?.firstName ?? user?.email?.split("@")[0] ?? "Citizen";
  const issuedLicense = (summary as any)?.myLicense;
  const hasIssuedLicense = Boolean(issuedLicense?.status === "ACTIVE" || issuedLicense);
  const activeApplication = (summary as any)?.activeApplication;
  const isRenewalApplication = activeApplication?.service?.code === "RENEW_DRIVING_LICENSE" || String(activeApplication?.status ?? "").startsWith("RENEWAL_") || activeApplication?.status === "LICENSE_RENEWED";

  return (
    <div className="space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, {firstName}</h1>
            <p className="text-muted-foreground text-sm mt-1" dir="rtl">أهلاً وسهلاً بك في منصة رخصتي</p>
          </div>
          {unread.length > 0 && (
            <Link href="/notifications">
              <Button variant="outline" size="sm" className="gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                {unread.length} unread notification{unread.length !== 1 ? "s" : ""}
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(
          [
            { label: language === "ar" ? "الطلبات" : "Applications", value: summary?.totalApplications ?? 0, icon: FileText, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
            { label: language === "ar" ? "المواعيد" : "Appointments", value: summary?.upcomingAppointments ?? 0, icon: Calendar, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30" },
            { label: language === "ar" ? "الإشعارات" : "Notifications", value: summary?.unreadNotifications ?? 0, icon: Bell, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
            { label: language === "ar" ? "الرخصة" : "License", value: hasIssuedLicense ? (language === "ar" ? "سارية" : "Active") : (language === "ar" ? "لا يوجد" : "None"), icon: CreditCard, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30" },
          ] as Array<{ label: string; value: React.ReactNode; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }>
        ).map((stat, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {hasIssuedLicense && issuedLicense && (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.14, type: "spring", stiffness: 120, damping: 16 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-950 via-emerald-800 to-slate-950 p-5 text-white shadow-sm"
        >
          <style>{`
            .rukhsty-firework {
              position: absolute;
              width: 7px;
              height: 7px;
              border-radius: 999px;
              background: #facc15;
              animation: rukhsty-firework-burst 1.8s ease-out infinite;
              box-shadow:
                0 -42px #fde68a, 30px -30px #34d399, 42px 0 #60a5fa, 30px 30px #fb7185,
                0 42px #fbbf24, -30px 30px #a78bfa, -42px 0 #22d3ee, -30px -30px #f472b6;
            }
            .rukhsty-firework:nth-child(2) { animation-delay: .45s; transform: scale(.8); }
            .rukhsty-firework:nth-child(3) { animation-delay: .9s; transform: scale(1.12); }
            @keyframes rukhsty-firework-burst {
              0% { opacity: 0; transform: scale(.15); filter: blur(0); }
              18% { opacity: 1; }
              100% { opacity: 0; transform: scale(1.45); filter: blur(.4px); }
            }
          `}</style>
          <span className="rukhsty-firework left-[8%] top-[18%]" />
          <span className="rukhsty-firework right-[11%] top-[22%]" />
          <span className="rukhsty-firework right-[22%] bottom-[22%]" />
          <div className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_640px] xl:items-center">
            <div>
              <Badge className="bg-amber-200 text-emerald-950 hover:bg-amber-200">LICENSE ISSUED</Badge>
              <h2 className="mt-3 text-3xl font-bold tracking-normal">Congratulations!</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
                Your driving license is active and ready. The digital card below carries your photo, license information, category, dates, and verification QR.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/my-license">
                  <Button className="bg-amber-100 text-emerald-950 hover:bg-amber-50">{language === "ar" ? "عرض الرخصة كاملة" : "Open Full License"}</Button>
                </Link>
                {activeApplication?.id && (
                  <Link href={`/applications/${activeApplication.id}/success`}>
                    <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">{language === "ar" ? "صفحة الاحتفال" : "Celebration Page"}</Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="rounded-2xl bg-white/95 p-3 shadow-2xl">
              <DigitalLicenseCard license={issuedLicense} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Application */}
      {activeApplication && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {language === "ar" ? "طلب نشط" : "Active Application"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-mono text-sm font-medium">{activeApplication.applicationNumber}</p>
                  <Badge className={`mt-1 text-xs ${STATUS_COLORS[activeApplication.status] ?? ""}`}>
                    {statusLabel(activeApplication.status, language)}
                  </Badge>
                  <p className="mt-2 text-xs text-muted-foreground">{currentStepLabel(activeApplication.currentStep, language)}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link href={`/applications/${activeApplication.id}`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      {language === "ar" ? "تتبع الطلب" : "Track Application"} <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                  {hasIssuedLicense && !isRenewalApplication && (
                    <>
                      <Link href="/my-license">
                        <Button size="sm" className="gap-1 bg-emerald-700 hover:bg-emerald-800">{language === "ar" ? "عرض رخصتي" : "View My License"}</Button>
                      </Link>
                      <Link href={`/applications/${activeApplication.id}/success`}>
                        <Button size="sm" variant="outline" className="gap-1">{language === "ar" ? "الاحتفال" : "Celebration"}</Button>
                      </Link>
                    </>
                  )}
                  {isMedicalBookingRequired(activeApplication) && (
                    <Link href={`/applications/${activeApplication.id}/book-medical`}>
                      <Button size="sm" className="gap-1 bg-emerald-700 hover:bg-emerald-800">
                        {language === "ar" ? "حجز فحص النظر" : "Book Medical / Vision Test"}
                      </Button>
                    </Link>
                  )}
                  {isRenewalApplication && activeApplication.status === "LICENSE_RENEWED" && (
                    <Link href="/my-license">
                      <Button size="sm" className="gap-1 bg-emerald-700 hover:bg-emerald-800">{language === "ar" ? "عرض الرخصة المجددة" : "View Renewed License"}</Button>
                    </Link>
                  )}
                  {!hasIssuedLicense && isTheoryBookingRequired(activeApplication) && (
                    <Link href={`/applications/${activeApplication.id}/book-theory`}>
                      <Button size="sm" className="gap-1 bg-emerald-700 hover:bg-emerald-800">
                        {language === "ar" ? "حجز الامتحان النظري" : "Book Theory Exam"}
                      </Button>
                    </Link>
                  )}
                  {!hasIssuedLicense && isPracticalBookingRequired(activeApplication) && (
                    <Link href={`/applications/${activeApplication.id}/book-practical`}>
                      <Button size="sm" className="gap-1 bg-emerald-700 hover:bg-emerald-800">
                        {language === "ar" ? "حجز الامتحان العملي" : "Book Practical Exam"}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              {hasIssuedLicense && !isRenewalApplication && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-white/70 p-3 dark:bg-background/60">
                  <p className="text-sm font-semibold">{language === "ar" ? "مبارك! تم إصدار رخصة القيادة بنجاح." : "Congratulations! Your driving license has been issued successfully."}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {language === "ar" ? "يمكنك الآن عرض رخصتك الرقمية أو فتح صفحة الاحتفال." : "You can now view your digital license or open the celebration page."}
                  </p>
                </div>
              )}
              {isRenewalApplication && activeApplication.status === "RENEWAL_MEDICAL_BOOKED" && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-white/70 p-3 dark:bg-background/60">
                  <p className="text-sm font-semibold">{language === "ar" ? "تم حجز فحص النظر" : "Medical / Vision Appointment Booked"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {language === "ar" ? "بعد تسجيل النتيجة من الموظف الطبي سيتم تجديد الرخصة تلقائياً عند الموافقة." : "Once the medical officer records an approved result, your license will renew automatically."}
                  </p>
                </div>
              )}
              {isRenewalApplication && activeApplication.status === "LICENSE_RENEWED" && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-white/70 p-3 dark:bg-background/60">
                  <p className="text-sm font-semibold">{language === "ar" ? "تم تجديد رخصة القيادة بنجاح." : "Your driving license has been renewed successfully."}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {language === "ar" ? "يمكنك عرض الرخصة المجددة من صفحة رخصتي." : "You can view the renewed license from My License."}
                  </p>
                </div>
              )}
              {!hasIssuedLicense && (activeApplication.status === "PRACTICAL_PASSED" || activeApplication.currentStep === "LICENSE_ISSUANCE") && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-white/70 p-3 dark:bg-background/60">
                  <p className="text-sm font-semibold">{language === "ar" ? "الرخصة قيد الإصدار" : "Waiting for License Issuance"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {language === "ar" ? "تم اجتياز الامتحان العملي. رخصتك قيد الإصدار." : "Your practical exam has been passed. Your license is pending issuance."}
                  </p>
                </div>
              )}
              {!hasIssuedLicense && (isMedicalBookingRequired(activeApplication) || isTheoryBookingRequired(activeApplication) || isPracticalBookingRequired(activeApplication)) && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-white/70 p-3 dark:bg-background/60">
                  <p className="text-sm font-semibold">{language === "ar" ? "الخطوة التالية" : "Next Step"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isPracticalBookingRequired(activeApplication)
                      ? language === "ar"
                        ? "احجز موعد الامتحان العملي لاستكمال طلبك."
                        : "Book your practical exam to continue your application."
                      : isTheoryBookingRequired(activeApplication)
                      ? language === "ar"
                        ? "احجز موعد الامتحان النظري لاستكمال طلبك."
                        : "Book your theory exam to continue your application."
                      : language === "ar"
                      ? "احجز موعد فحص النظر في أحد المراكز الصحية الحكومية لاستكمال طلبك."
                      : "Book your medical/vision test at a government health center to continue your application."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Services */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-lg font-semibold mb-4">Available Services</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {SERVICES.map((svc, i) => (
            <Link key={i} href={svc.href}>
              <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <svc.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm">{svc.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5" dir="rtl">{svc.titleAr}</p>
                  <p className="text-xs text-muted-foreground mt-2">{svc.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
