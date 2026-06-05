import { Link } from "wouter";
import {
  ArrowRight,
  BadgeCheck,
  Car,
  CarFront,
  CheckCircle,
  FileText,
  Fingerprint,
  Languages,
  Leaf,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Activity,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Logo, LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";

const SERVICES: Array<{
  icon: LucideIcon;
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

const PROCESS_STEPS: Array<{ icon: LucideIcon; labelKey: TranslationKey }> = [
  { icon: FileText, labelKey: "processRegister" },
  { icon: FileText, labelKey: "processDocuments" },
  { icon: Stethoscope, labelKey: "processMedical" },
  { icon: FileText, labelKey: "processTheoryExam" },
  { icon: CarFront, labelKey: "processPracticalExam" },
  { icon: CheckCircle, labelKey: "processLicenseIssued" },
];

const STATS: Array<{ value: string; labelKey: TranslationKey }> = [
  { value: "50K+", labelKey: "statApplications" },
  { value: "12", labelKey: "statCenters" },
  { value: "98%", labelKey: "statSatisfaction" },
  { value: "48h", labelKey: "statProcessing" },
];

const TRUST: Array<{ icon: LucideIcon; labelKey: TranslationKey }> = [
  { icon: ShieldCheck, labelKey: "trustEncryption" },
  { icon: Clock, labelKey: "trustAvailable" },
  { icon: BadgeCheck, labelKey: "trustVerified" },
];

const FEATURES: Array<{
  icon: LucideIcon;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}> = [
  { icon: Fingerprint, titleKey: "featureSecurityTitle", descriptionKey: "featureSecurityDescription" },
  { icon: Activity, titleKey: "featureTrackingTitle", descriptionKey: "featureTrackingDescription" },
  { icon: Languages, titleKey: "featureBilingualTitle", descriptionKey: "featureBilingualDescription" },
  { icon: Leaf, titleKey: "featurePaperlessTitle", descriptionKey: "featurePaperlessDescription" },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
};

export default function Home() {
  const currentYear = new Date().getFullYear();
  const { isRTL, t, toggleLanguage } = useLanguage();
  const Arrow = ArrowRight;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-16 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo label={t("brandName")} markClassName="h-7 w-7" textClassName="text-xl" />

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 px-3 text-muted-foreground"
              onClick={toggleLanguage}
            >
              <Languages className="h-4 w-4" />
              {t("languageToggle")}
            </Button>
            <Link
              href="/login"
              className="hidden px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              {t("login")}
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full px-5 shadow-sm">
                {t("register")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="hero-aurora" />
          <div className="absolute inset-0 bg-grid -z-10" />

          <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pt-24">
            {/* Copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={cn("flex flex-col justify-center", isRTL ? "text-right" : "text-left")}
            >
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary",
                  isRTL && "ml-auto",
                )}
              >
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                {t("trustBadge")}
              </span>

              <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                {t("heroTitle")}
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {t("heroDescription")}
              </p>

              <div className={cn("mt-9 flex flex-col gap-3 sm:flex-row", isRTL && "sm:flex-row-reverse sm:justify-end")}>
                <Link href="/services/issue-driving-license">
                  <Button size="lg" className="group h-12 w-full rounded-full px-8 text-base shadow-lg shadow-primary/20 sm:w-auto">
                    {t("startApplication")}
                    <Arrow className={cn("h-4 w-4 transition-transform", isRTL ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1")} />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="h-12 w-full rounded-full border-border bg-background/60 px-8 text-base backdrop-blur sm:w-auto">
                    {t("trackApplication")}
                  </Button>
                </Link>
              </div>

              {/* Trust chips */}
              <div className={cn("mt-9 flex flex-wrap gap-x-6 gap-y-3", isRTL && "justify-end")}>
                {TRUST.map((item) => (
                  <div key={item.labelKey} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <item.icon className="h-4 w-4 text-accent" />
                    {t(item.labelKey)}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Showcase visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative mt-14 flex items-center justify-center lg:mt-0"
            >
              <div className="animate-float-soft relative w-full max-w-sm">
                {/* License card */}
                <div className="card-sheen relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl shadow-primary/30 ring-1 ring-white/10">
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                        <LogoMark tone="onDark" className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-semibold tracking-wide">{t("brandName")}</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent ring-1 ring-accent/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {t("licenseCardStatus")}
                    </span>
                  </div>

                  <p className="relative z-10 mt-8 text-xs uppercase tracking-[0.2em] text-white/60">
                    {t("licenseCardLabel")}
                  </p>
                  <p className="relative z-10 mt-1 text-lg font-semibold">{t("licenseCardName")}</p>

                  <div className="relative z-10 mt-7 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/50">{t("licenseCardCategory")}</p>
                      <p className="mt-0.5 font-mono text-base font-semibold tracking-widest">B</p>
                    </div>
                    <div className={cn(isRTL ? "text-left" : "text-right")}>
                      <p className="text-[10px] uppercase tracking-wider text-white/50">{t("licenseCardExpiry")}</p>
                      <p className="mt-0.5 font-mono text-base font-semibold tracking-widest">2030</p>
                    </div>
                  </div>
                </div>

                {/* Floating status pill */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className={cn(
                    "absolute -bottom-5 flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur",
                    isRTL ? "-left-4" : "-right-4",
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className={cn("leading-tight", isRTL && "text-right")}>
                    <p className="text-sm font-semibold text-foreground">{t("processLicenseIssued")}</p>
                    <p className="text-xs text-muted-foreground">{t("statProcessing")} · 48h</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Stats strip */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 divide-x divide-border rounded-3xl border border-border bg-card/70 backdrop-blur md:grid-cols-4 rtl:divide-x-reverse"
            >
              {STATS.map((stat) => (
                <div key={stat.labelKey} className="px-6 py-7 text-center">
                  <p className="text-3xl font-bold text-gradient-brand">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t(stat.labelKey)}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Process timeline ──────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">{t("processTitle")}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t("processHeading")}</h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
            <div className="grid grid-cols-2 gap-y-10 sm:grid-cols-3 md:grid-cols-6 md:gap-y-0">
              {PROCESS_STEPS.map((step, index) => (
                <motion.div
                  key={step.labelKey}
                  {...fadeUp}
                  transition={{ duration: 0.4, delay: index * 0.07 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm transition-colors">
                    <step.icon className="h-6 w-6" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                  </div>
                  <span className="mt-3 max-w-[7rem] text-sm font-medium text-muted-foreground">{t(step.labelKey)}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Services ──────────────────────────────────────────── */}
        <section className="border-y border-border bg-muted/40 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("servicesTitle")}</h2>
              <p className="mt-4 text-muted-foreground">{t("servicesDescription")}</p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
              {SERVICES.map((service, index) => (
                <motion.div key={service.href} {...fadeUp} transition={{ duration: 0.4, delay: index * 0.08 }}>
                  <Link href={service.href} className="group block h-full">
                    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                      <div className={cn("mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground", isRTL && "ml-auto")}>
                        <service.icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-lg font-semibold">{t(service.titleKey)}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{t(service.descriptionKey)}</p>
                      <span className={cn("mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary", isRTL && "flex-row-reverse justify-end")}>
                        {t("startService")}
                        <Arrow className={cn("h-4 w-4 transition-transform", isRTL ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1")} />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("featuresTitle")}</h2>
            <p className="mt-4 text-muted-foreground">{t("featuresDescription")}</p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.titleKey}
                {...fadeUp}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className={cn("rounded-3xl border border-border bg-card p-6 shadow-sm", isRTL && "text-right")}
              >
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent", isRTL && "ml-auto")}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{t(feature.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(feature.descriptionKey)}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── CTA band ──────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="card-sheen relative overflow-hidden rounded-[2rem] px-8 py-16 text-center text-white shadow-2xl shadow-primary/30 sm:px-16"
          >
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("ctaTitle")}</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/75">{t("ctaDescription")}</p>
              <div className={cn("mt-9 flex flex-col justify-center gap-3 sm:flex-row", isRTL && "sm:flex-row-reverse")}>
                <Link href="/register">
                  <Button size="lg" className="group h-12 w-full rounded-full bg-accent px-8 text-base font-semibold text-accent-foreground hover:bg-accent/90 sm:w-auto">
                    {t("ctaPrimary")}
                    <Arrow className={cn("h-4 w-4 transition-transform", isRTL ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1")} />
                  </Button>
                </Link>
                <Link href="/services">
                  <Button size="lg" variant="outline" className="h-12 w-full rounded-full border-white/25 bg-white/5 px-8 text-base text-white backdrop-blur hover:bg-white/10 hover:text-white sm:w-auto">
                    {t("ctaSecondary")}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-3">
            <div className={cn(isRTL && "text-right")}>
              <Logo label={t("brandName")} markClassName="h-7 w-7" textClassName="text-lg" />
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t("footerTagline")}</p>
              <div className={cn("mt-4 flex gap-2", isRTL && "justify-end")}>
                {TRUST.map((item) => (
                  <span key={item.labelKey} className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground" title={t(item.labelKey)}>
                    <item.icon className="h-4 w-4" />
                  </span>
                ))}
              </div>
            </div>

            <nav aria-label={t("quickLinks")} className={cn(isRTL && "text-right")}>
              <p className="text-sm font-semibold">{t("quickLinks")}</p>
              <div className="mt-4 grid gap-2.5 text-sm text-muted-foreground">
                <Link href="/" className="transition-colors hover:text-foreground">{t("home")}</Link>
                <Link href="/services" className="transition-colors hover:text-foreground">{t("services")}</Link>
                <Link href="/dashboard" className="transition-colors hover:text-foreground">{t("trackApplication")}</Link>
                <Link href="/login" className="transition-colors hover:text-foreground">{t("login")}</Link>
              </div>
            </nav>

            <div className={cn(isRTL ? "md:text-left" : "md:text-right")}>
              <p className="text-sm font-semibold">{t("poweredBy")}</p>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© {currentYear} {t("brandName")} · {t("footerTagline")}</span>
            <span>{t("trustVerified")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
