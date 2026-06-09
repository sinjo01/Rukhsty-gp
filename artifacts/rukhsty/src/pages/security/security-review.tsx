import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListAdminApplicationsQueryKey, useListAdminApplications } from "@workspace/api-client-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, Eye, FileSearch, FileText, ImageIcon, Info, Maximize2, RefreshCw, Search, ShieldCheck, UserCheck, XCircle } from "lucide-react";
import { motion } from "framer-motion";

type ReviewAction = "APPROVE" | "REJECT" | "INFO";

function fullName(profile: any) {
  return [profile?.firstName, profile?.secondName, profile?.thirdName, profile?.familyName].filter(Boolean).join(" ");
}

function actionCopy(action: ReviewAction, isArabic: boolean) {
  if (action === "APPROVE") return isArabic ? "الموافقة على الطلب" : "Approve Application";
  if (action === "REJECT") return isArabic ? "رفض الطلب" : "Reject Application";
  return isArabic ? "طلب معلومات إضافية" : "Request More Information";
}

function applicationList(value: unknown): any[] {
  const maybeData = (value as any)?.data ?? value;
  return Array.isArray(maybeData) ? maybeData : [];
}

function trainingCertificate(app: any) {
  return app.documents?.find((doc: any) => doc.documentType === "TRAINING_CERTIFICATE") ?? null;
}

