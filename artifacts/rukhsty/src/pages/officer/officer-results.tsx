import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRecordMedicalTest, useRecordExam } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Stethoscope, BookOpen } from "lucide-react";

export default function OfficerResults() {
  const { user } = useAuth();
  const { toast } = useToast();
  const role = user?.role ?? "";
  const isMedical = role === "MEDICAL_CENTER_OFFICER";
  const isTheory = role === "THEORY_EXAM_OFFICER";
  const isPractical = role === "PRACTICAL_EXAM_OFFICER";

  const medicalForm = useForm({ defaultValues: { applicationId: "", result: "", leftEyeScore: "", rightEyeScore: "", notes: "" } });
  const examForm = useForm({ defaultValues: { applicationId: "", examType: isTheory ? "THEORY" : "PRACTICAL", score: "", maxScore: "100", result: "", notes: "" } });

  const recordMedical = useRecordMedicalTest();
  const recordExam = useRecordExam();

  const handleMedical = async (values: any) => {
    try {
      await recordMedical.mutateAsync({ data: { applicationId: values.applicationId, result: values.result, leftEyeScore: values.leftEyeScore, rightEyeScore: values.rightEyeScore, notes: values.notes, requiresGlasses: values.result === "PASS_WITH_GLASSES", isAllowedToDrive: values.result !== "FAILED_NOT_ALLOWED" } as any });
      toast({ title: "Medical test recorded successfully" });
      medicalForm.reset();
    } catch {
      toast({ variant: "destructive", title: "Failed to record test" });
    }
  };

  const handleExam = async (values: any) => {
    try {
      await recordExam.mutateAsync({ data: { applicationId: values.applicationId, examType: values.examType as any, score: Number(values.score), maxScore: Number(values.maxScore), result: values.result as any, notes: values.notes } as any });
      toast({ title: "Exam result recorded" });
      examForm.reset();
    } catch {
      toast({ variant: "destructive", title: "Failed to record exam" });
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Record Results</h1>
        <p className="text-muted-foreground text-sm mt-1">Enter application ID and record the outcome</p>
      </motion.div>

      {isMedical && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Stethoscope className="w-4 h-4 text-purple-500" />Medical Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...medicalForm}>
              <form onSubmit={medicalForm.handleSubmit(handleMedical)} className="space-y-4">
                <FormField control={medicalForm.control} name="applicationId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application ID</FormLabel>
                    <FormControl><Input placeholder="Application UUID" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={medicalForm.control} name="result" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="PASS_NO_GLASSES">Pass - No Glasses</SelectItem>
                        <SelectItem value="PASS_WITH_GLASSES">Pass - With Glasses</SelectItem>
                        <SelectItem value="FAILED_NOT_ALLOWED">Failed - Not Allowed</SelectItem>
                        <SelectItem value="NEEDS_RECHECK">Needs Recheck</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={medicalForm.control} name="leftEyeScore" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Left Eye Score</FormLabel>
                      <FormControl><Input placeholder="e.g. 6/6" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={medicalForm.control} name="rightEyeScore" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Right Eye Score</FormLabel>
                      <FormControl><Input placeholder="e.g. 6/9" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <FormField control={medicalForm.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Input placeholder="Optional notes" {...field} /></FormControl>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={recordMedical.isPending}>
                  {recordMedical.isPending ? "Recording..." : "Record Medical Test"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {(isTheory || isPractical) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" />{isTheory ? "Theory" : "Practical"} Exam Result</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...examForm}>
              <form onSubmit={examForm.handleSubmit(handleExam)} className="space-y-4">
                <FormField control={examForm.control} name="applicationId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application ID</FormLabel>
                    <FormControl><Input placeholder="Application UUID" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={examForm.control} name="score" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Score</FormLabel>
                      <FormControl><Input type="number" placeholder="0-100" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={examForm.control} name="maxScore" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Max Score</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <FormField control={examForm.control} name="result" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="PASSED">Passed</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                        <SelectItem value="ABSENT">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={examForm.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Input placeholder="Optional notes" {...field} /></FormControl>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={recordExam.isPending}>
                  {recordExam.isPending ? "Recording..." : `Record ${isTheory ? "Theory" : "Practical"} Result`}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {!isMedical && !isTheory && !isPractical && (
        <div className="text-center py-16 text-muted-foreground">
          <p>Result recording is not available for your role type.</p>
        </div>
      )}
    </div>
  );
}
