import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListLicenseCategories,
  getListLicenseCategoriesQueryKey,
  useCreateApplication,
  useListServices,
  getListServicesQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { CheckCircle, CreditCard, ImageIcon, ShieldCheck, Upload, UserRound, X } from "lucide-react";

const STEPS = [
  { en: "Choose category", ar: "اختيار الفئة" },
  { en: "Upload certificate", ar: "رفع شهادة التدريب" },
  { en: "Confirm information", ar: "تأكيد المعلومات" },
  { en: "Submit for review", ar: "الإرسال للمراجعة" },
];

type TrainingCertificateUpload = {
  fileUrl: string;
  fileName: string;
  mimeType: string;
};

function fullName(profile: any) {
  return [profile?.firstName, profile?.secondName, profile?.thirdName, profile?.familyName].filter(Boolean).join(" ");
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function ServiceIssueLicense() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const [step, setStep] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [trainingCertificate, setTrainingCertificate] = useState<TrainingCertificateUpload | null>(null);
  const [certificateError, setCertificateError] = useState("");

  const { data: categories, isLoading: catsLoading } = useListLicenseCategories({ query: { queryKey: getListLicenseCategoriesQueryKey() } });
  const { data: services } = useListServices({ query: { queryKey: getListServicesQueryKey() } });
  const createApp = useCreateApplication();

  const profile = user?.profile;
  const selectedCategory = categories?.find((cat: any) => cat.id === selectedCategoryId) as any;

  const handleCertificateFile = async (file: File | undefined) => {
    setCertificateError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setTrainingCertificate(null);
      setCertificateError(language === "ar" ? "يرجى رفع صورة لشهادة التدريب." : "Please upload the training certificate as an image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setTrainingCertificate(null);
      setCertificateError(language === "ar" ? "حجم الصورة يجب ألا يتجاوز 5 ميجابايت." : "Image size must be 5 MB or less.");
      return;
    }
    try {
      const fileUrl = await readImageAsDataUrl(file);
      setTrainingCertificate({ fileUrl, fileName: file.name, mimeType: file.type });
    } catch {
      setTrainingCertificate(null);
      setCertificateError(language === "ar" ? "تعذر قراءة صورة الشهادة." : "Could not read the certificate image.");
    }
  };

  const submit = async () => {
    if (!selectedCategoryId) {
      toast({ variant: "destructive", title: language === "ar" ? "يرجى اختيار فئة الرخصة" : "Please choose a license category" });
      return;
    }
    if (!trainingCertificate) {
      toast({ variant: "destructive", title: language === "ar" ? "يرجى رفع صورة شهادة التدريب" : "Please upload the training certificate image" });
      setStep(1);
      return;
    }
    const service = services?.find((item: any) => item.code === "ISSUE_DRIVING_LICENSE");
    if (!service) {
      toast({ variant: "destructive", title: language === "ar" ? "الخدمة غير متاحة" : "Issue license service is not available" });
      return;
    }
    try {
      const app = await createApp.mutateAsync({
        data: {
          serviceId: service.id,
          licenseCategoryId: selectedCategoryId,
          governorate: profile?.governorate || "Amman",
          residenceArea: profile?.area || profile?.city || profile?.address || "Amman",
          trainingCertificate,
        },
      });
      toast({
        title: language === "ar" ? "تم تقديم طلبك للمراجعة الأمنية." : "Your application has been submitted for security review.",
        description: (app as any).applicationNumber,
      });
      setLocation(`/applications/${(app as any).id}`);
    } catch (error) {
      toast({ variant: "destructive", title: language === "ar" ? "تعذر تقديم الطلب" : "Failed to submit application", description: error instanceof Error ? error.message : undefined });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{language === "ar" ? "إصدار رخصة قيادة لأول مرة" : "Issue First-Time Driving License"}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {language === "ar"
                ? "تستخدم رخصتي بياناتك المسجلة مسبقاً. اختر فئة الرخصة وأرسل الطلب للمراجعة الأمنية."
                : "Rukhsty uses your registered profile information. Choose a license category and submit for security review."}
            </p>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            {STEPS.map((s, i) => <span key={s.en} className={i === step ? "text-primary font-medium" : ""}>{language === "ar" ? s.ar : s.en}</span>)}
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
        </div>
      </motion.div>

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>{language === "ar" ? "اختر فئة الرخصة" : "Choose license category"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {catsLoading ? <Skeleton className="h-48" /> : categories?.map((cat: any) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`w-full text-start p-4 rounded-xl border-2 transition-all ${selectedCategoryId === cat.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{language === "ar" ? cat.nameAr : cat.nameEn}</p>
                    <p className="text-xs text-muted-foreground mt-1">{cat.code} · {language === "ar" ? "العمر الأدنى" : "Minimum age"}: {cat.minimumAge}</p>
                  </div>
                  {selectedCategoryId === cat.id && <CheckCircle className="w-5 h-5 text-primary" />}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              {language === "ar" ? "رفع صورة شهادة التدريب" : "Upload training certificate image"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === "ar"
                ? "يجب إرفاق صورة شهادة التدريب قبل إرسال طلب إصدار الرخصة لأول مرة."
                : "Attach a picture of your training certificate before submitting a first-time license application."}
            </p>
            <label className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${trainingCertificate ? "border-emerald-300 bg-emerald-50" : "border-border bg-muted/30 hover:border-primary/50"}`}>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => void handleCertificateFile(event.target.files?.[0])}
              />
              <ImageIcon className={`h-9 w-9 ${trainingCertificate ? "text-emerald-700" : "text-muted-foreground"}`} />
              <p className="mt-3 text-sm font-semibold">
                {trainingCertificate
                  ? trainingCertificate.fileName
                  : language === "ar" ? "اختر صورة الشهادة" : "Choose certificate image"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {language === "ar" ? "PNG أو JPG أو أي صورة حتى 5 ميجابايت" : "PNG, JPG, or any image up to 5 MB"}
              </p>
            </label>
            {certificateError && <p className="text-sm text-destructive">{certificateError}</p>}
            {trainingCertificate && (
              <div className="rounded-2xl border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{language === "ar" ? "تم إرفاق الشهادة" : "Certificate attached"}</p>
                    <p className="text-xs text-muted-foreground">{trainingCertificate.mimeType}</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => setTrainingCertificate(null)}>
                    <X className="h-3.5 w-3.5" />
                    {language === "ar" ? "إزالة" : "Remove"}
                  </Button>
                </div>
                <img src={trainingCertificate.fileUrl} alt={language === "ar" ? "صورة شهادة التدريب" : "Training certificate preview"} className="mt-3 max-h-72 w-full rounded-xl object-contain bg-muted/40" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserRound className="w-4 h-4 text-primary" />{language === "ar" ? "تأكيد البيانات الشخصية" : "Confirm personal information"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[120px_1fr]">
            <div className="w-28 h-32 rounded-2xl bg-muted overflow-hidden border flex items-center justify-center">
              {profile?.personalPhotoUrl ? <img src={profile.personalPhotoUrl} alt="profile" className="w-full h-full object-cover" /> : <UserRound className="w-10 h-10 text-muted-foreground" />}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                [language === "ar" ? "الاسم الكامل" : "Full name", fullName(profile) || "—"],
                [language === "ar" ? "الرقم الوطني" : "National ID", profile?.nationalId || "—"],
                [language === "ar" ? "البريد الإلكتروني" : "Email", user?.email || "—"],
                [language === "ar" ? "الهاتف" : "Phone", profile?.phone || "—"],
                [language === "ar" ? "تاريخ الميلاد" : "Date of birth", (profile as any)?.dateOfBirth || "—"],
                [language === "ar" ? "الجنس" : "Gender", (profile as any)?.gender || "—"],
                [language === "ar" ? "المحافظة" : "Governorate", profile?.governorate || "—"],
                [language === "ar" ? "العنوان" : "Address", profile?.address || profile?.area || "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium text-sm mt-1">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <ShieldCheck className="w-5 h-5" />
              {language === "ar" ? "تقديم الطلب للمراجعة الأمنية" : "Submit for security review"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-emerald-900 dark:text-emerald-100">
              {language === "ar"
                ? "بعد الإرسال سيتم تحويل الطلب إلى الأمن العام / إدارة ترخيص السواقين والمركبات للمراجعة."
                : "After submission, the application will be routed to Public Security / DVLD review."}
            </p>
            {selectedCategory && (
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-emerald-700 text-white">
                  {language === "ar" ? selectedCategory.nameAr : selectedCategory.nameEn}
                </Badge>
                {trainingCertificate && (
                  <Badge className="bg-white text-emerald-800 hover:bg-white">
                    {language === "ar" ? "شهادة التدريب مرفقة" : "Training certificate attached"}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {step > 0 && <Button variant="outline" onClick={() => setStep((s) => s - 1)}>{language === "ar" ? "رجوع" : "Back"}</Button>}
        {step < STEPS.length - 1 ? (
          <Button className="flex-1" onClick={() => {
            if (step === 0 && !selectedCategoryId) {
              toast({ variant: "destructive", title: language === "ar" ? "يرجى اختيار فئة الرخصة" : "Please choose a license category" });
              return;
            }
            if (step === 1 && !trainingCertificate) {
              toast({ variant: "destructive", title: language === "ar" ? "يرجى رفع صورة شهادة التدريب" : "Please upload the training certificate image" });
              return;
            }
            setStep((s) => s + 1);
          }}>
            {language === "ar" ? "التالي" : "Next"}
          </Button>
        ) : (
          <Button className="flex-1 bg-emerald-700 hover:bg-emerald-800" onClick={submit} disabled={createApp.isPending}>
            {createApp.isPending ? (language === "ar" ? "جارٍ الإرسال..." : "Submitting...") : (language === "ar" ? "إرسال الطلب" : "Submit application")}
          </Button>
        )}
      </div>
    </div>
  );
}
