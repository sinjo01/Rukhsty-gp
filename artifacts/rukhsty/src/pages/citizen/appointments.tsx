import { useListAppointments, getListAppointmentsQueryKey, useCancelAppointment } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Calendar, Building2, Clock, Hash } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedGovernorate, localizedLabel } from "@/lib/locale-labels";

const STATUS_COLORS: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  CHECKED_IN: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  NO_SHOW: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export default function Appointments() {
  const { language, isRTL, pick } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: appointments, isLoading } = useListAppointments({ query: { queryKey: getListAppointmentsQueryKey() } });
  const cancelMutation = useCancelAppointment();

  const handleCancel = async (id: string) => {
    try {
      await cancelMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
      toast({ title: pick("Appointment cancelled", "تم إلغاء الموعد") });
    } catch {
      toast({ variant: "destructive", title: pick("Failed to cancel appointment", "فشل إلغاء الموعد") });
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">{pick("My Appointments", "مواعيدي")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{pick("Upcoming and past appointments", "المواعيد القادمة والسابقة")}</p>
      </motion.div>

      {isLoading && <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>}

      {!isLoading && (!appointments || appointments.length === 0) && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">{pick("No appointments", "لا توجد مواعيد")}</h3>
          <p className="text-muted-foreground text-sm mt-1">{pick("Appointments will appear here once you book them", "ستظهر مواعيدك هنا بعد حجزها")}</p>
        </div>
      )}

      <div className="space-y-3">
        {appointments?.map((apt: any, i: number) => (
          <motion.div key={apt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{localizedLabel(apt.appointmentType, language)}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{apt.appointmentDate}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.startTime} – {apt.endTime}</span>
                        {apt.queueNumber && <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium"><Hash className="w-3 h-3" />{pick("Queue", "الدور")} {apt.queueNumber}</span>}
                      </div>
                      {apt.center && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="w-3 h-3" />{language === "ar" ? apt.center.nameAr : apt.center.nameEn} · {localizedGovernorate(apt.center.governorate, language)}
                        </div>
                      )}
                      {apt.notes && <p className="text-xs text-muted-foreground italic">{apt.notes}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`text-xs ${STATUS_COLORS[apt.status] ?? "bg-slate-100 text-slate-700"}`}>{localizedLabel(apt.status, language)}</Badge>
                    {apt.status === "BOOKED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                        onClick={() => handleCancel(apt.id)}
                        disabled={cancelMutation.isPending}
                        data-testid={`btn-cancel-${apt.id}`}
                      >
                        {pick("Cancel", "إلغاء")}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