export default function SecurityReview() {
  const { language, isRTL } = useLanguage();
  const isArabic = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [detailsApp, setDetailsApp] = useState<any | null>(null);
  const [photoPreview, setPhotoPreview] = useState<{ src: string; name: string } | null>(null);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; id: string; action: ReviewAction }>({ open: false, id: "", action: "APPROVE" });
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [removedApplicationIds, setRemovedApplicationIds] = useState<Set<string>>(new Set());

  const listParams = { status: "SECURITY_REVIEW", serviceCode: "ISSUE_DRIVING_LICENSE" } as any;
  const { data, isLoading } = useListAdminApplications(listParams, {
    query: { queryKey: getListAdminApplicationsQueryKey(listParams) },
  });
  const apps = useMemo(() => {
    return applicationList(data)
      .filter((app: any) => app.status === "SECURITY_REVIEW")
      .filter((app: any) => !removedApplicationIds.has(app.id))
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [data, removedApplicationIds]);
  const recentParams = { serviceCode: "ISSUE_DRIVING_LICENSE", limit: 5 } as any;
  const { data: recentData } = useListAdminApplications(recentParams, {
    query: { queryKey: getListAdminApplicationsQueryKey(recentParams) },
  });
  const recentApps = applicationList(recentData).filter((app: any) => app.status !== "SECURITY_REVIEW");
  const filteredApps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return apps;
    return apps.filter((app: any) => {
      const citizenName = fullName(app.profile).toLowerCase();
      const nationalId = String(app.profile?.nationalId ?? "").toLowerCase();
      const applicationNumber = String(app.applicationNumber ?? "").toLowerCase();
      return nationalId.includes(query) || applicationNumber.includes(query) || citizenName.includes(query);
    });
  }, [apps, searchQuery]);
  const submittedToday = apps.filter((app: any) => new Date(app.createdAt).toDateString() === new Date().toDateString()).length;
  const readyCount = apps.length;
  const reviewedCount = recentApps.length;

  const refreshApplications = () => {
    queryClient.invalidateQueries({ queryKey: getListAdminApplicationsQueryKey(listParams) });
    queryClient.invalidateQueries({ queryKey: getListAdminApplicationsQueryKey({} as any) });
  };

  const submitAction = async () => {
    const action = actionDialog.action;
    if ((action === "REJECT" || action === "INFO") && !note.trim()) {
      toast({ variant: "destructive", title: isArabic ? "يرجى إدخال السبب أو الملاحظة" : "Please enter a reason or note" });
      return;
    }

    const endpoint = action === "APPROVE" ? "approve" : action === "REJECT" ? "reject" : "request-more-info";
    const body = action === "REJECT" ? { rejectionReason: note.trim() } : action === "INFO" ? { note: note.trim() } : {};

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/security/applications/${actionDialog.id}/${endpoint}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message ?? `HTTP ${response.status}`);
      }
      toast({
        title: isArabic ? "تم تحديث الطلب" : "Application updated",
        description: actionCopy(action, isArabic),
      });
      if (action === "APPROVE" || action === "REJECT") {
        setRemovedApplicationIds((ids) => new Set(ids).add(actionDialog.id));
        if (detailsApp?.id === actionDialog.id) setDetailsApp(null);
      }
      setActionDialog({ open: false, id: "", action: "APPROVE" });
      setNote("");
      refreshApplications();
    } catch (error) {
      toast({ variant: "destructive", title: isArabic ? "فشل الإجراء" : "Action failed", description: error instanceof Error ? error.message : undefined });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-950 via-emerald-800 to-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <ShieldCheck className="h-6 w-6 text-amber-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-100">{isArabic ? "إدارة المراجعة الأمنية" : "Public Security Review Desk"}</p>
              <h1 className="mt-1 text-3xl font-bold">{isArabic ? "لوحة مراجعة طلبات الرخص" : "Security Review Dashboard"}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                {isArabic ? "راجع طلبات إصدار الرخص لأول مرة، ابحث بالرقم الوطني، وتأكد من بيانات المواطن قبل الموافقة أو الرفض." : "Review first-time license applications, search by national ID, and verify citizen details before approving or rejecting."}
              </p>
            </div>
          </div>
          <Button variant="secondary" className="gap-2 bg-white text-emerald-950 hover:bg-amber-50" onClick={refreshApplications}>
            <RefreshCw className="h-4 w-4" />
            {isArabic ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: isArabic ? "قيد المراجعة" : "Pending review", value: readyCount, icon: FileSearch, color: "bg-blue-50 text-blue-700 border-blue-100" },
          { label: isArabic ? "مقدمة اليوم" : "Submitted today", value: submittedToday, icon: Clock, color: "bg-amber-50 text-amber-700 border-amber-100" },
          { label: isArabic ? "تمت مراجعتها مؤخراً" : "Recently reviewed", value: reviewedCount, icon: UserCheck, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
        ].map((item) => (
          <Card key={item.label} className="border-slate-200">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-3xl font-bold">{item.value}</p>
              </div>
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl border", item.color)}>
                <item.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/15">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className={cn("absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={isArabic ? "ابحث بالرقم الوطني، اسم المواطن، أو رقم الطلب..." : "Search by national ID, citizen name, or application number..."}
                className={cn("h-11", isRTL ? "pr-10" : "pl-10")}
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-9 px-3">
                {filteredApps.length} / {apps.length} {isArabic ? "نتيجة" : "results"}
              </Badge>
              {searchQuery && (
                <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                  {isArabic ? "مسح" : "Clear"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && <div className="space-y-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-28" />)}</div>}

      <div className="space-y-3">
        {filteredApps.map((app: any, index: number) => {
          const citizenName = fullName(app.profile) || app.user?.email || (isArabic ? "مواطن" : "Citizen");
          const certificate = trainingCertificate(app);
          return (
            <motion.div key={app.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
              <Card className="overflow-hidden transition-all hover:border-primary/30 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar className="h-14 w-14 border">
                        <AvatarImage src={app.profile?.personalPhotoUrl || undefined} />
                        <AvatarFallback>{citizenName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-sm font-semibold">{app.applicationNumber}</p>
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{isArabic ? "المراجعة الأمنية" : "Security Review"}</Badge>
                        </div>
                        <p className="mt-1 font-semibold">{citizenName}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-mono">{app.profile?.nationalId || "N/A"}</span>
                          <span>{isArabic ? app.licenseCategory?.nameAr : app.licenseCategory?.nameEn || app.licenseCategory?.code || "License category"}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(app.createdAt).toLocaleDateString()}</span>
                          <span className={cn("flex items-center gap-1 font-medium", certificate ? "text-emerald-700" : "text-red-600")}>
                            <ImageIcon className="h-3 w-3" />
                            {certificate ? (isArabic ? "شهادة التدريب مرفقة" : "Training certificate attached") : (isArabic ? "شهادة التدريب غير مرفقة" : "Training certificate missing")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={cn("flex flex-wrap gap-2", isRTL ? "lg:justify-start" : "lg:justify-end")}>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setDetailsApp(app)}>
                        <Eye className="h-3.5 w-3.5" />{isArabic ? "التفاصيل" : "View Details"}
                      </Button>
                      <Button size="sm" className="gap-1 bg-emerald-700 hover:bg-emerald-800" onClick={() => setActionDialog({ open: true, id: app.id, action: "APPROVE" })}>
                        <CheckCircle className="h-3.5 w-3.5" />{isArabic ? "موافقة" : "Approve"}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-amber-700 hover:bg-amber-50" onClick={() => setActionDialog({ open: true, id: app.id, action: "INFO" })}>
                        <Info className="h-3.5 w-3.5" />{isArabic ? "معلومات" : "More Info"}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => setActionDialog({ open: true, id: app.id, action: "REJECT" })}>
                        <XCircle className="h-3.5 w-3.5" />{isArabic ? "رفض" : "Reject"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {!isLoading && apps.length > 0 && filteredApps.length === 0 && (
          <div className="rounded-lg border border-dashed bg-white py-14 text-center text-muted-foreground">
            <Search className="mx-auto mb-3 h-8 w-8 opacity-60" />
            <p className="font-medium text-foreground">{isArabic ? "لا يوجد طلب مطابق للبحث" : "No matching application found"}</p>
            <p className="mt-2 text-sm">{isArabic ? "تأكد من الرقم الوطني أو امسح البحث لعرض جميع الطلبات." : "Check the national ID or clear search to show all pending applications."}</p>
          </div>
        )}
        {!isLoading && apps.length === 0 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed py-14 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-8 w-8 opacity-60" />
              <p className="font-medium text-foreground">
                {isArabic ? "لا توجد طلبات إصدار رخصة جديدة بانتظار المراجعة الأمنية" : "No first-time driving license applications are waiting for security review"}
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm">
                {isArabic
                  ? "تظهر هنا فقط طلبات إصدار رخصة القيادة لأول مرة عندما تكون حالتها SECURITY_REVIEW. طلبات التجديد والمركبات لا تظهر في قائمة الأمن."
                  : "Only first-time driving license applications with SECURITY_REVIEW status appear here. Renewal and vehicle services are intentionally excluded from the security queue."}
              </p>
            </div>
            {recentApps.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-semibold">{isArabic ? "آخر طلبات إصدار الرخصة" : "Recent First-Time License Applications"}</p>
                    <Badge variant="outline">{isArabic ? "للمتابعة فقط" : "Reference only"}</Badge>
                  </div>
                  <div className="grid gap-2">
                    {recentApps.map((app: any) => (
                      <div key={app.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
                        <div>
                          <p className="font-mono font-semibold">{app.applicationNumber}</p>
                          <p className="text-xs text-muted-foreground">{fullName(app.profile) || app.user?.email || "Citizen"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">{app.status?.replace(/_/g, " ")}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <Dialog open={Boolean(detailsApp)} onOpenChange={(open) => !open && setDetailsApp(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto p-0">
          {detailsApp && (
            <div className="space-y-5 p-6 pt-5">
              <DialogHeader className="border-b pb-4">
                <DialogTitle className="text-2xl leading-tight text-slate-950">
                  {isArabic ? "تفاصيل طلب إصدار رخصة لأول مرة" : "First-Time License Application Details"}
                </DialogTitle>
                <p className="break-all font-mono text-sm font-semibold text-muted-foreground">
                  {detailsApp.applicationNumber}
                </p>
              </DialogHeader>

              <div className="rounded-2xl border bg-gradient-to-r from-emerald-950 to-slate-900 p-5 text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => detailsApp.profile?.personalPhotoUrl && setPhotoPreview({ src: detailsApp.profile.personalPhotoUrl, name: fullName(detailsApp.profile) || "Applicant photo" })}
                    className="h-36 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-white/25 bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  >
                    {detailsApp.profile?.personalPhotoUrl ? (
                      <img src={detailsApp.profile.personalPhotoUrl} alt={fullName(detailsApp.profile)} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-white/70">{isArabic ? "لا توجد صورة" : "No photo"}</div>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-amber-100">{isArabic ? "مقدم الطلب" : "Applicant"}</p>
                    <h2 className="mt-1 text-2xl font-bold">{fullName(detailsApp.profile) || detailsApp.user?.email || "Citizen"}</h2>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      <Badge className="bg-white/15 text-white hover:bg-white/15">{detailsApp.profile?.nationalId || "N/A"}</Badge>
                      <Badge className="bg-amber-200 text-emerald-950 hover:bg-amber-200">{detailsApp.status?.replace(/_/g, " ")}</Badge>
                      <Badge className="bg-white/15 text-white hover:bg-white/15">{detailsApp.applicationNumber}</Badge>
                    </div>
                    {detailsApp.profile?.personalPhotoUrl && (
                      <p className="mt-3 text-xs text-white/65">{isArabic ? "اضغط على الصورة لعرضها بحجم أكبر." : "Click the photo to view it larger."}</p>
                    )}
                  </div>
                </div>
              </div>

              {(() => {
                const certificate = trainingCertificate(detailsApp);
                return (
                  <div className={cn("rounded-2xl border p-4", certificate ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50")}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className={cn("flex items-center gap-2 text-base font-bold", certificate ? "text-emerald-950" : "text-red-800")}>
                          <ImageIcon className="h-5 w-5" />
                          {isArabic ? "شهادة التدريب المطلوبة" : "Required Training Certificate"}
                        </p>
                        <p className={cn("mt-1 text-sm", certificate ? "text-emerald-800" : "text-red-700")}>
                          {certificate
                            ? (isArabic ? "الصورة مرفقة ويمكن فتحها للمراجعة." : "Image is attached. Open it to review the certificate clearly.")
                            : (isArabic ? "لا توافق على الطلب حتى يتم رفع صورة شهادة التدريب." : "Do not approve this application until the training certificate image is uploaded.")}
                        </p>
                      </div>
                      <Badge className={certificate ? "bg-emerald-700 text-white hover:bg-emerald-700" : "bg-red-600 text-white hover:bg-red-600"}>
                        {certificate ? certificate.verificationStatus : (isArabic ? "غير مرفقة" : "Missing")}
                      </Badge>
                    </div>
                    {certificate && (
                      <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
                        <button
                          type="button"
                          onClick={() => setPhotoPreview({ src: certificate.fileUrl, name: certificate.fileName || (isArabic ? "شهادة التدريب" : "Training certificate") })}
                          className="overflow-hidden rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          aria-label={isArabic ? "فتح صورة شهادة التدريب" : "Open training certificate image"}
                        >
                          <img src={certificate.fileUrl} alt={isArabic ? "صورة شهادة التدريب" : "Training certificate"} className="h-36 w-full object-contain" />
                        </button>
                        <div className="space-y-3">
                          <div className="rounded-xl border bg-white/80 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{isArabic ? "اسم الملف" : "File name"}</p>
                            <p className="mt-1 break-all text-sm font-semibold text-slate-950">{certificate.fileName || "training-certificate"}</p>
                          </div>
                          <Button
                            className="w-full gap-2 bg-emerald-700 hover:bg-emerald-800 md:w-auto"
                            onClick={() => setPhotoPreview({ src: certificate.fileUrl, name: certificate.fileName || (isArabic ? "شهادة التدريب" : "Training certificate") })}
                          >
                            <Maximize2 className="h-4 w-4" />
                            {isArabic ? "عرض الشهادة بوضوح" : "View Certificate"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  [isArabic ? "رقم الطلب" : "Application number", detailsApp.applicationNumber],
                  [isArabic ? "الرقم الوطني" : "National ID", detailsApp.profile?.nationalId],
                  [isArabic ? "البريد الإلكتروني" : "Email", detailsApp.user?.email],
                  [isArabic ? "تاريخ الميلاد" : "Date of birth", detailsApp.profile?.dateOfBirth],
                  [isArabic ? "فئة الرخصة" : "License category", isArabic ? detailsApp.licenseCategory?.nameAr : detailsApp.licenseCategory?.nameEn],
                  [isArabic ? "المحافظة" : "Governorate", detailsApp.governorate || detailsApp.profile?.governorate],
                  [isArabic ? "العنوان" : "Address", detailsApp.profile?.address],
                  [isArabic ? "تاريخ التقديم" : "Submitted date", detailsApp.submittedAt ? new Date(detailsApp.submittedAt).toLocaleString() : new Date(detailsApp.createdAt).toLocaleString()],
                  [isArabic ? "الخطوة الحالية" : "Current step", detailsApp.currentStep?.replace(/_/g, " ")],
                  [isArabic ? "الحالة" : "Status", detailsApp.status?.replace(/_/g, " ")],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-1 break-words text-base font-semibold text-slate-950">{value || "N/A"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(photoPreview)} onOpenChange={(open) => !open && setPhotoPreview(null)}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
          <DialogHeader><DialogTitle className="break-words text-xl">{photoPreview?.name}</DialogTitle></DialogHeader>
          {photoPreview && (
            <div className="flex justify-center rounded-2xl bg-slate-100 p-4">
              <img src={photoPreview.src} alt={photoPreview.name} className="max-h-[78vh] w-full rounded-xl object-contain shadow-sm" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog((dialog) => ({ ...dialog, open }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>{actionCopy(actionDialog.action, isArabic)}</DialogTitle></DialogHeader>
          {actionDialog.action !== "APPROVE" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{actionDialog.action === "REJECT" ? (isArabic ? "سبب الرفض" : "Rejection reason") : (isArabic ? "الملاحظة المطلوبة" : "Requested information note")}</label>
              <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder={isArabic ? "اكتب الملاحظة..." : "Write the note..."} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, id: "", action: "APPROVE" })}>{isArabic ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={submitAction} disabled={isSubmitting} className={actionDialog.action === "REJECT" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-700 hover:bg-emerald-800"}>
              {isArabic ? "تأكيد" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
