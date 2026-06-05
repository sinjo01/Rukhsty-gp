import { useGetAdminStats, getGetAdminStatsQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FileText, Users, Building2, CreditCard, TrendingUp, Award, XCircle } from "lucide-react";

const PIE_COLORS = ["#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ec4899","#ef4444","#64748b","#06b6d4"];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const { data: activity } = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey() } });

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      <div className="grid md:grid-cols-2 gap-4"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
    </div>
  );

  const s = stats as any;

  const statCards = [
    { label: "Total Applications", value: s?.totalApplications ?? 0, icon: FileText, gradient: "from-sky-500 to-blue-600" },
    { label: "Pending Review", value: s?.pendingReview ?? 0, icon: TrendingUp, gradient: "from-amber-500 to-orange-600" },
    { label: "Citizens", value: s?.totalCitizens ?? 0, icon: Users, gradient: "from-violet-500 to-purple-600" },
    { label: "Centers", value: s?.totalCenters ?? 0, icon: Building2, gradient: "from-emerald-500 to-teal-600" },
    { label: "Licenses Issued", value: s?.licensesIssued ?? 0, icon: CreditCard, gradient: "from-teal-500 to-emerald-600" },
    { label: "Exams Passed", value: s?.passedExamsCount ?? 0, icon: Award, gradient: "from-green-500 to-emerald-600" },
    { label: "Exams Failed", value: s?.failedExamsCount ?? 0, icon: XCircle, gradient: "from-rose-500 to-red-600" },
  ];

  const statusData = (s?.applicationsByStatus ?? []).map((item: any) => ({ name: item.status?.replace(/_/g, " "), value: item.count }));
  const govData = (s?.applicationsByGovernorate ?? []).map((item: any) => ({ name: item.governorate, value: item.count }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform overview and analytics</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.slice(0, 4).map((stat, i) => (
          <Card key={i} className="rounded-2xl border-border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-5">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.slice(4).map((stat, i) => (
          <Card key={i} className="rounded-2xl border-border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-2 shadow-md`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid md:grid-cols-2 gap-6">
        {statusData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Applications by Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                    {statusData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {govData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Applications by Governorate</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={govData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
