import { useListApplications, getListApplicationsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { FileText, ArrowRight, Plus, Clock } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PROFILE_SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  TRAINING_CENTER_SELECTED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  TRAINING_BOOKED: "bg-amber-100 text-amber-700",
  TRAINING_IN_PROGRESS: "bg-amber-100 text-amber-700",
  TRAINING_COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  MEDICAL_BOOKED: "bg-purple-100 text-purple-700",
  MEDICAL_PASSED: "bg-green-100 text-green-700",
  MEDICAL_FAILED: "bg-red-100 text-red-700",
  THEORY_BOOKED: "bg-purple-100 text-purple-700",
  THEORY_PASSED: "bg-green-100 text-green-700",
  THEORY_FAILED: "bg-red-100 text-red-700",
  PRACTICAL_BOOKED: "bg-purple-100 text-purple-700",
  PRACTICAL_PASSED: "bg-green-100 text-green-700",
  PRACTICAL_FAILED: "bg-red-100 text-red-700",
  LICENSE_ISSUED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  CANCELLED: "bg-slate-100 text-slate-600",
};

export default function Applications() {
  const { data: applications, isLoading } = useListApplications({ query: { queryKey: getListApplicationsQueryKey() } });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Applications</h1>
          <p className="text-muted-foreground text-sm mt-1">Track all your license applications</p>
        </div>
        <Link href="/services/issue-driving-license">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> New Application
          </Button>
        </Link>
      </motion.div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      )}

      {!isLoading && (!applications || applications.length === 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">No applications yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-6">Start by applying for a new driving license</p>
          <Link href="/services/issue-driving-license">
            <Button>Start New Application</Button>
          </Link>
        </motion.div>
      )}

      <div className="space-y-3">
        {applications?.map((app: any, i: number) => (
          <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:border-primary/30 hover:shadow-sm transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold">{app.applicationNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {app.service?.nameEn ?? "Driving License"} {app.licenseCategory?.code ? `· ${app.licenseCategory.code}` : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`text-xs ${STATUS_COLORS[app.status] ?? "bg-slate-100 text-slate-700"}`}>
                          {app.status?.replace(/_/g, " ")}
                        </Badge>
                        {app.createdAt && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link href={`/applications/${app.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                      View <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
