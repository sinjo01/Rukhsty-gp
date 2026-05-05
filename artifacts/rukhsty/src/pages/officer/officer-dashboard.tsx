import { useGetOfficerDashboard, getGetOfficerDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Calendar, CheckCircle, Clock, Building2, User } from "lucide-react";

export default function OfficerDashboard() {
  const { data: dashboard, isLoading } = useGetOfficerDashboard({ query: { queryKey: getGetOfficerDashboardQueryKey() } });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-3 gap-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-64" /></div>;

  const d = dashboard as any;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Officer Dashboard</h1>
        {d?.center && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
            <Building2 className="w-4 h-4" />
            <span>{d.center.nameEn} · {d.center.governorate}</span>
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-4">
        {[
          { label: "Today's Appointments", value: d?.todayAppointments ?? 0, icon: Calendar, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
          { label: "Pending", value: d?.pendingAppointments ?? 0, icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
          { label: "Completed Today", value: d?.completedToday ?? 0, icon: CheckCircle, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Recent Appointments</CardTitle></CardHeader>
          <CardContent>
            {!d?.recentAppointments?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No appointments yet today</p>
            ) : (
              <div className="divide-y divide-border">
                {d.recentAppointments.map((apt: any) => (
                  <div key={apt.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{apt.profile?.firstName ?? apt.user?.email ?? "Citizen"} {apt.profile?.familyName ?? ""}</p>
                        <p className="text-xs text-muted-foreground">{apt.appointmentType?.replace(/_/g, " ")} · {apt.startTime}</p>
                      </div>
                    </div>
                    <Badge className={`text-xs ${apt.status === "BOOKED" ? "bg-blue-100 text-blue-700" : apt.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
