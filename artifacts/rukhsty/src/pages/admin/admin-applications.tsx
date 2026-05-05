import { useState } from "react";
import { useListAdminApplications, getListAdminApplicationsQueryKey, useAdminReviewApplication } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PROFILE_SUBMITTED: "bg-blue-100 text-blue-700",
  TRAINING_CENTER_SELECTED: "bg-amber-100 text-amber-700",
  TRAINING_COMPLETED: "bg-green-100 text-green-700",
  LICENSE_ISSUED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function AdminApplications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; id: string; action: "APPROVE" | "REJECT" }>({ open: false, id: "", action: "APPROVE" });
  const [rejectionReason, setRejectionReason] = useState("");

  const { data, isLoading } = useListAdminApplications(
    { status: statusFilter || undefined } as any,
    { query: { queryKey: getListAdminApplicationsQueryKey({ status: statusFilter || undefined } as any) } }
  );
  const reviewMutation = useAdminReviewApplication();

  const handleReview = async () => {
    try {
      const status = reviewDialog.action === "APPROVE" ? "APPROVED" : "REJECTED";
      await reviewMutation.mutateAsync({ id: reviewDialog.id, data: { status, rejectionReason: reviewDialog.action === "REJECT" ? rejectionReason : undefined } });
      queryClient.invalidateQueries({ queryKey: getListAdminApplicationsQueryKey({} as any) });
      toast({ title: `Application ${reviewDialog.action === "APPROVE" ? "approved" : "rejected"}` });
      setReviewDialog({ open: false, id: "", action: "APPROVE" });
      setRejectionReason("");
    } catch {
      toast({ variant: "destructive", title: "Action failed" });
    }
  };

  const apps = (data as any)?.data ?? data ?? [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and manage all citizen applications</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {["DRAFT","PROFILE_SUBMITTED","TRAINING_CENTER_SELECTED","TRAINING_COMPLETED","LICENSE_ISSUED","REJECTED"].map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {isLoading && <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-20" />)}</div>}

      <div className="space-y-2">
        {apps.map((app: any, i: number) => (
          <motion.div key={app.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold">{app.applicationNumber}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-xs ${STATUS_COLORS[app.status] ?? "bg-slate-100 text-slate-700"}`}>{app.status?.replace(/_/g, " ")}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  {["PROFILE_SUBMITTED","TRAINING_COMPLETED"].includes(app.status) && (
                    <div className="flex gap-2">
                      <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700 gap-1" onClick={() => setReviewDialog({ open: true, id: app.id, action: "APPROVE" })} data-testid={`btn-approve-${app.id}`}>
                        <CheckCircle className="w-3 h-3" />Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50 gap-1" onClick={() => setReviewDialog({ open: true, id: app.id, action: "REJECT" })}>
                        <XCircle className="w-3 h-3" />Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {!isLoading && apps.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No applications found</div>
        )}
      </div>

      <Dialog open={reviewDialog.open} onOpenChange={(open) => setReviewDialog((d) => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewDialog.action === "APPROVE" ? "Approve Application" : "Reject Application"}</DialogTitle>
          </DialogHeader>
          {reviewDialog.action === "REJECT" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason</label>
              <Input placeholder="Explain the rejection reason..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog((d) => ({ ...d, open: false }))}>Cancel</Button>
            <Button className={reviewDialog.action === "APPROVE" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} onClick={handleReview} disabled={reviewMutation.isPending}>
              {reviewDialog.action === "APPROVE" ? "Confirm Approve" : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
