import { Link } from "wouter";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Car,
  CarFront,
  CheckCircle,
  ChevronRight,
  FileText,
  RefreshCw,
  Shield,
  Stethoscope,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";

const SERVICES: Array<{
  icon: typeof BadgeCheck;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  href: string;
}> = [
  {
    icon: BadgeCheck,
    titleKey: "issueDrivingLicense",
    descriptionKey: "issueDrivingLicenseDescription",
    href: "/services/issue-driving-license",
  },
  {
    icon: RefreshCw,
    titleKey: "renewDrivingLicense",
    descriptionKey: "renewDrivingLicenseDescription",
    href: "/services/renew-driving-license",
  },
  {
    icon: Car,
    titleKey: "renewVehicleRegistration",
    descriptionKey: "renewVehicleRegistrationDescription",
    href: "/services/renew-vehicle-registration",
  },
];

const PROCESS_STEPS: Array<{
  icon: typeof FileText;
  labelKey: TranslationKey;
}> = [
  { icon: FileText, labelKey: "processRegister" },
  { icon: FileText, labelKey: "processDocuments" },
  { icon: Activity, labelKey: "processTraining" },
  { icon: Stethoscope, labelKey: "processMedical" },
  { icon: FileText, labelKey: "processTheoryExam" },
  { icon: CarFront, labelKey: "processPracticalExam" },
  { icon: CheckCircle, labelKey: "processLicenseIssued" },
];

export default function Home() {
  const currentYear = new Date().getFullYear();
  const { isRTL, t, toggleLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col font-sans">
      <header className="h-16 border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="w-6 h-6" />
            <span className="font-bold text-xl tracking-tight">{t("brandName")}</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="outline" size="sm" className="h-8 px-3" onClick={toggleLanguage}>
              {t("languageToggle")}
            </Button>
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("login")}
            </Link>
            <Link href="/register" className="text-sm font-medium">
              <Button size="sm" className="rounded-full px-5">
                {t("register")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 -z-10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary mb-3">
                {t("heroSubtitle")}
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-6">
                {t("heroTitle")}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                {t("heroDescription")}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/services/issue-driving-license">
                  <Button size="lg" className="rounded-full px-8 text-base h-12 w-full sm:w-auto group">
                    {isRTL && <ArrowRight className="mr-2 w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-1" />}
                    {t("startApplication")}
                    {!isRTL && <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />}
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="rounded-full px-8 text-base h-12 w-full sm:w-auto">
                    {t("trackApplication")}
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-24 max-w-4xl mx-auto"
            >
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
                {t("processTitle")}
              </h3>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                {PROCESS_STEPS.map((step, index) => (
                  <div key={step.labelKey} className="flex items-center">
                    <div className="flex flex-col items-center gap-2 w-24">
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary relative z-10">
                        <step.icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-center text-muted-foreground">{t(step.labelKey)}</span>
                    </div>
                    {index < PROCESS_STEPS.length - 1 && (
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 text-slate-300 dark:text-slate-700 -mx-3 relative z-0 hidden sm:block",
                          isRTL && "rotate-180",
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="bg-slate-100/70 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl mx-auto text-center mb-10"
            >
              <h2 className="text-3xl font-bold text-foreground">{t("servicesTitle")}</h2>
              <p className="mt-4 text-muted-foreground">{t("servicesDescription")}</p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
              {SERVICES.map((service, index) => (
                <motion.div
                  key={service.href}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                >
                  <Card className="h-full rounded-2xl border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                    <CardHeader className={cn(isRTL && "text-right")}>
                      <div
                        className={cn(
                          "mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary",
                          isRTL && "mr-0 ml-auto",
                        )}
                      >
                        <service.icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg">{t(service.titleKey)}</CardTitle>
                      <CardDescription className="leading-relaxed">{t(service.descriptionKey)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={service.href}>
                        <Button className="w-full gap-2">
                          {isRTL && <ArrowRight className="h-4 w-4 rotate-180" />}
                          {t("startService")}
                          {!isRTL && <ArrowRight className="h-4 w-4" />}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-accent" />
                <span className="text-lg font-bold">{t("brandName")}</span>
              </div>
              <p className="mt-3 text-sm text-white/70">{t("footerTagline")}</p>
            </div>

            <nav aria-label={t("quickLinks")}>
              <p className="font-semibold">{t("quickLinks")}</p>
              <div className="mt-3 grid gap-2 text-sm text-white/75">
                <Link href="/" className="hover:text-white">
                  {t("home")}
                </Link>
                <Link href="/services" className="hover:text-white">
                  {t("services")}
                </Link>
                <Link href="/dashboard" className="hover:text-white">
                  {t("trackApplication")}
                </Link>
                <Link href="/login" className="hover:text-white">
                  {t("login")}
                </Link>
              </div>
            </nav>

            <div className={cn(isRTL ? "md:text-left" : "md:text-right")}>
              <p className="font-semibold">{t("poweredBy")}</p>
            </div>
          </div>

          <div className="mt-10 border-t border-white/15 pt-5 text-xs text-white/60 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{currentYear}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
