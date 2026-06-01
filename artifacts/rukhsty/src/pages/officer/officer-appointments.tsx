import { useListOfficerAppointments, getListOfficerAppointmentsQueryKey, useUpdateAppointmentStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Calendar, User, Clock } from "lucide-react";

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
  const { data: appointments, isLoading } = useListOfficerAppointments({}, { query: { queryKey: getListOfficerAppointmentsQueryKey({}) } });
  const updateStatus = useUpdateAppointmentStatus();

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, data: { status: status as any } });
      queryClient.invalidateQueries({ queryKey: getListOfficerAppointmentsQueryKey({}) });
      toast({ title: `Status updated to ${status}` });
    } catch {
      toast({ variant: "destructive", title: "Failed to update status" });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Center Appointments</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage and update appointment statuses</p>
      </motion.div>

      {isLoading && <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-28" />)}</div>}

      {!isLoading && !appointments?.length && (
        <div className="text-center py-20">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold">No appointments for this center</h3>
        </div>
      )}

      <div className="space-y-3">
        {appointments?.map((apt: any, i: number) => (
          <motion.div key={apt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{apt.profile?.firstName ?? apt.user?.email ?? "Citizen"} {apt.profile?.familyName ?? ""}</p>
                      <p className="text-xs text-muted-foreground">{apt.profile?.nationalId ? `National ID: ${apt.profile.nationalId}` : apt.user?.email ?? ""}</p>
                      <p className="text-xs text-muted-foreground">Application: <span className="font-mono">{apt.application?.applicationNumber ?? apt.applicationId}</span></p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{apt.appointmentDate}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.startTime}</span>
                        <span className="font-medium text-foreground">{apt.appointmentType?.replace(/_/g, " ")}</span>
                        {apt.queueNumber && <span>Queue #{apt.queueNumber}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs ${STATUS_COLORS[apt.status] ?? "bg-slate-100 text-slate-700"}`}>{apt.status}</Badge>
                    {apt.status === "BOOKED" && (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleStatus(apt.id, "CHECKED_IN")} data-testid={`btn-checkin-${apt.id}`}>
                        Check In
                      </Button>
                    )}
                    {(apt.status === "BOOKED" || apt.status === "CHECKED_IN") && (
                      <>
                        <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700" onClick={() => handleStatus(apt.id, "COMPLETED")} data-testid={`btn-complete-${apt.id}`}>
                          Complete
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatus(apt.id, "NO_SHOW")}>
                          No Show
                        </Button>
                      </>
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
