import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getGetApplicationQueryKey, getGetDashboardSummaryQueryKey, getListApplicationsQueryKey, getListCentersQueryKey, useGetApplication, useListCenters } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, CalendarDays, CheckCircle, Clock, MapPin, Car } from "lucide-react";
import { currentStepLabel, isPracticalBookingRequired, STATUS_COLORS, statusLabel } from "./application-utils";

const GOVERNORATES = ["Amman", "Zarqa", "Irbid", "Balqa", "Madaba", "Karak", "Mafraq", "Jerash", "Ajloun", "Tafilah", "Ma'an", "Aqaba"];

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function slotLabel(slot: any) {
  return `${slot.startTime} – ${slot.endTime}`;
}

export default function BookPractical({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [governorate, setGovernorate] = useState("");
  const [centerId, setCenterId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [selectedSlot, setSelectedSlot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: app, isLoading: appLoading } = useGetApplication(params.id, {
    query: { queryKey: getGetApplicationQueryKey(params.id), enabled: !!params.id },
  });
  const detail = app as any;

  useEffect(() => {
    const defaultGovernorate = detail?.governorate || user?.profile?.governorate || "Amman";
    if (defaultGovernorate && !governorate) setGovernorate(defaultGovernorate);
  }, [detail?.governorate, governorate, user?.profile?.governorate]);

  const centersParams = useMemo(() => ({ centerType: "PRACTICAL_EXAM_CENTER", governorate: governorate || undefined }), [governorate]);
  const { data: centers, isLoading: centersLoading } = useListCenters(centersParams as any, {
    query: { queryKey: getListCentersQueryKey(centersParams as any), enabled: !!governorate },
  });

  useEffect(() => {
    if (centers?.length && !centerId) setCenterId((centers[0] as any).id);
    if (centerId && centers && !centers.some((center: any) => center.id === centerId)) {
      setCenterId("");
      setSelectedSlot("");
    }
  }, [centers, centerId]);

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ["appointment-slots", centerId, date, "PRACTICAL_EXAM"],
    enabled: !!centerId && !!date,
    queryFn: async () => {
      const response = await fetch(`/api/appointments/slots?centerId=${encodeURIComponent(centerId)}&date=${encodeURIComponent(date)}&type=PRACTICAL_EXAM`, {
        headers: { authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`, accept: "application/json" },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? `HTTP ${response.status}`);
      }
      return response.json();
    },
  });

  const selectedCenter = centers?.find((center: any) => center.id === centerId) as any;

  const submitBooking = async () => {
    if (!detail || !centerId || !date || !selectedSlot) {
      toast({ variant: "destructive", title: language === "ar" ? "يرجى اختيار المركز والتاريخ والوقت" : "Please choose a center, date, and time slot" });
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          applicationId: detail.id,
          centerId,
          appointmentType: "PRACTICAL_EXAM",
          date,
          timeSlot: selectedSlot,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? `HTTP ${response.status}`);
      }
      toast({
        title: language === "ar" ? "تم حجز موعد الامتحان العملي بنجاح." : "Practical exam appointment booked successfully.",
        description: selectedCenter ? `${language === "ar" ? selectedCenter.nameAr : selectedCenter.nameEn} · ${date} · ${selectedSlot}` : undefined,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(params.id) }),
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ["appointment-slots", centerId, date, "PRACTICAL_EXAM"] }),
      ]);
      setLocation(`/applications/${detail.id}`);
    } catch (error) {
      toast({ variant: "destructive", title: language === "ar" ? "فشل الحجز" : "Booking failed", description: error instanceof Error ? error.message : undefined });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (appLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;
  }

  if (!detail) {
    return <div className="py-20 text-center text-muted-foreground">{language === "ar" ? "الطلب غير موجود" : "Application not found"}</div>;
  }

  const canBook = isPracticalBookingRequired(detail);

  return (
    <div className="mx-auto max-w-4xl space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white">
          <Car className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{language === "ar" ? "حجز الامتحان العملي" : "Book Practical Exam"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {language === "ar" ? "اختر مركز امتحان عملي معتمداً وموعداً متاحاً لاستكمال طلبك." : "Choose an authorized practical exam center and an available time slot to continue your application."}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "رقم الطلب" : "Application number"}</p>
            <p className="mt-1 font-mono text-sm font-semibold">{detail.applicationNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}</p>
            <Badge className={`mt-1 ${STATUS_COLORS[detail.status] ?? "bg-slate-100 text-slate-700"}`}>{statusLabel(detail.status, language)}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "الخطوة الحالية" : "Current step"}</p>
            <p className="mt-1 text-sm font-medium">{currentStepLabel(detail.currentStep, language)}</p>
          </div>
        </CardContent>
      </Card>

      {!canBook && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-900">
            {language === "ar" ? "هذا الطلب ليس في مرحلة حجز الامتحان العملي حالياً." : "This application is not currently ready for practical exam booking."}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-emerald-700" />{language === "ar" ? "بيانات الحجز" : "Booking details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === "ar" ? "المحافظة" : "Governorate"}</label>
              <Select value={governorate} onValueChange={(value) => { setGovernorate(value); setCenterId(""); setSelectedSlot(""); }}>
                <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر المحافظة" : "Select governorate"} /></SelectTrigger>
                <SelectContent>
                  {GOVERNORATES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === "ar" ? "التاريخ" : "Date"}</label>
              <Input type="date" min={todayIso()} value={date} onChange={(event) => { setDate(event.target.value); setSelectedSlot(""); }} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{language === "ar" ? "مركز الامتحان العملي" : "Practical Exam Center"}</label>
            {centersLoading ? <Skeleton className="h-24" /> : centers && centers.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {centers.map((center: any) => (
                  <button
                    key={center.id}
                    type="button"
                    onClick={() => { setCenterId(center.id); setSelectedSlot(""); }}
                    className={`rounded-xl border p-4 text-start transition-all ${centerId === center.id ? "border-emerald-700 bg-emerald-50" : "border-border bg-background hover:border-emerald-300"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{language === "ar" ? center.nameAr : center.nameEn}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{center.address || center.governorate}</p>
                      </div>
                      {centerId === center.id && <CheckCircle className="h-5 w-5 text-emerald-700" />}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {language === "ar" ? "لا توجد مراكز امتحان عملي متاحة في هذه المحافظة." : "No practical exam centers are available in this governorate."}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="h-4 w-4 text-emerald-700" />{language === "ar" ? "المواعيد المتاحة" : "Available Time Slot"}</label>
            {slotsLoading ? <Skeleton className="h-20" /> : slots && slots.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot: any) => (
                  <button
                    key={slot.startTime}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.startTime)}
                    className={`rounded-full border px-4 py-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-40 ${selectedSlot === slot.startTime ? "border-emerald-700 bg-emerald-700 text-white" : "border-border bg-background hover:border-emerald-300"}`}
                  >
                    <Clock className="mr-1 inline h-3 w-3" />
                    {slotLabel(slot)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {language === "ar" ? "لا توجد مواعيد متاحة في هذا اليوم. يرجى اختيار يوم آخر." : "No available slots for this date. Please choose another date."}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLocation(`/applications/${detail.id}`)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={submitBooking} disabled={!canBook || !centerId || !selectedSlot || isSubmitting}>
              {isSubmitting ? (language === "ar" ? "جارٍ الحجز..." : "Booking...") : (language === "ar" ? "تأكيد الحجز" : "Submit booking")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
