import { useState } from "react";
import { Link } from "wouter";
import { useGetOfficerDashboard, getGetOfficerDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { Calendar, CheckCircle, Clock, Building2, User, Search, FileSearch, Stethoscope, ClipboardCheck, BookOpen, Car, RefreshCw } from "lucide-react";

async function apiFetch(path: string) {
  const response = await fetch(path, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message ?? `HTTP ${response.status}`);
  return data;
}

async function apiPost(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message ?? `HTTP ${response.status}`);
  return data;
}

function fullName(profile: any) {
  return [profile?.firstName, profile?.secondName, profile?.thirdName, profile?.familyName].filter(Boolean).join(" ");
}

function formatStatus(status?: string) {
  if (!status) return "—";
  if (status === "SECURITY_REVIEW") return "APPLICATION SUBMITTED";
  return status.replace(/_/g, " ");
}

const PRACTICAL_CHECKLIST = [
  { key: "seatbelt_mirrors", weight: 8, en: "Seat belt fastened and mirrors adjusted before moving", ar: "ربط حزام الأمان وضبط المرايا قبل الانطلاق" },
  { key: "traffic_signals", weight: 12, en: "Obeys traffic signs and signals", ar: "الالتزام بإشارات وعلامات المرور" },
  { key: "vehicle_control", weight: 12, en: "Controls steering, speed, and vehicle handling", ar: "السيطرة على المركبة من حيث التوجيه والسرعة والتحكم" },
  { key: "correct_parking", weight: 10, en: "Parks correctly", ar: "الاصطفاف بشكل صحيح" },
  { key: "parallel_parking", weight: 8, en: "Parallel parking", ar: "الاصطفاف الجانبي" },
  { key: "reverse", weight: 8, en: "Reverses safely", ar: "الرجوع للخلف بأمان" },
  { key: "lane_discipline", weight: 8, en: "Keeps lane discipline without drifting", ar: "الالتزام بالمسرب وعدم الانحراف" },
  { key: "safe_distance", weight: 6, en: "Maintains a safe following distance", ar: "الحفاظ على مسافة أمان كافية" },
  { key: "use_signals", weight: 8, en: "Uses signals before turning and changing lanes", ar: "استخدام الإشارات قبل الانعطاف وتغيير المسرب" },
  { key: "mirror_check", weight: 6, en: "Checks mirrors and blind spots before maneuvering", ar: "فحص المرايا والنقاط العمياء قبل المناورة" },
  { key: "smooth_braking", weight: 6, en: "Brakes and accelerates smoothly", ar: "الفرملة والتسارع بسلاسة" },
  { key: "hill_start", weight: 4, en: "Starts uphill without rolling back", ar: "الانطلاق على المرتفع دون تراجع" },
  { key: "pedestrian_awareness", weight: 4, en: "Pays attention to pedestrians and right of way", ar: "الانتباه للمشاة وإعطاء الأولوية" },
];

