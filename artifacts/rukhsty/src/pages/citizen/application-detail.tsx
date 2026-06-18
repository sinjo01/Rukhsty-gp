import { useState } from "react";
import {
  useBookAppointment,
  useGetApplication,
  getGetApplicationQueryKey,
  useListCenters,
  getListCentersQueryKey,
  getGetMyLicenseQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedGovernorate, localizedLabel } from "@/lib/locale-labels";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Circle, Clock, XCircle, Minus, Building2, Calendar, FileText, Activity, Stethoscope, Route, Sparkles, CreditCard, Truck } from "lucide-react";
import { currentStepLabel, examRebookingInfo, isMedicalBookingRequired, isPracticalBookingRequired, isTheoryBookingRequired, statusLabel } from "./application-utils";
import { DigitalLicenseCard } from "./digital-license-card";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PROFILE_SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  SECURITY_REVIEW: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  SECURITY_APPROVED: "bg-emerald-100 text-emerald-700",
  SECURITY_REJECTED: "bg-red-100 text-red-700",
  MEDICAL_BOOKING: "bg-purple-100 text-purple-700",
  MEDICAL_APPOINTMENT_BOOKED: "bg-purple-100 text-purple-700",
  MEDICAL_REJECTED: "bg-red-100 text-red-700",
  THEORY_BOOKING: "bg-blue-100 text-blue-700",
  THEORY_APPOINTMENT_BOOKED: "bg-blue-100 text-blue-700",
  PRACTICAL_BOOKING: "bg-amber-100 text-amber-700",
  PRACTICAL_APPOINTMENT_BOOKED: "bg-amber-100 text-amber-700",
  TRAINING_CENTER_SELECTED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  TRAINING_COMPLETED: "bg-green-100 text-green-700",
  MEDICAL_PASSED: "bg-green-100 text-green-700",
  MEDICAL_FAILED: "bg-red-100 text-red-700",
  THEORY_PASSED: "bg-green-100 text-green-700",
  THEORY_FAILED: "bg-red-100 text-red-700",
  PRACTICAL_PASSED: "bg-green-100 text-green-700",
  PRACTICAL_FAILED: "bg-red-100 text-red-700",
  LICENSE_ISSUED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

function StepIcon({ status }: { status: string }) {
  if (status === "COMPLETED") return <CheckCircle className="w-5 h-5 text-green-500" />;
  if (status === "ACTIVE") return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
  if (status === "FAILED") return <XCircle className="w-5 h-5 text-red-500" />;
  if (status === "SKIPPED") return <Minus className="w-5 h-5 text-slate-400" />;
  return <Circle className="w-5 h-5 text-slate-300" />;
}

