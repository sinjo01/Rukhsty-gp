import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useListApplications, getListApplicationsQueryKey, useListNotifications, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { FileText, Calendar, Bell, CreditCard, ChevronRight, ArrowRight, Shield, Clock } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PROFILE_SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  TRAINING_CENTER_SELECTED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  TRAINING_BOOKED: "bg-amber-100 text-amber-700",
  TRAINING_IN_PROGRESS: "bg-amber-100 text-amber-700",
  TRAINING_COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  MEDICAL_BOOKED: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  MEDICAL_PASSED: "bg-green-100 text-green-700",
  MEDICAL_FAILED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  THEORY_BOOKED: "bg-purple-100 text-purple-700",
  THEORY_PASSED: "bg-green-100 text-green-700",
  THEORY_FAILED: "bg-red-100 text-red-700",
  PRACTICAL_BOOKED: "bg-purple-100 text-purple-700",
  PRACTICAL_PASSED: "bg-green-100 text-green-700",
  PRACTICAL_FAILED: "bg-red-100 text-red-700",
  LICENSE_ISSUED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

const SERVICES = [
  { title: "Issue Driving License", titleAr: "استخراج رخصة قيادة", href: "/services/issue-driving-license", icon: CreditCard, description: "Apply for a new driving license" },
  { title: "Renew License", titleAr: "تجديد الرخصة", href: "/services", icon: Shield, description: "Renew your existing license" },
  { title: "Vehicle Registration", titleAr: "تسجيل مركبة", href: "/services", icon: FileText, description: "Register or renew vehicle" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: notifications } = useListNotifications({ query: { queryKey: getListNotificationsQueryKey() } });

  const unread = notifications?.filter((n: any) => !n.isRead) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const firstName = user?.profile?.firstName ?? user?.email?.split("@")[0] ?? "Citizen";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, {firstName}</h1>
            <p className="text-muted-foreground text-sm mt-1" dir="rtl">أهلاً وسهلاً بك في منصة رخصتي</p>
          </div>
          {unread.length > 0 && (
            <Link href="/notifications">
              <Button variant="outline" size="sm" className="gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                {unread.length} unread notification{unread.length !== 1 ? "s" : ""}
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Profile Completion */}
      {(summary?.profileCompletionPercent ?? 0) < 100 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Profile Completion</span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{summary?.profileCompletionPercent}%</span>
              </div>
              <Progress value={summary?.profileCompletionPercent ?? 0} className="h-2 bg-amber-100 dark:bg-amber-900/40" />
              <Link href="/profile">
                <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-amber-700 dark:text-amber-400">
                  Complete your profile <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Applications", value: summary?.totalApplications ?? 0, icon: FileText, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Appointments", value: summary?.upcomingAppointments ?? 0, icon: Calendar, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30" },
          { label: "Notifications", value: summary?.unreadNotifications ?? 0, icon: Bell, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "License", value: summary?.myLicense ? "Active" : "None", icon: CreditCard, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30" },
        ].map((stat, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Active Application */}
      {summary?.activeApplication && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Active Application
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm font-medium">{(summary.activeApplication as any).applicationNumber}</p>
                  <Badge className={`mt-1 text-xs ${STATUS_COLORS[(summary.activeApplication as any).status] ?? ""}`}>
                    {(summary.activeApplication as any).status?.replace(/_/g, " ")}
                  </Badge>
                </div>
                <Link href={`/applications/${(summary.activeApplication as any).id}`}>
                  <Button size="sm" variant="outline" className="gap-1">
                    View <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Services */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-lg font-semibold mb-4">Available Services</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {SERVICES.map((svc, i) => (
            <Link key={i} href={svc.href}>
              <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <svc.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm">{svc.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5" dir="rtl">{svc.titleAr}</p>
                  <p className="text-xs text-muted-foreground mt-2">{svc.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
