import { useGetApplication, getGetApplicationQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Circle, Clock, XCircle, Minus, Building2, Calendar, FileText, Activity, Stethoscope } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PROFILE_SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  TRAINING_CENTER_SELECTED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  TRAINING_COMPLETED: "bg-green-100 text-green-700",
  MEDICAL_PASSED: "bg-green-100 text-green-700",
  MEDICAL_FAILED: "bg-red-100 text-red-700",
  THEORY_PASSED: "bg-green-100 text-green-700",
  THEORY_FAILED: "bg-red-100 text-red-700",
  PRACTICAL_PASSED: "bg-green-100 text-green-700",
  PRACTICAL_FAILED: "bg-red-100 text-red-700",
  LICENSE_ISSUED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

function StepIcon({ status }: { status: string }) {
  if (status === "COMPLETED") return <CheckCircle className="w-5 h-5 text-green-500" />;
  if (status === "ACTIVE") return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
  if (status === "FAILED") return <XCircle className="w-5 h-5 text-red-500" />;
  if (status === "SKIPPED") return <Minus className="w-5 h-5 text-slate-400" />;
  return <Circle className="w-5 h-5 text-slate-300" />;
}

export default function ApplicationDetail({ params }: { params: { id: string } }) {
  const { data: app, isLoading } = useGetApplication(params.id, {
    query: { queryKey: getGetApplicationQueryKey(params.id), enabled: !!params.id },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!app) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground">Application not found</p>
      <Link href="/applications"><Button variant="link">Back to Applications</Button></Link>
    </div>
  );

  const detail = app as any;
  const steps = detail.steps ?? [];
  const appointments = detail.appointments ?? [];
  const exams = detail.exams ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Link href="/applications">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold font-mono">{detail.applicationNumber}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`text-xs ${STATUS_COLORS[detail.status] ?? "bg-slate-100 text-slate-700"}`}>
              {detail.status?.replace(/_/g, " ")}
            </Badge>
            <span className="text-xs text-muted-foreground">{detail.service?.nameEn ?? "Driving License"}</span>
          </div>
        </div>
      </motion.div>

      {/* Step Tracker */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Application Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-0">
              {steps.sort((a: any, b: any) => a.orderNumber - b.orderNumber).map((step: any, i: number) => (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <StepIcon status={step.status} />
                    {i < steps.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 ${step.status === "COMPLETED" ? "bg-green-300" : "bg-border"}`} />
                    )}
                  </div>
                  <div className={`pb-6 ${i === steps.length - 1 ? "pb-0" : ""}`}>
                    <p className={`text-sm font-medium ${step.status === "ACTIVE" ? "text-blue-600 dark:text-blue-400" : step.status === "COMPLETED" ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.stepNameEn}
                    </p>
                    <p className="text-xs text-muted-foreground" dir="rtl">{step.stepNameAr}</p>
                    <Badge variant="outline" className={`mt-1 text-xs ${step.status === "ACTIVE" ? "border-blue-300 text-blue-600" : step.status === "COMPLETED" ? "border-green-300 text-green-600" : step.status === "FAILED" ? "border-red-300 text-red-600" : ""}`}>
                      {step.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Training Record */}
      {detail.trainingRecord && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-amber-500" />Training</CardTitle>
            </CardHeader>
            <CardContent>
              {detail.trainingRecord.center && (
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{detail.trainingRecord.center.nameEn}</span>
                  <span className="text-muted-foreground">· {detail.trainingRecord.center.governorate}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Theory Lessons</p>
                  <p className="font-semibold">{detail.trainingRecord.theoreticalLessonsCompleted} / {detail.trainingRecord.theoreticalLessonsRequired}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Practical Lessons</p>
                  <p className="font-semibold">{detail.trainingRecord.practicalLessonsCompleted} / {detail.trainingRecord.practicalLessonsRequired}</p>
                </div>
              </div>
              <Badge className={`mt-3 text-xs ${detail.trainingRecord.status === "COMPLETED" ? "bg-green-100 text-green-700" : detail.trainingRecord.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                {detail.trainingRecord.status?.replace(/_/g, " ")}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Medical Test */}
      {detail.medicalTest && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Stethoscope className="w-4 h-4 text-purple-500" />Medical Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Result</p><Badge className={`mt-1 text-xs ${detail.medicalTest.result?.includes("PASS") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{detail.medicalTest.result?.replace(/_/g, " ")}</Badge></div>
                <div><p className="text-xs text-muted-foreground">Left Eye</p><p className="font-medium">{detail.medicalTest.leftEyeScore ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Right Eye</p><p className="font-medium">{detail.medicalTest.rightEyeScore ?? "—"}</p></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Exams */}
      {exams.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Exams</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exams.map((exam: any) => (
                  <div key={exam.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{exam.examType} Exam — Attempt #{exam.attemptNumber}</p>
                      {exam.score && <p className="text-xs text-muted-foreground">Score: {exam.score} / {exam.maxScore}</p>}
                    </div>
                    <Badge className={`text-xs ${exam.result === "PASSED" ? "bg-green-100 text-green-700" : exam.result === "FAILED" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                      {exam.result}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Appointments */}
      {appointments.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" />Appointments</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appointments.map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{apt.appointmentType?.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">{apt.appointmentDate} · {apt.startTime} – {apt.endTime}</p>
                      {apt.center && <p className="text-xs text-muted-foreground">{apt.center.nameEn}</p>}
                      {apt.queueNumber && <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">Queue #{apt.queueNumber}</p>}
                    </div>
                    <Badge className={`text-xs ${apt.status === "BOOKED" ? "bg-blue-100 text-blue-700" : apt.status === "COMPLETED" ? "bg-green-100 text-green-700" : apt.status === "CANCELLED" ? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-700"}`}>
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Documents */}
      {detail.documents?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" />Documents</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {detail.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{doc.documentType?.replace(/_/g, " ")}</p>
                    <Badge className={`text-xs ${doc.verificationStatus === "APPROVED" ? "bg-green-100 text-green-700" : doc.verificationStatus === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {doc.verificationStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