function authHeaders() {
  return {
    accept: "application/json",
    "content-type": "application/json",
    authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`,
  };
}

function generateReferencePreview() {
  const date = new Date();
  const compact = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `RKH-${compact}-${Math.floor(100000 + Math.random() * 900000)}`;
}

function isLicensePaymentEligible(status?: string) {
  return ["PRACTICAL_PASSED", "LICENSE_ISSUANCE", "LICENSE_ISSUED"].includes(status ?? "");
}

function paymentStatusLabel(status: string | null | undefined, language: "en" | "ar") {
  if (status === "paid") return language === "ar" ? "مدفوع" : "Paid";
  return language === "ar" ? "بانتظار الدفع" : "Pending Payment";
}

function deliveryStatusLabel(status: string | null | undefined, language: "en" | "ar") {
  const labels: Record<string, { en: string; ar: string }> = {
    not_requested: { en: "Not requested", ar: "غير مطلوب" },
    pending_payment: { en: "Pending payment", ar: "بانتظار الدفع" },
    payment_confirmed: { en: "Payment confirmed", ar: "تم تأكيد الدفع" },
    preparing: { en: "Preparing", ar: "قيد التجهيز" },
    shipped: { en: "Shipped", ar: "تم الشحن" },
    delivered: { en: "Delivered", ar: "تم التسليم" },
    failed: { en: "Failed", ar: "فشل" },
  };
  const item = labels[status ?? "not_requested"] ?? labels.not_requested;
  return language === "ar" ? item.ar : item.en;
}

function validJordanPhone(phone: string) {
  return /^(?:07[789]\d{7}|\+9627[789]\d{7})$/.test(phone.trim());
}

export default function ApplicationDetail({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [paymentApplication, setPaymentApplication] = useState<any>(null);
  const [paymentLicense, setPaymentLicense] = useState<any>(null);
  const [referencePreview] = useState(generateReferencePreview);
  const { data: app, isLoading } = useGetApplication(params.id, {
    query: { queryKey: getGetApplicationQueryKey(params.id), enabled: !!params.id },
  });
  const bookAppointment = useBookAppointment();
  const rawDetail = app as any;
  const detail = paymentApplication ? { ...rawDetail, ...paymentApplication, license: paymentLicense ?? paymentApplication.license ?? rawDetail?.license } : rawDetail;
  const booking = getBookingConfig(detail?.currentStep);
  const centersParams = {
    centerType: booking?.centerType,
    governorate: detail?.governorate ?? undefined,
  };
  const { data: centers } = useListCenters(centersParams as any, {
    query: { queryKey: getListCentersQueryKey(centersParams), enabled: !!booking },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!app) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground">{language === "ar" ? "الطلب غير موجود" : "Application not found"}</p>
      <Link href="/applications"><Button variant="link">{language === "ar" ? "العودة إلى الطلبات" : "Back to Applications"}</Button></Link>
    </div>
  );

  const steps = detail.steps ?? [];
  const orderedSteps = [...steps].sort((a: any, b: any) => a.orderNumber - b.orderNumber);
  const completedSteps = orderedSteps.filter((step: any) => step.status === "COMPLETED").length;
  const activeStepIndex = Math.max(0, orderedSteps.findIndex((step: any) => step.status === "ACTIVE" || step.status === "FAILED"));
  const progressPercent = orderedSteps.length > 0 ? Math.round((completedSteps / orderedSteps.length) * 100) : 0;
  const appointments = detail.appointments ?? [];
  const exams = detail.exams ?? [];
  const rebooking = examRebookingInfo(detail);
  const displayLicense = paymentLicense ?? detail.license ?? null;
  const paymentStatus = displayLicense?.paymentStatus ?? detail.paymentStatus ?? "unpaid";
  const isPaid = paymentStatus === "paid";
  const showPaymentCard = isLicensePaymentEligible(detail.status) && !isPaid;
  const showIssuedLicense = Boolean(displayLicense) && isPaid;
  const deliveryMethod = displayLicense?.deliveryMethod ?? detail.deliveryMethod;
  const deliveryStatus = displayLicense?.deliveryStatus ?? detail.deliveryStatus;
  const aramexTrackingNumber = displayLicense?.aramexTrackingNumber ?? detail.aramexTrackingNumber;
  const referenceNumber = displayLicense?.paymentReference ?? detail.paymentReference ?? referencePreview;

  const handleBookAppointment = async () => {
    if (!booking || !selectedCenterId || !appointmentDate || !startTime) {
      toast({ variant: "destructive", title: "Please select a center, date, and time" });
      return;
    }

    const [hour, minute] = startTime.split(":").map(Number);
    const endTime = `${String(Math.min((hour || 9) + 1, 23)).padStart(2, "0")}:${String(minute || 0).padStart(2, "0")}`;

    try {
      await bookAppointment.mutateAsync({
        data: {
          applicationId: detail.id,
          centerId: selectedCenterId,
          appointmentType: booking.appointmentType,
          appointmentDate,
          startTime,
          endTime,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(params.id) });
      toast({ title: language === "ar" ? "تم حجز الموعد" : "Appointment booked", description: language === "ar" ? "تم حفظ الحجز بنجاح." : "Your booking was saved successfully." });
      setBookingOpen(false);
      setSelectedCenterId("");
    } catch (error) {
      toast({ variant: "destructive", title: "Booking failed", description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const handleMockPayment = async () => {
    const targetId = detail.license?.id ?? detail.id;
    setPaymentLoading(true);
    try {
      const response = await fetch(`/api/licenses/${targetId}/mock-pay`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? "Payment failed");
      setPaymentApplication(result?.data?.application ?? detail);
      setPaymentLicense(result?.data?.license ?? detail.license ?? null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(params.id) }),
        queryClient.invalidateQueries({ queryKey: getGetMyLicenseQueryKey() }),
      ]);
      toast({ title: language === "ar" ? "تم الدفع بنجاح، وتم إصدار رخصتك." : "Payment completed successfully. Your license has been issued." });
    } catch (error) {
      toast({ variant: "destructive", title: language === "ar" ? "فشل الدفع" : "Payment failed", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAramexDelivery = async () => {
    if (deliveryAddress.trim().length < 10) {
      toast({ variant: "destructive", title: language === "ar" ? "العنوان مطلوب" : "Address is required", description: language === "ar" ? "أدخل عنواناً من 10 أحرف على الأقل." : "Enter at least 10 characters." });
      return;
    }
    if (!deliveryCity.trim()) {
      toast({ variant: "destructive", title: language === "ar" ? "المدينة مطلوبة" : "City is required" });
      return;
    }
    if (!validJordanPhone(deliveryPhone)) {
      toast({ variant: "destructive", title: language === "ar" ? "رقم الهاتف غير صحيح" : "Invalid phone number", description: "0791234567, 0781234567, 0771234567, or +962..." });
      return;
    }

    const targetId = detail.license?.id ?? detail.id;
    setDeliveryLoading(true);
    try {
      const response = await fetch(`/api/licenses/${targetId}/delivery/aramex`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ deliveryAddress, deliveryCity, deliveryPhone }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? "Delivery request failed");
      setPaymentApplication(result?.application ?? detail);
      setPaymentLicense(result?.license ?? detail.license ?? null);
      setShowDeliveryForm(false);
      await queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(params.id) });
      toast({ title: language === "ar" ? "تم حفظ طلب التوصيل" : "Delivery request saved" });
    } catch (error) {
      toast({ variant: "destructive", title: language === "ar" ? "فشل طلب التوصيل" : "Delivery request failed", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setDeliveryLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Link href="/applications">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold font-mono">{detail.applicationNumber}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`text-xs ${STATUS_COLORS[detail.status] ?? "bg-slate-100 text-slate-700"}`}>
              {statusLabel(detail.status, language)}
            </Badge>
            <span className="text-xs text-muted-foreground">{detail.service?.nameEn ?? "Driving License"}</span>
          </div>
        </div>
      </motion.div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{language === "ar" ? "ملخص الطلب" : "Application summary"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[
            [language === "ar" ? "نوع الخدمة" : "Service", language === "ar" ? detail.service?.nameAr : detail.service?.nameEn],
            [language === "ar" ? "اسم المواطن" : "Citizen name", [detail.profile?.firstName, detail.profile?.secondName, detail.profile?.thirdName, detail.profile?.familyName].filter(Boolean).join(" ")],
            [language === "ar" ? "الرقم الوطني" : "National ID", detail.profile?.nationalId],
            [language === "ar" ? "فئة الرخصة" : "License category", language === "ar" ? detail.licenseCategory?.nameAr : detail.licenseCategory?.nameEn],
            [language === "ar" ? "الخطوة الحالية" : "Current step", currentStepLabel(detail.currentStep, language)],
            [language === "ar" ? "تاريخ التقديم" : "Submitted date", detail.submittedAt ? new Date(detail.submittedAt).toLocaleDateString() : "—"],
            [language === "ar" ? "آخر تحديث" : "Last updated", detail.updatedAt ? new Date(detail.updatedAt).toLocaleDateString() : "—"],
            [language === "ar" ? "الإجراء التالي" : "Next required action", isMedicalBookingRequired(detail) ? (language === "ar" ? "حجز فحص النظر" : "Book Medical / Vision Test") : isTheoryBookingRequired(detail) ? (language === "ar" ? "حجز الامتحان النظري" : "Book Theory Exam") : isPracticalBookingRequired(detail) ? (language === "ar" ? "حجز الامتحان العملي" : "Book Practical Exam") : currentStepLabel(detail.currentStep, language)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-sm font-medium">{value || "—"}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Step Tracker */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="overflow-hidden border-emerald-100">
          <CardHeader className="border-b bg-gradient-to-br from-emerald-950 via-emerald-800 to-slate-900 pb-5 text-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Route className="h-5 w-5 text-amber-100" />
                  {language === "ar" ? "تتبع مراحل الطلب" : "Application Tracking"}
                </CardTitle>
                <p className="mt-2 text-sm text-white/75">
                  {language === "ar" ? "تابع المرحلة الحالية والإنجازات السابقة في طلبك." : "Follow your current stage and completed milestones."}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm">
                <p className="text-white/70">{language === "ar" ? "نسبة الإنجاز" : "Progress"}</p>
                <p className="text-2xl font-bold">{progressPercent}%</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{language === "ar" ? "البداية" : "Start"}</span>
                <span>{language === "ar" ? "إصدار الرخصة" : "License issued"}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-amber-400 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {orderedSteps.map((step: any, i: number) => {
                const isCurrent = step.status === "ACTIVE" || i === activeStepIndex;
                const isCompleted = step.status === "COMPLETED";
                const isFailed = step.status === "FAILED";
                return (
                  <div
                    key={step.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      isFailed
                        ? "border-red-200 bg-red-50"
                        : isCurrent
                        ? "border-emerald-300 bg-emerald-50 shadow-sm"
                        : isCompleted
                        ? "border-emerald-100 bg-white"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                        isFailed
                          ? "border-red-200 bg-white text-red-600"
                          : isCompleted
                          ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                          : isCurrent
                          ? "border-emerald-300 bg-white text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-400"
                      }`}>
                        {isCurrent && !isFailed ? <Sparkles className="h-5 w-5" /> : <StepIcon status={step.status} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold ${isFailed ? "text-red-800" : isCurrent ? "text-emerald-950" : "text-slate-900"}`}>
                          {language === "ar" ? step.stepNameAr : step.stepNameEn}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${
                            isCurrent ? "border-emerald-300 text-emerald-700" : isCompleted ? "border-emerald-200 text-emerald-700" : isFailed ? "border-red-300 text-red-700" : ""
                          }`}>
                            {translateStepStatus(step.status, language)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{language === "ar" ? "مرحلة" : "Step"} {i + 1} / {orderedSteps.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {rebooking && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-red-900">
                {rebooking.examType === "THEORY"
                  ? language === "ar" ? "لم يتم اجتياز الامتحان النظري" : "Theory exam was not passed"
                  : language === "ar" ? "لم يتم اجتياز الامتحان العملي" : "Practical exam was not passed"}
              </p>
              <p className="mt-1 text-sm text-red-800">
                {language === "ar"
                  ? `يظهر الرسوب في مسار الطلب. يمكنك اختيار موعد امتحان جديد بتاريخ ${rebooking.earliestDate} أو بعده، بعد 14 يوماً من تاريخ الامتحان السابق.`
                  : `The failed result is recorded in your application tracking. You can choose a new exam appointment on or after ${rebooking.earliestDate}, 14 days after the previous exam.`}
              </p>
            </div>
            <Link href={`/applications/${detail.id}/${rebooking.examType === "THEORY" ? "book-theory" : "book-practical"}`}>
              <Button className="shrink-0 bg-red-700 hover:bg-red-800">
                {language === "ar" ? "اختيار موعد جديد" : "Choose New Appointment"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {booking && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-medium text-sm">{language === "ar" ? booking.labelAr : booking.label}</p>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "اختر المركز المعتمد والوقت المناسب." : "Choose an authorized center and available time."}</p>
            </div>
            {isMedicalBookingRequired(detail) ? (
              <Link href={`/applications/${detail.id}/book-medical`}>
                <Button className="bg-emerald-700 hover:bg-emerald-800">{language === "ar" ? booking.buttonAr : booking.button}</Button>
              </Link>
            ) : isTheoryBookingRequired(detail) ? (
              <Link href={`/applications/${detail.id}/book-theory`}>
                <Button className="bg-emerald-700 hover:bg-emerald-800">{language === "ar" ? booking.buttonAr : booking.button}</Button>
              </Link>
            ) : isPracticalBookingRequired(detail) ? (
              <Link href={`/applications/${detail.id}/book-practical`}>
                <Button className="bg-emerald-700 hover:bg-emerald-800">{language === "ar" ? booking.buttonAr : booking.button}</Button>
              </Link>
            ) : (
              <Button onClick={() => setBookingOpen(true)}>{language === "ar" ? booking.buttonAr : booking.button}</Button>
            )}
          </CardContent>
        </Card>
      )}

      {detail.currentStep === "LICENSE_ISSUANCE" && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="font-medium text-sm text-amber-900">{language === "ar" ? "بانتظار إصدار الرخصة من موظف الترخيص" : "Waiting for license issuance"}</p>
            <p className="text-xs text-amber-800 mt-1">{language === "ar" ? "اكتملت نتيجة الامتحان العملي، ويجب على موظف مخول إصدار الرخصة الرقمية." : "Your practical result is complete. An authorized officer must issue the digital license."}</p>
          </CardContent>
        </Card>
      )}

      {detail.status === "LICENSE_ISSUED" && isPaid && (
        <Card className="overflow-hidden border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-bold text-lg text-emerald-950 dark:text-emerald-100">{language === "ar" ? "تم إصدار رخصتك بنجاح." : "Your license has been issued successfully."}</p>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-1">{language === "ar" ? "يمكنك الآن عرض الرخصة الرقمية أو فتح صفحة التهنئة." : "You can now view your digital license or open the congratulations page."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/my-license"><Button className="bg-emerald-700 hover:bg-emerald-800">{language === "ar" ? "عرض الرخصة" : "View License"}</Button></Link>
              <Link href={`/applications/${detail.id}/success`}><Button variant="outline">{language === "ar" ? "فتح صفحة التهنئة" : "Open Congratulations Page"}</Button></Link>
              <Link href="/dashboard"><Button variant="outline">{language === "ar" ? "العودة للوحة الرئيسية" : "Back to Dashboard"}</Button></Link>
            </div>
          </CardContent>
        </Card>
      )}

      {(showIssuedLicense || showPaymentCard || isLicensePaymentEligible(detail.status)) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden border-emerald-100 bg-white shadow-sm">
            <CardHeader className="border-b bg-emerald-50/70">
              <CardTitle className="flex items-center gap-2 text-base text-emerald-900">
                <CreditCard className="h-5 w-5" />
                {language === "ar" ? "الدفع والتوصيل" : "Payment and Delivery"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
              {showIssuedLicense && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3 sm:p-5">
                  <DigitalLicenseCard license={displayLicense} />
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{language === "ar" ? "طريقة الدفع" : "Payment method"}</p>
                  <p className="mt-1 font-semibold">eFAWATEERcom</p>
                </div>
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{language === "ar" ? "رقم المرجع" : "Reference Number"}</p>
                  <p className="mt-1 font-mono text-sm font-semibold">{referenceNumber}</p>
                </div>
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{language === "ar" ? "المبلغ" : "Amount"}</p>
                  <p className="mt-1 font-semibold">3.00 JOD</p>
                </div>
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{language === "ar" ? "حالة الدفع" : "Payment Status"}</p>
                  <Badge className={`mt-2 ${isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {paymentStatusLabel(paymentStatus, language)}
                  </Badge>
                </div>
              </div>

              {showPaymentCard && (
                <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-emerald-950">{language === "ar" ? "ادفع رسوم الرخصة عبر إي فواتيركم" : "Pay License Fees via eFAWATEERcom"}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {language === "ar" ? "هذا دفع تجريبي للعرض فقط ولا ينتقل إلى أي موقع خارجي." : "This is a graduation-demo payment. No external payment website will open."}
                      </p>
                    </div>
                    <Button onClick={handleMockPayment} disabled={paymentLoading} className="bg-emerald-700 hover:bg-emerald-800">
                      {paymentLoading ? (language === "ar" ? "جارٍ الدفع..." : "Paying...") : (language === "ar" ? "ادفع عبر إي فواتيركم" : "Pay by eFAWATEERcom")}
                    </Button>
                  </div>
                </div>
              )}

              {isPaid && <div className="rounded-2xl border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-emerald-950">
                      <Truck className="h-4 w-4" />
                      {language === "ar" ? "التوصيل عبر أرامكس" : "Aramex Delivery"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {deliveryMethod === "aramex"
                        ? language === "ar" ? "تم اختيار التوصيل عبر أرامكس." : "Aramex delivery has been selected."
                        : language === "ar" ? "اختياري ولا يمنع إصدار الرخصة." : "Optional and does not block license issuing."}
                    </p>
                  </div>
                  {deliveryMethod !== "aramex" && (
                    <Link href={`/delivery/aramex/${displayLicense?.id ?? detail.id}`}>
                      <Button variant="outline">
                        {language === "ar" ? "التوصيل عبر أرامكس" : "Deliver by Aramex"}
                      </Button>
                    </Link>
                  )}
                </div>

                {deliveryMethod === "aramex" && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "طريقة التوصيل" : "Delivery Method"}</p>
                      <p className="mt-1 font-medium">Aramex</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "حالة التوصيل" : "Delivery Status"}</p>
                      <p className="mt-1 font-medium">{deliveryStatusLabel(deliveryStatus, language)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "رقم التتبع" : "Tracking Number"}</p>
                      <Link href={`/delivery/aramex/${displayLicense?.id ?? detail.id}`}>
                        <p className="mt-1 cursor-pointer font-mono text-sm font-medium text-emerald-700 underline-offset-4 hover:underline">{aramexTrackingNumber || (language === "ar" ? "فتح التوصيل" : "Open delivery")}</p>
                      </Link>
                    </div>
                  </div>
                )}

              </div>}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Training Record */}
      {detail.trainingRecord && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-amber-500" />{language === "ar" ? "التدريب" : "Training"}</CardTitle>
            </CardHeader>
            <CardContent>
              {detail.trainingRecord.center && (
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{language === "ar" ? detail.trainingRecord.center.nameAr : detail.trainingRecord.center.nameEn}</span>
                  <span className="text-muted-foreground">· {localizedGovernorate(detail.trainingRecord.center.governorate, language)}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{language === "ar" ? "الدروس النظرية" : "Theory Lessons"}</p>
                  <p className="font-semibold">{detail.trainingRecord.theoreticalLessonsCompleted} / {detail.trainingRecord.theoreticalLessonsRequired}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{language === "ar" ? "الدروس العملية" : "Practical Lessons"}</p>
                  <p className="font-semibold">{detail.trainingRecord.practicalLessonsCompleted} / {detail.trainingRecord.practicalLessonsRequired}</p>
                </div>
              </div>
              <Badge className={`mt-3 text-xs ${detail.trainingRecord.status === "COMPLETED" ? "bg-green-100 text-green-700" : detail.trainingRecord.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                {localizedLabel(detail.trainingRecord.status, language)}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Medical Test */}
      {detail.medicalTest && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Stethoscope className="w-4 h-4 text-purple-500" />{language === "ar" ? "الفحص الطبي" : "Medical Test"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">{language === "ar" ? "النتيجة" : "Result"}</p><Badge className={`mt-1 text-xs ${["DOES_NOT_NEED_GLASSES", "NEEDS_GLASSES", "PASS_NO_GLASSES", "PASS_WITH_GLASSES"].includes(detail.medicalTest.result) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{localizedLabel(detail.medicalTest.result, language)}</Badge></div>
                <div><p className="text-xs text-muted-foreground">{language === "ar" ? "العين اليسرى" : "Left Eye"}</p><p className="font-medium">{detail.medicalTest.leftEyeScore ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">{language === "ar" ? "العين اليمنى" : "Right Eye"}</p><p className="font-medium">{detail.medicalTest.rightEyeScore ?? "—"}</p></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Exams */}
      {exams.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">{language === "ar" ? "الامتحانات" : "Exams"}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exams.map((exam: any) => (
                  <div key={exam.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{localizedLabel(exam.examType, language)} — {language === "ar" ? "المحاولة" : "Attempt"} #{exam.attemptNumber}</p>
                      {exam.score && <p className="text-xs text-muted-foreground">{language === "ar" ? "العلامة" : "Score"}: {exam.score} / {exam.maxScore}</p>}
                    </div>
                    <Badge className={`text-xs ${exam.result === "PASSED" ? "bg-green-100 text-green-700" : exam.result === "FAILED" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                      {localizedLabel(exam.result, language)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Appointments */}
      {appointments.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" />{language === "ar" ? "المواعيد" : "Appointments"}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appointments.map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{localizedLabel(apt.appointmentType, language)}</p>
                      <p className="text-xs text-muted-foreground">{apt.appointmentDate} · {apt.startTime} – {apt.endTime}</p>
                      {apt.center && <p className="text-xs text-muted-foreground">{language === "ar" ? apt.center.nameAr : apt.center.nameEn}</p>}
                      {apt.queueNumber && <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">{language === "ar" ? "الدور" : "Queue"} #{apt.queueNumber}</p>}
                    </div>
                    <Badge className={`text-xs ${apt.status === "BOOKED" ? "bg-blue-100 text-blue-700" : apt.status === "COMPLETED" ? "bg-green-100 text-green-700" : apt.status === "CANCELLED" ? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-700"}`}>
                      {localizedLabel(apt.status, language)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Documents */}
      {detail.documents?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" />{language === "ar" ? "المستندات" : "Documents"}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {detail.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{doc.documentType?.replace(/_/g, " ")}</p>
                    <Badge className={`text-xs ${doc.verificationStatus === "APPROVED" ? "bg-green-100 text-green-700" : doc.verificationStatus === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {doc.verificationStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{booking ? (language === "ar" ? booking.buttonAr : booking.button) : "Book Appointment"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={selectedCenterId} onValueChange={setSelectedCenterId}>
              <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر المركز" : "Select center"} /></SelectTrigger>
              <SelectContent>
                {centers?.map((center: any) => (
                  <SelectItem key={center.id} value={center.id}>{center.nameEn} - {center.governorate}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={appointmentDate} min={new Date().toISOString().split("T")[0]} onChange={(event) => setAppointmentDate(event.target.value)} />
            <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleBookAppointment} disabled={bookAppointment.isPending}>
              {bookAppointment.isPending ? (language === "ar" ? "جارٍ الحجز..." : "Booking...") : (language === "ar" ? "تأكيد الحجز" : "Confirm Booking")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getBookingConfig(step?: string) {
  switch (step) {
    case "MEDICAL_BOOKING":
    case "MEDICAL_TEST":
      return { button: "Book Medical / Vision Test", buttonAr: "حجز فحص النظر", label: "Medical / vision test appointment", labelAr: "موعد فحص النظر", appointmentType: "MEDICAL_TEST", centerType: "HEALTH_CENTER" };
    case "THEORY_BOOKING":
    case "THEORY_EXAM":
      return { button: "Book Theory Exam", buttonAr: "حجز الامتحان النظري", label: "Theory exam appointment", labelAr: "موعد الامتحان النظري", appointmentType: "THEORY_EXAM", centerType: "EXAM_CENTER" };
    case "PRACTICAL_BOOKING":
    case "PRACTICAL_EXAM":
      return { button: "Book Practical Exam", buttonAr: "حجز الامتحان العملي", label: "Practical exam appointment", labelAr: "موعد الامتحان العملي", appointmentType: "PRACTICAL_EXAM", centerType: "PRACTICAL_EXAM_CENTER" };
    default:
      return null;
  }
}

function translateStepStatus(status: string, language: "en" | "ar") {
  if (language === "en") return status;
  const map: Record<string, string> = {
    PENDING: "قيد الانتظار",
    ACTIVE: "قيد الإجراء",
    COMPLETED: "مكتمل",
    FAILED: "فشل / مرفوض",
    SKIPPED: "تم تجاوزه",
  };
  return map[status] ?? status;
}
