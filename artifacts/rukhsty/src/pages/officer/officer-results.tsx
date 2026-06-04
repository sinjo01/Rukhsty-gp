import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { BookOpen, ClipboardCheck, Search, Stethoscope, UserRound } from "lucide-react";

const PRACTICAL_ITEMS = [
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

async function apiFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`,
      ...(options.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message ?? `HTTP ${response.status}`);
  return data;
}

function name(profile: any) {
  return [profile?.firstName, profile?.secondName, profile?.thirdName, profile?.familyName].filter(Boolean).join(" ");
}

export default function OfficerResults() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const role = user?.role ?? "";
  const isMedical = ["MEDICAL_CENTER_OFFICER", "MEDICAL_OFFICER"].includes(role);
  const isTheory = ["THEORY_EXAM_OFFICER", "THEORY_OFFICER"].includes(role);
  const isPractical = ["PRACTICAL_EXAM_OFFICER", "PRACTICAL_OFFICER"].includes(role);

  const [nationalId, setNationalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const selected = applications.find((app) => app.id === selectedId) ?? applications[0];

  const [medicalResult, setMedicalResult] = useState("");
  const [theoryResult, setTheoryResult] = useState("");
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const practicalScore = useMemo(() => PRACTICAL_ITEMS.reduce((total, item, index) => total + (checked[index] ? item.weight : 0), 0), [checked]);

  const search = async () => {
    if (!nationalId.trim()) {
      toast({ variant: "destructive", title: language === "ar" ? "الرقم الوطني مطلوب" : "National ID is required" });
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch(`/api/officer/applications/search?nationalId=${encodeURIComponent(nationalId.trim())}`);
      setApplications(data);
      setSelectedId(data[0]?.id ?? "");
    } catch (error) {
      toast({ variant: "destructive", title: language === "ar" ? "فشل البحث" : "Search failed", description: error instanceof Error ? error.message : undefined });
    } finally {
      setLoading(false);
    }
  };

  const submitMedical = async () => {
    if (!selected || !medicalResult) return;
    await apiFetch("/api/officer/medical/record", {
      method: "POST",
      body: JSON.stringify({ applicationId: selected.id, nationalId: selected.profile?.nationalId, result: medicalResult, notes }),
    });
    toast({ title: language === "ar" ? "تم تسجيل نتيجة الفحص" : "Medical result recorded" });
    setApplications([]);
    setNotes("");
  };

  const submitTheory = async () => {
    if (!selected || !theoryResult) return;
    await apiFetch("/api/officer/exams/record", {
      method: "POST",
      body: JSON.stringify({
        applicationId: selected.id,
        examType: "THEORY",
        result: theoryResult,
        score: Number(score || 0),
        maxScore: 100,
        notes,
        verification: { photoMatched: true, nationalIdVerified: true, eligibleForTheory: true, medicalCompleted: true },
      }),
    });
    toast({ title: language === "ar" ? "تم تسجيل نتيجة الامتحان النظري" : "Theory result recorded" });
    setApplications([]);
    setNotes("");
  };

  const submitPractical = async () => {
    if (!selected) return;
    const checklist = PRACTICAL_ITEMS.map((item, index) => ({ ...item, label: item.en, labelEn: item.en, labelAr: item.ar, checked: Boolean(checked[index]) }));
    await apiFetch("/api/officer/practical/record", {
      method: "POST",
      body: JSON.stringify({
        applicationId: selected.id,
        checklist,
        score: practicalScore,
        result: practicalScore >= 70 ? "PASSED" : "FAILED",
        notes,
        verification: { photoMatched: true, nationalIdVerified: true, eligibleForPractical: true, theoryPassed: true },
      }),
    });
    toast({ title: language === "ar" ? "تم تسجيل نتيجة الامتحان العملي" : "Practical result recorded" });
    setApplications([]);
    setChecked({});
    setNotes("");
  };

  const title = isMedical ? (language === "ar" ? "تسجيل نتيجة فحص النظر" : "Record Medical / Vision Result")
    : isTheory ? (language === "ar" ? "تسجيل نتيجة الامتحان النظري" : "Record Theory Exam Result")
    : isPractical ? (language === "ar" ? "تسجيل نتيجة الامتحان العملي" : "Record Practical Exam Result")
    : (language === "ar" ? "تسجيل النتائج" : "Record Results");

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {language === "ar" ? "البحث عن الطلب بالرقم الوطني ثم تسجيل النتيجة المناسبة للدور." : "Search application by national ID, then record the result for your officer stage."}
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        <Card className="lg:sticky lg:top-20 h-fit">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Search className="w-4 h-4" />{language === "ar" ? "البحث عن الطلب بالرقم الوطني" : "Search Application by National ID"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={nationalId} onChange={(event) => setNationalId(event.target.value)} placeholder={language === "ar" ? "أدخل الرقم الوطني" : "Enter national ID"} />
            <Button className="w-full" onClick={search} disabled={loading}>{loading ? (language === "ar" ? "جارٍ البحث..." : "Searching...") : (language === "ar" ? "بحث" : "Search")}</Button>
            {applications.length > 1 && (
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{applications.map((app) => <SelectItem key={app.id} value={app.id}>{app.applicationNumber}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {!loading && applications.length === 0 && nationalId && <p className="text-sm text-muted-foreground text-center py-4">{language === "ar" ? "لا توجد طلبات مطابقة لهذه المرحلة" : "No matching applications for this stage"}</p>}
          </CardContent>
        </Card>

        {!selected ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">{language === "ar" ? "ابدأ بالبحث عن الرقم الوطني." : "Start by searching a national ID."}</CardContent></Card>
        ) : (
          <div className="space-y-5">
            <Card>
              <CardContent className="p-4 flex gap-4 flex-wrap">
                <div className="w-24 h-28 rounded-xl bg-muted border overflow-hidden flex items-center justify-center">
                  {selected.profile?.personalPhotoUrl ? <img src={selected.profile.personalPhotoUrl} alt="profile" className="w-full h-full object-cover" /> : <UserRound className="w-9 h-9 text-muted-foreground" />}
                </div>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 flex-1 text-sm">
                  <p><span className="text-muted-foreground">{language === "ar" ? "الاسم:" : "Name:"}</span> <strong>{name(selected.profile)}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "الرقم الوطني:" : "National ID:"}</span> <strong>{selected.profile?.nationalId}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "رقم الطلب:" : "Application:"}</span> <strong className="font-mono">{selected.applicationNumber}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "الفئة:" : "Category:"}</span> <strong>{language === "ar" ? selected.licenseCategory?.nameAr : selected.licenseCategory?.nameEn}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "الحالة:" : "Status:"}</span> <Badge variant="outline">{selected.status}</Badge></p>
                </div>
              </CardContent>
            </Card>

            {isMedical && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Stethoscope className="w-4 h-4 text-purple-500" />{language === "ar" ? "نتيجة فحص النظر" : "Vision result"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Select value={medicalResult} onValueChange={setMedicalResult}>
                    <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر النتيجة" : "Select result"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOES_NOT_NEED_GLASSES">{language === "ar" ? "لا يحتاج نظارة" : "Does not need glasses"}</SelectItem>
                      <SelectItem value="NEEDS_GLASSES">{language === "ar" ? "يحتاج نظارة" : "Needs glasses"}</SelectItem>
                      <SelectItem value="NOT_FIT_TO_DRIVE">{language === "ar" ? "غير مؤهل للقيادة" : "Not fit to drive"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={language === "ar" ? "ملاحظات" : "Notes"} />
                  <Button onClick={submitMedical}>{language === "ar" ? "تسجيل النتيجة" : "Record result"}</Button>
                </CardContent>
              </Card>
            )}

            {isTheory && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" />{language === "ar" ? "نتيجة الامتحان النظري" : "Theory exam result"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Select value={theoryResult} onValueChange={setTheoryResult}>
                    <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر النتيجة" : "Select result"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PASSED">{language === "ar" ? "ناجح" : "Passed"}</SelectItem>
                      <SelectItem value="FAILED">{language === "ar" ? "راسب" : "Failed"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder={language === "ar" ? "العلامة" : "Score"} />
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={language === "ar" ? "ملاحظات" : "Notes"} />
                  <Button onClick={submitTheory}>{language === "ar" ? "تسجيل النتيجة" : "Record result"}</Button>
                </CardContent>
              </Card>
            )}

            {isPractical && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-amber-500" />{language === "ar" ? "قائمة تقييم القيادة الآمنة (نموذج أكاديمي)" : "Safe-driving assessment checklist (academic prototype)"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-2">
                    {PRACTICAL_ITEMS.map((item, index) => (
                      <label key={item.key} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                        <Checkbox checked={Boolean(checked[index])} onCheckedChange={(value) => setChecked((prev) => ({ ...prev, [index]: Boolean(value) }))} />
                        <span>{language === "ar" ? item.ar : item.en} <span className="text-muted-foreground">({item.weight})</span></span>
                      </label>
                    ))}
                  </div>
                  <div className="rounded-xl bg-muted/60 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "العلامة المحسوبة" : "Auto-calculated score"}</p>
                      <p className="text-2xl font-bold">{practicalScore} / 100</p>
                    </div>
                    <Badge className={practicalScore >= 70 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{practicalScore >= 70 ? (language === "ar" ? "ناجح" : "PASSED") : (language === "ar" ? "راسب" : "FAILED")}</Badge>
                  </div>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={language === "ar" ? "ملاحظات" : "Notes"} />
                  <Button onClick={submitPractical} className="bg-amber-700 hover:bg-amber-800">{language === "ar" ? "تسجيل نتيجة الامتحان العملي" : "Record Practical Exam Result"}</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