export default function OfficerDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useGetOfficerDashboard({ query: { queryKey: getGetOfficerDashboardQueryKey() } });
  const [nationalId, setNationalId] = useState("");
  const [searching, setSearching] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<"medical" | "theory" | "practical" | null>(null);
  const [isEditingResult, setIsEditingResult] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<{ src: string; name: string } | null>(null);
  const [medicalResult, setMedicalResult] = useState("");
  const [examResult, setExamResult] = useState("");
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [verification, setVerification] = useState<Record<string, boolean>>({
    photoMatched: false,
    nationalIdVerified: false,
    eligibleForTheory: false,
    medicalCompleted: false,
  });
  const [practicalChecklist, setPracticalChecklist] = useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const d = dashboard as any;
  const role = user?.role ?? "";
  const isTheoryOfficer = ["THEORY_EXAM_OFFICER", "THEORY_OFFICER"].includes(role);
  const isPracticalOfficer = ["PRACTICAL_EXAM_OFFICER", "PRACTICAL_OFFICER"].includes(role);
  const dashboardTitle = isTheoryOfficer
    ? language === "ar" ? "إدارة السير - مسؤول الامتحان النظري" : "Traffic Department - Theory Exam Officer"
    : isPracticalOfficer
    ? language === "ar" ? "إدارة السير - مسؤول الامتحان العملي" : "Traffic Department - Practical Exam Officer"
    : language === "ar" ? "لوحة الموظف" : "Officer Dashboard";
  const dashboardSubtitle = isTheoryOfficer
    ? language === "ar" ? "مركز الامتحان النظري / إدارة السير" : "Theory Exam Center / Traffic Department"
    : isPracticalOfficer
    ? language === "ar" ? "مركز الامتحان العملي / إدارة السير" : "Practical Exam Center / Traffic Department"
    : d?.center ? `${d.center.nameEn} · ${d.center.governorate}` : "";
  const stageLabel = isTheoryOfficer
    ? language === "ar" ? "مكتب الامتحان النظري" : "Theory Exam Desk"
    : isPracticalOfficer
    ? language === "ar" ? "مكتب الامتحان العملي" : "Practical Exam Desk"
    : language === "ar" ? "مكتب الفحص الطبي" : "Medical / Vision Desk";
  const stageDescription = isTheoryOfficer
    ? language === "ar" ? "راجع طلبات الامتحان النظري، تحقق من معلومات المواطن، وسجل العلامة من نفس الشاشة." : "Review theory exam bookings, verify citizen information, and record scores from the same workspace."
    : isPracticalOfficer
    ? language === "ar" ? "راجع مواعيد الفحص العملي، تحقق من هوية المواطن، واحسب النتيجة من قائمة التقييم." : "Review practical exam bookings, verify citizen identity, and calculate the result from the driving checklist."
    : language === "ar" ? "تابع مواعيد الفحص الطبي وفحص النظر، وابحث عن الطلب بالرقم الوطني لتسجيل النتيجة." : "Manage medical and vision appointments, search by national ID, and record the official result.";
  const refreshDashboard = () => {
    void queryClient.invalidateQueries({ queryKey: getGetOfficerDashboardQueryKey() });
    if (applications.length > 0 && nationalId.trim()) void searchApplications();
  };

  const searchApplications = async () => {
    if (!nationalId.trim()) {
      toast({ variant: "destructive", title: "National ID is required" });
      return;
    }
    setSearching(true);
    try {
      const data = await apiFetch(`/api/officer/applications/search?nationalId=${encodeURIComponent(nationalId.trim())}`);
      setApplications(data);
      if (!data.length) {
        toast({ title: "No matching applications", description: "No application is currently assigned to your officer stage for this national ID." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Search failed", description: error instanceof Error ? error.message : undefined });
    } finally {
      setSearching(false);
    }
  };

  const openMedicalDialog = (app: any) => {
    setSelectedApplication(app);
    setSelectedMode("medical");
    setIsEditingResult(!app.medicalTest);
    setMedicalResult(app.medicalTest?.result ?? "");
    setNotes(app.medicalTest?.notes ?? "");
  };

  const openTheoryDialog = (app: any) => {
    setSelectedApplication(app);
    setSelectedMode("theory");
    const latestAttempt = app.exams?.filter((exam: any) => exam.examType === "THEORY").slice(-1)[0];
    setIsEditingResult(!latestAttempt);
    setExamResult(latestAttempt?.result ?? "");
    setScore(latestAttempt?.score?.toString() ?? "");
    setNotes(latestAttempt?.notes ?? "");
    setVerification({
      photoMatched: false,
      nationalIdVerified: false,
      eligibleForTheory: false,
      medicalCompleted: false,
    });
  };

  const openPracticalDialog = (app: any) => {
    setSelectedApplication(app);
    setSelectedMode("practical");
    const latestAttempt = app.exams?.filter((exam: any) => exam.examType === "PRACTICAL").slice(-1)[0];
    setIsEditingResult(!latestAttempt);
    let nextChecklist: Record<string, boolean> = {};
    let nextNotes = "";
    try {
      const parsed = latestAttempt?.notes ? JSON.parse(latestAttempt.notes) : null;
      nextNotes = parsed?.notes ?? latestAttempt?.notes ?? "";
      if (Array.isArray(parsed?.checklist)) {
        nextChecklist = Object.fromEntries(parsed.checklist.map((item: any) => [item.key, Boolean(item.checked)]));
      }
    } catch {
      nextNotes = latestAttempt?.notes ?? "";
    }
    setNotes(nextNotes);
    setPracticalChecklist(nextChecklist);
    setVerification({
      photoMatched: false,
      nationalIdVerified: false,
      eligibleForPractical: false,
      theoryPassed: false,
    });
  };

  const openStageDialog = (app: any) => {
    const appointmentTypes = app.appointments?.map((apt: any) => apt.appointmentType) ?? [];
    if (isPracticalOfficer || appointmentTypes.includes("PRACTICAL_EXAM") || app.status === "PRACTICAL_APPOINTMENT_BOOKED") {
      openPracticalDialog(app);
      return;
    }
    if (isTheoryOfficer || appointmentTypes.includes("THEORY_EXAM") || app.status === "THEORY_APPOINTMENT_BOOKED") {
      openTheoryDialog(app);
      return;
    }
    openMedicalDialog(app);
  };

  const submitMedicalResult = async () => {
    if (!selectedApplication) return;
    if (!medicalResult) {
      toast({ variant: "destructive", title: "Vision result is required" });
      return;
    }
    if (medicalResult === "NOT_FIT_TO_DRIVE" && !notes.trim()) {
      toast({ variant: "destructive", title: "Notes are required", description: "Please add medical notes when the citizen is not fit to drive." });
      return;
    }
    setSubmittingResult(true);
    try {
      await apiPost("/api/officer/medical/record", {
        applicationId: selectedApplication.id,
        result: medicalResult,
        notes: notes.trim() || undefined,
      });
      toast({ title: "Medical/vision result submitted", description: "The application was moved to the next step." });
      setSelectedApplication(null);
      setSelectedMode(null);
      setMedicalResult("");
      setNotes("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetOfficerDashboardQueryKey() }),
        searchApplications(),
      ]);
    } catch (error) {
      toast({ variant: "destructive", title: "Submit failed", description: error instanceof Error ? error.message : undefined });
    } finally {
      setSubmittingResult(false);
    }
  };

  const validateTheoryResult = () => {
    if (!selectedApplication) return false;
    const value = Number(score);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      toast({ variant: "destructive", title: language === "ar" ? "العلامة يجب أن تكون بين 0 و 100" : "Score must be between 0 and 100" });
      return false;
    }
    if (value < 70 && !notes.trim()) {
      toast({ variant: "destructive", title: language === "ar" ? "الملاحظات مطلوبة عند الرسوب" : "Notes are required when the result is failed" });
      return false;
    }
    if (Object.values(verification).some((value) => !value)) {
      toast({ variant: "destructive", title: language === "ar" ? "يرجى إكمال قائمة التحقق" : "Please complete all verification checks" });
      return false;
    }
    return true;
  };

  const practicalScore = PRACTICAL_CHECKLIST.reduce((total, item) => total + (practicalChecklist[item.key] ? item.weight : 0), 0);
  const practicalResult = practicalScore >= 70 ? "PASSED" : "FAILED";

  const validatePracticalResult = () => {
    if (!selectedApplication) return false;
    if (Object.values(verification).some((value) => !value)) {
      toast({ variant: "destructive", title: language === "ar" ? "يرجى إكمال قائمة التحقق" : "Please complete all verification checks" });
      return false;
    }
    return true;
  };

  const submitTheoryResult = async () => {
    if (!selectedApplication) return;
    setSubmittingResult(true);
    try {
      await apiPost("/api/officer/exams/record", {
        applicationId: selectedApplication.id,
        examType: "THEORY",
        result: Number(score) >= 70 ? "PASSED" : "FAILED",
        score: Number(score),
        notes: notes.trim() || undefined,
        verification,
      });
      const derivedTheoryResult = Number(score) >= 70 ? "PASSED" : "FAILED";
      toast({
        title: language === "ar" ? "تم تسجيل نتيجة الامتحان النظري" : "Theory exam result submitted",
        description: derivedTheoryResult === "PASSED"
          ? language === "ar" ? "انتقل الطلب إلى حجز الامتحان العملي." : "The application was moved to practical exam booking."
          : language === "ar" ? "يمكن للمواطن حجز موعد جديد للامتحان النظري." : "The citizen can book another theory exam appointment.",
      });
      setConfirmOpen(false);
      setSelectedApplication(null);
      setSelectedMode(null);
      setExamResult("");
      setScore("");
      setNotes("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetOfficerDashboardQueryKey() }),
        searchApplications(),
      ]);
    } catch (error) {
      toast({ variant: "destructive", title: language === "ar" ? "فشل الإرسال" : "Submit failed", description: error instanceof Error ? error.message : undefined });
    } finally {
      setSubmittingResult(false);
    }
  };

  const submitPracticalResult = async () => {
    if (!selectedApplication) return;
    setSubmittingResult(true);
    try {
      const checklist = PRACTICAL_CHECKLIST.map((item) => ({
        key: item.key,
        label: item.en,
        labelEn: item.en,
        labelAr: item.ar,
        weight: item.weight,
        checked: Boolean(practicalChecklist[item.key]),
      }));
      const response = await apiPost("/api/officer/practical/record", {
        applicationId: selectedApplication.id,
        checklist,
        score: practicalScore,
        result: practicalResult,
        notes: notes.trim() || undefined,
        verification,
      });
      toast({
        title: language === "ar" ? "تم تسجيل نتيجة الامتحان العملي" : "Practical exam result submitted",
        description: practicalResult === "PASSED" && response?.license
          ? language === "ar" ? "تم اجتياز الامتحان العملي وتم إصدار الرخصة تلقائيًا." : "Practical exam passed. License issued automatically."
          : practicalResult === "PASSED"
          ? language === "ar" ? "تم اجتياز الامتحان العملي." : "The practical exam was passed."
          : language === "ar" ? "يمكن للمواطن حجز موعد جديد للامتحان العملي." : "The citizen can book another practical exam appointment.",
      });
      setConfirmOpen(false);
      setSelectedApplication(null);
      setSelectedMode(null);
      setPracticalChecklist({});
      setNotes("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetOfficerDashboardQueryKey() }),
        searchApplications(),
      ]);
    } catch (error) {
      toast({ variant: "destructive", title: language === "ar" ? "فشل الإرسال" : "Submit failed", description: error instanceof Error ? error.message : undefined });
    } finally {
      setSubmittingResult(false);
    }
  };

  const selectedAppointmentType = selectedMode === "practical" ? "PRACTICAL_EXAM" : selectedMode === "theory" ? "THEORY_EXAM" : "MEDICAL_TEST";
  const selectedAppointment = selectedApplication?.appointments?.find((apt: any) => apt.appointmentType === selectedAppointmentType && apt.status === "BOOKED")
    ?? selectedApplication?.appointments?.find((apt: any) => apt.appointmentType === selectedAppointmentType)
    ?? selectedApplication?.appointments?.[0];
  const medicalTest = selectedApplication?.medicalTest;
  const latestTheoryExam = selectedApplication?.exams?.filter((exam: any) => exam.examType === "THEORY").at?.(-1)
    ?? selectedApplication?.exams?.filter((exam: any) => exam.examType === "THEORY").slice(-1)[0];
  const latestPracticalExam = selectedApplication?.exams?.filter((exam: any) => exam.examType === "PRACTICAL").at?.(-1)
    ?? selectedApplication?.exams?.filter((exam: any) => exam.examType === "PRACTICAL").slice(-1)[0];
  const hasSavedResult = selectedMode === "medical"
    ? Boolean(medicalTest)
    : selectedMode === "theory"
    ? Boolean(latestTheoryExam)
    : selectedMode === "practical"
    ? Boolean(latestPracticalExam)
    : false;
  const fieldsDisabled = !isEditingResult;

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-emerald-900/20 bg-gradient-to-br from-emerald-950 via-emerald-800 to-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
              {isPracticalOfficer ? <Car className="h-7 w-7 text-amber-100" /> : isTheoryOfficer ? <BookOpen className="h-7 w-7 text-amber-100" /> : <Stethoscope className="h-7 w-7 text-amber-100" />}
            </div>
            <div>
              <p className="text-sm font-medium text-amber-100">{stageLabel}</p>
              <h1 className="mt-1 text-3xl font-bold">{dashboardTitle}</h1>
              {dashboardSubtitle && (
                <div className="mt-2 flex items-center gap-2 text-sm text-white/75">
                  <Building2 className="h-4 w-4" />
                  <span>{dashboardSubtitle}</span>
                </div>
              )}
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">{stageDescription}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="gap-2 bg-white text-emerald-950 hover:bg-amber-50" onClick={refreshDashboard}>
              <RefreshCw className="h-4 w-4" />
              {language === "ar" ? "تحديث" : "Refresh"}
            </Button>
            <Link href="/officer/appointments">
              <Button variant="secondary" className="gap-2 bg-white/10 text-white hover:bg-white/20">
                <Calendar className="h-4 w-4" />{language === "ar" ? "المواعيد" : "Appointments"}
              </Button>
            </Link>
            <Link href="/officer/results">
              <Button variant="secondary" className="gap-2 bg-amber-100 text-emerald-950 hover:bg-amber-50">
                <FileSearch className="h-4 w-4" />{language === "ar" ? "النتائج/البحث" : "Results/Search"}
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
        <Card className="border-primary/15">
          <CardContent className="p-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="h-4 w-4 text-primary" />
                {language === "ar" ? "البحث عن الطلبات" : "Application Search"}
              </CardTitle>
              <Badge variant="outline" className="w-fit">
                {applications.length} {language === "ar" ? "نتيجة" : "results"}
              </Badge>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1 lg:max-w-xl">
                <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
                <Input
                  value={nationalId}
                  onChange={(event) => setNationalId(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") void searchApplications(); }}
                  placeholder={language === "ar" ? "ابحث بالرقم الوطني للمواطن" : "Search by citizen national ID"}
                  className={`h-11 ${isRTL ? "pr-10" : "pl-10"}`}
                />
              </div>
              <Button onClick={searchApplications} disabled={searching} className="h-11 gap-2 bg-emerald-800 px-6 hover:bg-emerald-900">
                <Search className="h-4 w-4" />{searching ? (language === "ar" ? "جارٍ البحث..." : "Searching...") : (language === "ar" ? "بحث" : "Search")}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {language === "ar"
                ? "يعرض البحث الطلبات المرتبطة بمرحلة الموظف الحالية."
                : "Search finds applications currently assigned to your officer stage."}
            </p>
            {applications.length > 0 && (
              <div className="mt-4 space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="flex flex-col gap-4 rounded-xl border bg-white p-4 transition-all hover:border-primary/30 hover:shadow-md lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl border bg-muted">
                        {app.profile?.personalPhotoUrl ? (
                          <img src={app.profile.personalPhotoUrl} alt="profile" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center"><User className="h-5 w-5 text-muted-foreground" /></div>
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-sm font-semibold">{app.applicationNumber}</p>
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{app.status?.replace(/_/g, " ")}</Badge>
                        </div>
                        <p className="mt-1 font-semibold">{fullName(app.profile) || app.user?.email || "Citizen"}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                        {app.profile?.nationalId && <span className="text-xs text-muted-foreground font-mono">{app.profile.nationalId}</span>}
                        {app.licenseCategory?.nameEn && <span className="text-xs text-muted-foreground">{app.licenseCategory.nameEn}</span>}
                        {isTheoryOfficer && app.medicalTest?.result && <span className="text-xs text-muted-foreground">{app.medicalTest.result.replace(/_/g, " ")}</span>}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => openStageDialog(app)}>
                      {isPracticalOfficer ? <Car className="w-3 h-3" /> : isTheoryOfficer ? <ClipboardCheck className="w-3 h-3" /> : <Stethoscope className="w-3 h-3" />}
                      {isPracticalOfficer || isTheoryOfficer ? (language === "ar" ? "عرض الطلب" : "View Application") : (language === "ar" ? "تسجيل النتيجة" : "Record Result")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: language === "ar" ? "مواعيد اليوم" : "Today's Appointments", value: d?.todayAppointments ?? 0, icon: Calendar, gradient: "from-sky-500 to-blue-600" },
          { label: language === "ar" ? "قيد الانتظار" : "Pending", value: d?.pendingAppointments ?? 0, icon: Clock, gradient: "from-amber-500 to-orange-600" },
          { label: language === "ar" ? "مكتملة اليوم" : "Completed Today", value: d?.completedToday ?? 0, icon: CheckCircle, gradient: "from-emerald-500 to-teal-600" },
        ].map((stat, i) => (
          <Card key={i} className="rounded-2xl border-border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${stat.gradient}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" />
                {language === "ar" ? "آخر المواعيد" : "Recent Appointments"}
              </CardTitle>
              <Badge variant="outline">{d?.recentAppointments?.length ?? 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!d?.recentAppointments?.length ? (
              <div className="rounded-lg border border-dashed py-10 text-center">
                <Calendar className="mx-auto mb-3 h-8 w-8 text-muted-foreground/70" />
                <p className="text-sm font-medium">{language === "ar" ? "لا توجد مواعيد اليوم" : "No appointments yet today"}</p>
                <Link href="/officer/appointments">
                  <Button variant="link" size="sm" className="mt-2">{language === "ar" ? "فتح صفحة المواعيد" : "Open appointments page"}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {d.recentAppointments.map((apt: any) => (
                  <div key={apt.id} className="flex flex-col gap-3 rounded-xl border bg-white p-4 transition-all hover:border-primary/30 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{apt.profile?.firstName ?? apt.user?.email ?? "Citizen"} {apt.profile?.familyName ?? ""}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{apt.appointmentType?.replace(/_/g, " ")} · {apt.appointmentDate} · {apt.startTime}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {language === "ar" ? "الطلب:" : "Application:"} <span className="font-mono">{apt.application?.applicationNumber ?? apt.applicationId}</span>
                        </p>
                      </div>
                    </div>
                    <div className={`flex flex-col gap-1 ${isRTL ? "sm:items-start" : "sm:items-end"}`}>
                      <Badge className="bg-blue-100 text-xs text-blue-700 hover:bg-blue-100">
                        {formatStatus(apt.application?.status)}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{apt.status?.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={Boolean(selectedApplication) && !confirmOpen} onOpenChange={(open) => { if (!open) { setSelectedApplication(null); setSelectedMode(null); setIsEditingResult(false); } }}>
        <DialogContent className={selectedMode === "theory" || selectedMode === "practical" ? "max-w-4xl" : "max-w-2xl"} dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMode === "practical" ? <Car className="w-5 h-5 text-emerald-700" /> : selectedMode === "theory" ? <BookOpen className="w-5 h-5 text-emerald-700" /> : <Stethoscope className="w-5 h-5 text-purple-600" />}
              {selectedMode === "theory"
                ? language === "ar" ? "التحقق من طلب الامتحان النظري" : "Theory Exam Application Verification"
                : selectedMode === "practical"
                ? language === "ar" ? "نتيجة الامتحان العملي" : "Practical Exam Result"
                : language === "ar" ? "تسجيل نتيجة فحص النظر" : "Record Medical / Vision Test Result"}
            </DialogTitle>
          </DialogHeader>

          {selectedApplication && selectedMode === "medical" && (
            <div className="space-y-5">
              <div className="rounded-xl border bg-muted/30 p-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => selectedApplication.profile?.personalPhotoUrl && setPhotoPreview({ src: selectedApplication.profile.personalPhotoUrl, name: fullName(selectedApplication.profile) || "Applicant photo" })}
                  className="w-20 h-24 rounded-xl bg-background border overflow-hidden flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {selectedApplication.profile?.personalPhotoUrl ? (
                    <img src={selectedApplication.profile.personalPhotoUrl} alt="profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </button>
                <div className="grid flex-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <p><span className="text-muted-foreground">{language === "ar" ? "الاسم:" : "Full name:"}</span> <strong>{fullName(selectedApplication.profile) || "—"}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "الرقم الوطني:" : "National ID:"}</span> <strong className="font-mono">{selectedApplication.profile?.nationalId ?? "—"}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "رقم الطلب:" : "Application number:"}</span> <strong className="font-mono">{selectedApplication.applicationNumber}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "فئة الرخصة:" : "License category:"}</span> <strong>{language === "ar" ? selectedApplication.licenseCategory?.nameAr : selectedApplication.licenseCategory?.nameEn}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "الموعد:" : "Appointment:"}</span> <strong>{selectedAppointment ? `${selectedAppointment.appointmentDate} · ${selectedAppointment.startTime}` : "—"}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "الحالة:" : "Current status:"}</span> <Badge variant="outline">{selectedApplication.status?.replace(/_/g, " ")}</Badge></p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">{language === "ar" ? "نتيجة فحص النظر" : "Vision result"} <span className="text-red-500">*</span></Label>
                <RadioGroup value={medicalResult} onValueChange={setMedicalResult} disabled={fieldsDisabled} className="grid gap-2 sm:grid-cols-3">
                  {[
                    { value: "DOES_NOT_NEED_GLASSES", en: "Does not need glasses", ar: "لا يحتاج نظارة" },
                    { value: "NEEDS_GLASSES", en: "Needs glasses", ar: "يحتاج نظارة" },
                    { value: "NOT_FIT_TO_DRIVE", en: "Not fit to drive", ar: "غير مؤهل للقيادة" },
                  ].map((option) => (
                    <Label key={option.value} className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${fieldsDisabled ? "cursor-default opacity-75" : "cursor-pointer"} ${medicalResult === option.value ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20" : "hover:bg-muted/50"}`}>
                      <RadioGroupItem value={option.value} />
                      <span>{language === "ar" ? option.ar : option.en}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical-notes">{language === "ar" ? "ملاحظات" : "Notes"} {medicalResult === "NOT_FIT_TO_DRIVE" && <span className="text-red-500">*</span>}</Label>
                <Textarea
                  id="medical-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  disabled={fieldsDisabled}
                  placeholder={language === "ar" ? "أضف ملاحظات طبية عند الحاجة" : "Add medical notes if needed"}
                  rows={4}
                />
              </div>
            </div>
          )}

          {selectedApplication && selectedMode === "theory" && (
            <div className="max-h-[72vh] space-y-5 overflow-y-auto pr-1">
              <div className="rounded-xl border bg-muted/30 p-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => selectedApplication.profile?.personalPhotoUrl && setPhotoPreview({ src: selectedApplication.profile.personalPhotoUrl, name: fullName(selectedApplication.profile) || "Applicant photo" })}
                  className="w-24 h-28 rounded-xl bg-background border overflow-hidden flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {selectedApplication.profile?.personalPhotoUrl ? (
                    <img src={selectedApplication.profile.personalPhotoUrl} alt="profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </button>
                <div className="grid flex-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <p><span className="text-muted-foreground">{language === "ar" ? "الاسم الكامل:" : "Full name:"}</span> <strong>{fullName(selectedApplication.profile) || "—"}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "الرقم الوطني:" : "National ID:"}</span> <strong className="font-mono">{selectedApplication.profile?.nationalId ?? "—"}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "رقم الطلب:" : "Application number:"}</span> <strong className="font-mono">{selectedApplication.applicationNumber}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "فئة الرخصة:" : "License category:"}</span> <strong>{language === "ar" ? selectedApplication.licenseCategory?.nameAr : selectedApplication.licenseCategory?.nameEn}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "موعد الامتحان:" : "Theory appointment:"}</span> <strong>{selectedAppointment ? `${selectedAppointment.appointmentDate} · ${selectedAppointment.startTime}` : "—"}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "مركز الامتحان:" : "Exam center:"}</span> <strong>{selectedAppointment?.center?.nameEn ?? selectedAppointment?.centerId ?? "—"}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "تاريخ التقديم:" : "Submitted date:"}</span> <strong>{selectedApplication.submittedAt ? new Date(selectedApplication.submittedAt).toLocaleDateString() : "—"}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "الحالة / الخطوة:" : "Status / step:"}</span> <Badge variant="outline">{selectedApplication.status?.replace(/_/g, " ")}</Badge></p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{language === "ar" ? "نتيجة فحص النظر" : "Medical / Vision Result"}</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">{language === "ar" ? "النتيجة:" : "Result:"}</span> <strong>{medicalTest?.result?.replace(/_/g, " ") ?? "—"}</strong></p>
                    <p><span className="text-muted-foreground">{language === "ar" ? "الملاحظات:" : "Notes:"}</span> {medicalTest?.notes || "—"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{language === "ar" ? "آخر محاولة نظرية" : "Latest Theory Attempt"}</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">{language === "ar" ? "النتيجة:" : "Result:"}</span> <strong>{latestTheoryExam?.result ?? "—"}</strong></p>
                    <p><span className="text-muted-foreground">{language === "ar" ? "العلامة:" : "Score:"}</span> {latestTheoryExam?.score ? `${latestTheoryExam.score} / ${latestTheoryExam.maxScore ?? 100}` : "—"}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3 rounded-xl border p-4">
                <Label className="text-sm font-semibold">{language === "ar" ? "قائمة التحقق" : "Verification checklist"} <span className="text-red-500">*</span></Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["photoMatched", language === "ar" ? "مطابقة الصورة الشخصية" : "Photo matched"],
                    ["nationalIdVerified", language === "ar" ? "تم التحقق من الرقم الوطني" : "National ID verified"],
                    ["eligibleForTheory", language === "ar" ? "مؤهل للامتحان النظري" : "Eligible for theory"],
                    ["medicalCompleted", language === "ar" ? "فحص النظر مكتمل" : "Medical completed"],
                  ].map(([key, label]) => (
                    <Label key={key} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/40">
                      <Checkbox
                        checked={verification[key as keyof typeof verification]}
                        disabled={fieldsDisabled}
                        onCheckedChange={(checked) => setVerification((prev) => ({ ...prev, [key]: Boolean(checked) }))}
                      />
                      <span>{label}</span>
                    </Label>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">{language === "ar" ? "نتيجة الامتحان النظري" : "Theory result"} <span className="text-red-500">*</span></Label>
                  <RadioGroup value={examResult} onValueChange={setExamResult} disabled={fieldsDisabled} className="grid gap-2 sm:grid-cols-2">
                    {[
                      { value: "PASSED", en: "Passed", ar: "ناجح" },
                      { value: "FAILED", en: "Failed", ar: "راسب" },
                    ].map((option) => (
                      <Label key={option.value} className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${fieldsDisabled ? "cursor-default opacity-75" : "cursor-pointer"} ${examResult === option.value ? "border-emerald-600 bg-emerald-50" : "hover:bg-muted/50"}`}>
                        <RadioGroupItem value={option.value} />
                        <span>{language === "ar" ? option.ar : option.en}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theory-score">{language === "ar" ? "العلامة" : "Score"} <span className="text-muted-foreground">(0-100)</span></Label>
                  <Input id="theory-score" type="number" min={0} max={100} value={score} onChange={(event) => setScore(event.target.value)} disabled={fieldsDisabled} placeholder="0" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theory-notes">{language === "ar" ? "ملاحظات" : "Notes"} {examResult === "FAILED" && <span className="text-red-500">*</span>}</Label>
                <Textarea
                  id="theory-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  disabled={fieldsDisabled}
                  placeholder={language === "ar" ? "أضف ملاحظات عند الحاجة" : "Add notes if needed"}
                  rows={4}
                />
              </div>
            </div>
          )}

          {selectedApplication && selectedMode === "practical" && (
            <div className="max-h-[72vh] space-y-5 overflow-y-auto pr-1">
              <div className="rounded-xl border bg-muted/30 p-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => selectedApplication.profile?.personalPhotoUrl && setPhotoPreview({ src: selectedApplication.profile.personalPhotoUrl, name: fullName(selectedApplication.profile) || "Applicant photo" })}
                  className="w-24 h-28 rounded-xl bg-background border overflow-hidden flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {selectedApplication.profile?.personalPhotoUrl ? (
                    <img src={selectedApplication.profile.personalPhotoUrl} alt="profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </button>
                <div className="grid flex-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <p><span className="text-muted-foreground">{language === "ar" ? "الاسم الكامل:" : "Full name:"}</span> <strong>{fullName(selectedApplication.profile) || "—"}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "الرقم الوطني:" : "National ID:"}</span> <strong className="font-mono">{selectedApplication.profile?.nationalId ?? "—"}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "رقم الطلب:" : "Application number:"}</span> <strong className="font-mono">{selectedApplication.applicationNumber}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "فئة الرخصة:" : "License category:"}</span> <strong>{language === "ar" ? selectedApplication.licenseCategory?.nameAr : selectedApplication.licenseCategory?.nameEn}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "موعد الامتحان:" : "Appointment:"}</span> <strong>{selectedAppointment ? `${selectedAppointment.appointmentDate} · ${selectedAppointment.startTime}` : "—"}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "الحالة:" : "Current status:"}</span> <Badge variant="outline">{selectedApplication.status?.replace(/_/g, " ")}</Badge></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "نتيجة فحص النظر:" : "Medical result:"}</span> <strong>{medicalTest?.result?.replace(/_/g, " ") ?? "—"}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "نتيجة النظري:" : "Theory result:"}</span> <strong>{latestTheoryExam?.result ?? "—"}</strong></p>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border p-4">
                <Label className="text-sm font-semibold">{language === "ar" ? "قائمة التحقق" : "Verification checklist"} <span className="text-red-500">*</span></Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["photoMatched", language === "ar" ? "تم التحقق من مطابقة الصورة الشخصية" : "Applicant photo matches the person"],
                    ["nationalIdVerified", language === "ar" ? "تم التحقق من الرقم الوطني" : "National ID verified"],
                    ["eligibleForPractical", language === "ar" ? "الطلب مؤهل للامتحان العملي" : "Application is eligible for practical exam"],
                    ["theoryPassed", language === "ar" ? "تم اجتياز الامتحان النظري" : "Theory exam passed"],
                  ].map(([key, label]) => (
                    <Label key={key} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/40">
                      <Checkbox
                        checked={Boolean(verification[key])}
                        disabled={fieldsDisabled}
                        onCheckedChange={(checked) => setVerification((prev) => ({ ...prev, [key]: Boolean(checked) }))}
                      />
                      <span>{label}</span>
                    </Label>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                  <Label className="text-sm font-semibold">{language === "ar" ? "قائمة فحص القيادة العملي" : "Practical driving checklist"}</Label>
                  <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    <strong>{language === "ar" ? "النتيجة" : "Score"}: {practicalScore} / 100</strong>
                    <span className="mx-2">·</span>
                    <span>{language === "ar" ? "الحالة" : "Result"}: {practicalResult === "PASSED" ? (language === "ar" ? "ناجح" : "Passed") : (language === "ar" ? "راسب" : "Failed")}</span>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {PRACTICAL_CHECKLIST.map((item, index) => (
                    <Label key={item.key} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/40">
                      <Checkbox
                        checked={Boolean(practicalChecklist[item.key])}
                        disabled={fieldsDisabled}
                        onCheckedChange={(checked) => setPracticalChecklist((prev) => ({ ...prev, [item.key]: Boolean(checked) }))}
                      />
                      <span>{index + 1}. {language === "ar" ? item.ar : item.en} <span className="text-muted-foreground">({item.weight})</span></span>
                    </Label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="practical-notes">{language === "ar" ? "ملاحظات" : "Notes"}</Label>
                <Textarea
                  id="practical-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  disabled={fieldsDisabled}
                  placeholder={language === "ar" ? "أضف ملاحظات عند الحاجة" : "Add notes if needed"}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedApplication(null); setSelectedMode(null); setIsEditingResult(false); }}>{language === "ar" ? "إغلاق" : "Close"}</Button>
            {hasSavedResult && !isEditingResult ? (
              <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={() => setIsEditingResult(true)}>
                {language === "ar" ? "تعديل النتيجة" : "Edit Result"}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (selectedMode === "theory") {
                    if (validateTheoryResult()) setConfirmOpen(true);
                  } else if (selectedMode === "practical") {
                    if (validatePracticalResult()) setConfirmOpen(true);
                  } else {
                    void submitMedicalResult();
                  }
                }}
                disabled={submittingResult}
                className={selectedMode === "theory" || selectedMode === "practical" ? "bg-emerald-700 hover:bg-emerald-800" : "bg-purple-700 hover:bg-purple-800"}
              >
                {submittingResult
                  ? (language === "ar" ? "جارٍ الإرسال..." : "Submitting...")
                  : selectedMode === "practical"
                  ? hasSavedResult ? (language === "ar" ? "حفظ تعديل العملي" : "Save Practical Change") : (language === "ar" ? "تسجيل نتيجة العملي" : "Submit Practical Result")
                  : hasSavedResult ? (language === "ar" ? "حفظ التعديل" : "Save Change") : (language === "ar" ? "إرسال النتيجة" : "Submit Result")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(photoPreview)} onOpenChange={(open) => !open && setPhotoPreview(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{photoPreview?.name ?? (language === "ar" ? "صورة مقدم الطلب" : "Applicant photo")}</DialogTitle>
          </DialogHeader>
          {photoPreview && (
            <div className="flex justify-center rounded-2xl bg-slate-100 p-4">
              <img src={photoPreview.src} alt={photoPreview.name} className="max-h-[70vh] rounded-xl object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "تأكيد تسجيل النتيجة" : selectedMode === "practical" ? "Confirm Practical Result" : "Confirm Theory Result"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="font-medium">{fullName(selectedApplication?.profile) || selectedApplication?.applicationNumber}</p>
            <p className="text-muted-foreground">
              {selectedMode === "practical"
                ? practicalResult === "PASSED"
                  ? language === "ar" ? "هل تؤكد أن مقدم الطلب ناجح في الامتحان العملي؟ سيتم نقل الطلب إلى مرحلة إصدار الرخصة." : "Confirm that this applicant passed the practical exam? The application will move to license issuance."
                  : language === "ar" ? "هل تؤكد أن مقدم الطلب راسب في الامتحان العملي؟ سيحتاج المواطن إلى حجز موعد جديد للامتحان العملي." : "Confirm that this applicant failed the practical exam? The citizen will need to book another practical exam appointment."
                : Number(score) >= 70
                ? language === "ar" ? "سيتم نقل الطلب إلى مرحلة حجز الامتحان العملي." : "This application will move to practical exam booking."
                : language === "ar" ? "سيتم إرجاع الطلب إلى حجز موعد جديد للامتحان النظري." : "The citizen will need to book another theory exam appointment."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>{language === "ar" ? "رجوع" : "Back"}</Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={selectedMode === "practical" ? submitPracticalResult : submitTheoryResult} disabled={submittingResult}>
              {submittingResult ? (language === "ar" ? "جارٍ الإرسال..." : "Submitting...") : (language === "ar" ? "تأكيد" : "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
