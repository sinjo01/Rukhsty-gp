import { useState } from "react";
import { useListOfficerAppointments, getListOfficerAppointmentsQueryKey, useUpdateAppointmentStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedLabel } from "@/lib/locale-labels";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Calendar, User, Clock, Stethoscope } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-700",
  CHECKED_IN: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  NO_SHOW: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-600",
  PASSED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

export default function OfficerAppointments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const { data: appointments, isLoading } = useListOfficerAppointments({}, { query: { queryKey: getListOfficerAppointmentsQueryKey({}) } });
  const updateStatus = useUpdateAppointmentStatus();
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [medicalResult, setMedicalResult] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, data: { status: status as any } });
      queryClient.invalidateQueries({ queryKey: getListOfficerAppointmentsQueryKey({}) });
      toast({ title: `Status updated to ${status}` });
    } catch {
      toast({ variant: "destructive", title: "Failed to update status" });
    }
  };

  const openMedicalResult = (appointment: any) => {
    setSelectedAppointment(appointment);
    setMedicalResult("");
    setNotes("");
  };

  const submitMedicalResult = async () => {
    if (!selectedAppointment) return;
    if (!medicalResult) {
      toast({ variant: "destructive", title: language === "ar" ? "نتيجة الفحص مطلوبة" : "Vision result is required" });
      return;
    }
    if (medicalResult === "NOT_FIT_TO_DRIVE" && !notes.trim()) {
      toast({
        variant: "destructive",
        title: language === "ar" ? "الملاحظات مطلوبة" : "Notes are required",
        description: language === "ar" ? "أضف ملاحظات عند اختيار غير مؤهل للقيادة." : "Please add medical notes when the citizen is not fit to drive.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/officer/medical/record", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`,
        },
        body: JSON.stringify({
          applicationId: selectedAppointment.applicationId,
          centerId: selectedAppointment.centerId,
          result: medicalResult,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? `HTTP ${response.status}`);
      await queryClient.invalidateQueries({ queryKey: getListOfficerAppointmentsQueryKey({}) });
      setSelectedAppointment(null);
      setMedicalResult("");
      setNotes("");
      toast({
        title: language === "ar" ? "تم تسجيل نتيجة فحص النظر" : "Medical / vision result recorded",
        description: language === "ar" ? "تم نقل الطلب إلى الخطوة التالية." : "The application moved to the next step.",
      });
    } catch (error) {
      toast({ variant: "destructive", title: language === "ar" ? "فشل تسجيل النتيجة" : "Failed to record result", description: error instanceof Error ? error.message : undefined });
    } finally {
      setSubmitting(false);
    }
  };

  const isMedicalAppointment = (apt: any) => ["MEDICAL_TEST", "VISION_TEST"].includes(apt.appointmentType);
  const canRecordMedical = (apt: any) => isMedicalAppointment(apt) && !["NO_SHOW", "CANCELLED"].includes(apt.status) && !["MEDICAL_PASSED", "MEDICAL_REJECTED", "LICENSE_RENEWED", "RENEWAL_MEDICAL_REJECTED"].includes(apt.application?.status ?? "");

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">{language === "ar" ? "مواعيد المركز" : "Center Appointments"}</h1>
        <p className="text-muted-foreground text-sm mt-1">{language === "ar" ? "إدارة المواعيد وتحديث حالاتها" : "Manage and update appointment statuses"}</p>
      </motion.div>

      {isLoading && <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-28" />)}</div>}

      {!isLoading && !appointments?.length && (
        <div className="text-center py-20">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold">{language === "ar" ? "لا توجد مواعيد لهذا المركز" : "No appointments for this center"}</h3>
        </div>
      )}

      <div className="space-y-3">
        {appointments?.map((apt: any, i: number) => (
          <motion.div key={apt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card
              className={canRecordMedical(apt) ? "cursor-pointer transition hover:border-emerald-300 hover:shadow-sm" : ""}
              onClick={() => { if (canRecordMedical(apt)) openMedicalResult(apt); }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{apt.profile?.firstName ?? apt.user?.email ?? (language === "ar" ? "مواطن" : "Citizen")} {apt.profile?.familyName ?? ""}</p>
                      <p className="text-xs text-muted-foreground">{apt.profile?.nationalId ? `${language === "ar" ? "الرقم الوطني" : "National ID"}: ${apt.profile.nationalId}` : apt.user?.email ?? ""}</p>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "الطلب" : "Application"}: <span className="font-mono">{apt.application?.applicationNumber ?? apt.applicationId}</span></p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{apt.appointmentDate}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.startTime}</span>
                        <span className="font-medium text-foreground">{localizedLabel(apt.appointmentType, language)}</span>
                        {apt.queueNumber && <span>{language === "ar" ? "الدور" : "Queue"} #{apt.queueNumber}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs ${STATUS_COLORS[apt.status] ?? "bg-slate-100 text-slate-700"}`}>{localizedLabel(apt.status, language)}</Badge>
                    {apt.status === "BOOKED" && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={(event) => { event.stopPropagation(); handleStatus(apt.id, "CHECKED_IN"); }} data-testid={`btn-checkin-${apt.id}`}>
                        Check In
                      </Button>
                    )}
                    {(apt.status === "BOOKED" || apt.status === "CHECKED_IN") && (
                      <>
                        {isMedicalAppointment(apt) ? (
                          <Button size="sm" className="text-xs h-7 bg-emerald-700 hover:bg-emerald-800 gap-1" onClick={(event) => { event.stopPropagation(); openMedicalResult(apt); }} data-testid={`btn-record-medical-${apt.id}`}>
                            <Stethoscope className="h-3 w-3" />
                            {language === "ar" ? "تسجيل النتيجة" : "Record Result"}
                          </Button>
                        ) : (
                          <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700" onClick={(event) => { event.stopPropagation(); handleStatus(apt.id, "COMPLETED"); }} data-testid={`btn-complete-${apt.id}`}>
                            Complete
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50" onClick={(event) => { event.stopPropagation(); handleStatus(apt.id, "NO_SHOW"); }}>
                          No Show
                        </Button>
                      </>
                    )}
                    {canRecordMedical(apt) && apt.status === "COMPLETED" && (
                      <Button size="sm" className="text-xs h-7 bg-emerald-700 hover:bg-emerald-800 gap-1" onClick={(event) => { event.stopPropagation(); openMedicalResult(apt); }} data-testid={`btn-record-medical-${apt.id}`}>
                        <Stethoscope className="h-3 w-3" />
                        {language === "ar" ? "تسجيل النتيجة" : "Record Result"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={Boolean(selectedAppointment)} onOpenChange={(open) => { if (!open) setSelectedAppointment(null); }}>
        <DialogContent className="max-w-2xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-emerald-700" />
              {language === "ar" ? "تسجيل نتيجة فحص النظر" : "Record Medical / Vision Test Result"}
            </DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-5">
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p><span className="text-muted-foreground">{language === "ar" ? "الاسم:" : "Full name:"}</span> <strong>{selectedAppointment.profile?.firstName ?? selectedAppointment.user?.email ?? "Citizen"} {selectedAppointment.profile?.familyName ?? ""}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "الرقم الوطني:" : "National ID:"}</span> <strong className="font-mono">{selectedAppointment.profile?.nationalId ?? "—"}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "رقم الطلب:" : "Application number:"}</span> <strong className="font-mono">{selectedAppointment.application?.applicationNumber ?? selectedAppointment.applicationId}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "الموعد:" : "Appointment:"}</span> <strong>{selectedAppointment.appointmentDate} · {selectedAppointment.startTime}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "نوع الموعد:" : "Appointment type:"}</span> <strong>{selectedAppointment.appointmentType?.replace(/_/g, " ")}</strong></p>
                  <p><span className="text-muted-foreground">{language === "ar" ? "حالة الطلب:" : "Application status:"}</span> <Badge variant="outline">{selectedAppointment.application?.status?.replace(/_/g, " ") ?? "—"}</Badge></p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">{language === "ar" ? "نتيجة فحص النظر" : "Vision result"} <span className="text-red-500">*</span></Label>
                <RadioGroup value={medicalResult} onValueChange={setMedicalResult} className="grid gap-2 sm:grid-cols-3">
                  {[
                    { value: "DOES_NOT_NEED_GLASSES", en: "Does not need glasses", ar: "لا يحتاج نظارة" },
                    { value: "NEEDS_GLASSES", en: "Needs glasses", ar: "يحتاج نظارة" },
                    { value: "NOT_FIT_TO_DRIVE", en: "Not fit to drive", ar: "غير مؤهل للقيادة" },
                  ].map((option) => (
                    <Label key={option.value} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${medicalResult === option.value ? "border-emerald-600 bg-emerald-50" : "hover:bg-muted/50"}`}>
                      <RadioGroupItem value={option.value} />
                      <span>{language === "ar" ? option.ar : option.en}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment-medical-notes">{language === "ar" ? "ملاحظات" : "Notes"} {medicalResult === "NOT_FIT_TO_DRIVE" && <span className="text-red-500">*</span>}</Label>
                <Textarea
                  id="appointment-medical-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={language === "ar" ? "أضف ملاحظات طبية عند الحاجة" : "Add medical notes if needed"}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAppointment(null)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={submitMedicalResult} disabled={submitting} className="bg-emerald-700 hover:bg-emerald-800">
              {submitting ? (language === "ar" ? "جارٍ الإرسال..." : "Submitting...") : (language === "ar" ? "إرسال النتيجة" : "Submit Result")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
