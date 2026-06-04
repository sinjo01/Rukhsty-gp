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
  SECURITY_REVIEW: "bg-blue-100 text-blue-700",
  SECURITY_APPROVED: "bg-emerald-100 text-emerald-700",
  SECURITY_REJECTED: "bg-red-100 text-red-700",
  MEDICAL_BOOKING: "bg-purple-100 text-purple-700",
  MEDICAL_APPOINTMENT_BOOKED: "bg-purple-100 text-purple-700",
  THEORY_BOOKING: "bg-blue-100 text-blue-700",
  THEORY_APPOINTMENT_BOOKED: "bg-blue-100 text-blue-700",
  PRACTICAL_BOOKING: "bg-amber-100 text-amber-700",
  PRACTICAL_APPOINTMENT_BOOKED: "bg-amber-100 text-amber-700",
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
  const [issueDialog, setIssueDialog] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
  const [rejectionReason, setRejectionReason] = useState("");

  const { data, isLoading } = useListAdminApplications(
    { status: statusFilter || undefined } as any,
    { query: { queryKey: getListAdminApplicationsQueryKey({ status: statusFilter || undefined } as any) } }
  );
  const reviewMutation = useAdminReviewApplication();

  const handleReview = async () => {
    try {
      const endpoint = reviewDialog.action === "APPROVE" ? "approve" : "reject";
      const response = await fetch(`/api/admin/applications/${reviewDialog.id}/security/${endpoint}`, {
        method: "POST",
        headers: { authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ rejectionReason }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? `HTTP ${response.status}`);
      }
      queryClient.invalidateQueries({ queryKey: getListAdminApplicationsQueryKey({} as any) });
      toast({ title: `Security review ${reviewDialog.action === "APPROVE" ? "approved" : "rejected"}` });
      setReviewDialog({ open: false, id: "", action: "APPROVE" });
      setRejectionReason("");
    } catch (error) {
      toast({ variant: "destructive", title: "Action failed", description: error instanceof Error ? error.message : undefined });
    }
  };

  const handleIssueLicense = async () => {
    try {
      const response = await fetch(`/api/admin/applications/${issueDialog.id}/issue-license`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`,
          accept: "application/json",
        },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? `HTTP ${response.status}`);
      }
      queryClient.invalidateQueries({ queryKey: getListAdminApplicationsQueryKey({} as any) });
      toast({ title: "License issued", description: "The citizen can now view their digital license." });
      setIssueDialog({ open: false, id: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "License issuance failed", description: error instanceof Error ? error.message : "Please try again." });
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
            {["SECURITY_REVIEW","SECURITY_APPROVED","MEDICAL_BOOKING","MEDICAL_APPOINTMENT_BOOKED","MEDICAL_PASSED","THEORY_BOOKING","THEORY_APPOINTMENT_BOOKED","THEORY_PASSED","PRACTICAL_BOOKING","PRACTICAL_APPOINTMENT_BOOKED","PRACTICAL_PASSED","LICENSE_ISSUANCE","LICENSE_ISSUED","SECURITY_REJECTED","REJECTED"].map((s) => (
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
                      <p className="text-sm font-medium">{[app.profile?.firstName, app.profile?.secondName, app.profile?.thirdName, app.profile?.familyName].filter(Boolean).join(" ") || app.user?.email || "Citizen"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-xs ${STATUS_COLORS[app.status] ?? "bg-slate-100 text-slate-700"}`}>{app.status?.replace(/_/g, " ")}</Badge>
                        {app.profile?.nationalId && <span className="text-xs text-muted-foreground font-mono">{app.profile.nationalId}</span>}
                        {app.licenseCategory?.code && <span className="text-xs text-muted-foreground">{app.licenseCategory.code}</span>}
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  {app.status === "SECURITY_REVIEW" && (
                    <div className="flex gap-2">
                      <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700 gap-1" onClick={() => setReviewDialog({ open: true, id: app.id, action: "APPROVE" })} data-testid={`btn-approve-${app.id}`}>
                        <CheckCircle className="w-3 h-3" />Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50 gap-1" onClick={() => setReviewDialog({ open: true, id: app.id, action: "REJECT" })}>
                        <XCircle className="w-3 h-3" />Reject
                      </Button>
                    </div>
                  )}
                  {(app.status === "PRACTICAL_PASSED" || app.currentStep === "LICENSE_ISSUANCE") && (
                    <Button size="sm" className="text-xs h-7 bg-emerald-700 hover:bg-emerald-800" onClick={() => setIssueDialog({ open: true, id: app.id })}>
                      Issue License
                    </Button>
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

      <Dialog open={issueDialog.open} onOpenChange={(open) => setIssueDialog((d) => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue Digital License</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Confirm that this application is ready for DVLD license issuance. This creates the citizen's official digital license record.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialog({ open: false, id: "" })}>Cancel</Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={handleIssueLicense}>Issue License</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
