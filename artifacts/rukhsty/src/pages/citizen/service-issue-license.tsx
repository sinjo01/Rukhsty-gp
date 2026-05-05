import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListLicenseCategories, getListLicenseCategoriesQueryKey,
  useListCenters, getListCentersQueryKey,
  useCreateApplication, useSelectTrainingCenter
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, CheckCircle, Building2, MapPin } from "lucide-react";

const GOVERNORATES = ["Amman","Irbid","Zarqa","Balqa","Madaba","Karak","Tafileh","Ma'an","Aqaba","Jerash","Ajloun","Mafraq"];
const STEPS = ["Choose Category","Confirm Info","Select Training Center"];

export default function ServiceIssueLicense() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedGovernorate, setSelectedGovernorate] = useState(user?.profile?.governorate ?? "");
  const [selectedCenterId, setSelectedCenterId] = useState<string>("");
  const [applicationId, setApplicationId] = useState<string>("");

  const { data: categories, isLoading: catsLoading } = useListLicenseCategories({ query: { queryKey: getListLicenseCategoriesQueryKey() } });
  const { data: centers, isLoading: centersLoading } = useListCenters(
    { centerType: "TRAINING", governorate: selectedGovernorate || undefined },
    { query: { queryKey: getListCentersQueryKey({ centerType: "TRAINING", governorate: selectedGovernorate || undefined }), enabled: step === 2 } }
  );
  const createApp = useCreateApplication();
  const selectCenter = useSelectTrainingCenter();

  const handleNext = async () => {
    if (step === 1) {
      // Create the application
      if (!selectedCategoryId) { toast({ variant: "destructive", title: "Please select a license category" }); return; }
      try {
        const app = await createApp.mutateAsync({ data: { licenseCategoryId: selectedCategoryId, governorate: selectedGovernorate || user?.profile?.governorate, residenceArea: user?.profile?.area } as any });
        setApplicationId((app as any).id);
        setStep(2);
      } catch {
        toast({ variant: "destructive", title: "Failed to create application" });
      }
      return;
    }
    if (step === 2) {
      if (!selectedCenterId) { toast({ variant: "destructive", title: "Please select a training center" }); return; }
      try {
        await selectCenter.mutateAsync({ id: applicationId, data: { centerId: selectedCenterId } });
        toast({ title: "Training center selected!", description: "Your application has been submitted." });
        setLocation(`/applications/${applicationId}`);
      } catch {
        toast({ variant: "destructive", title: "Failed to select center" });
      }
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Issue Driving License</h1>
        <p className="text-muted-foreground text-sm mt-1">استخراج رخصة قيادة جديدة</p>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            {STEPS.map((s, i) => <span key={s} className={i === step ? "text-primary font-medium" : ""}>{s}</span>)}
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          {step === 0 && (
            <Card>
              <CardHeader><CardTitle>Choose License Category</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {catsLoading ? <Skeleton className="h-40" /> : (
                  <div className="grid gap-3">
                    {categories?.map((cat: any) => (
                      <div
                        key={cat.id}
                        data-testid={`category-${cat.code}`}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedCategoryId === cat.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{cat.nameEn}</p>
                            <p className="text-xs text-muted-foreground mt-0.5" dir="rtl">{cat.nameAr}</p>
                            <p className="text-xs text-muted-foreground mt-1">Min age: {cat.minimumAge} years</p>
                          </div>
                          {selectedCategoryId === cat.id && <CheckCircle className="w-5 h-5 text-primary" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardHeader><CardTitle>Confirm Your Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  {[
                    ["Full Name", `${user?.profile?.firstName ?? ""} ${user?.profile?.familyName ?? ""}`],
                    ["National ID", user?.profile?.nationalId ?? "—"],
                    ["Phone", user?.profile?.phone ?? "—"],
                    ["Age", user?.profile?.age?.toString() ?? "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Governorate</label>
                  <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                    <SelectTrigger><SelectValue placeholder="Select governorate" /></SelectTrigger>
                    <SelectContent>{GOVERNORATES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader><CardTitle>Select Training Center</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 items-center">
                  <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Filter by governorate" /></SelectTrigger>
                    <SelectContent>{GOVERNORATES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {centersLoading ? <Skeleton className="h-48" /> : (
                  <div className="space-y-3">
                    {!centers?.length && <p className="text-sm text-muted-foreground text-center py-6">No training centers found in {selectedGovernorate || "selected area"}.</p>}
                    {centers?.map((center: any) => (
                      <div
                        key={center.id}
                        data-testid={`center-${center.id}`}
                        onClick={() => setSelectedCenterId(center.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedCenterId === center.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{center.nameEn}</p>
                              <p className="text-xs text-muted-foreground" dir="rtl">{center.nameAr}</p>
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {center.governorate}{center.city ? `, ${center.city}` : ""}
                              </div>
                              {center.phone && <p className="text-xs text-muted-foreground mt-0.5">{center.phone}</p>}
                            </div>
                          </div>
                          {selectedCenterId === center.id && <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3">
        {step > 0 && step < 2 && (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={createApp.isPending || selectCenter.isPending}
          className="flex-1"
          data-testid="btn-next"
        >
          {step < STEPS.length - 1 && step < 1 && <>Next <ChevronRight className="w-4 h-4 ml-1" /></>}
          {step === 1 && (createApp.isPending ? "Creating..." : <>Submit & Continue <ChevronRight className="w-4 h-4 ml-1" /></>)}
          {step === 2 && (selectCenter.isPending ? "Submitting..." : <><CheckCircle className="w-4 h-4 mr-1" />Confirm Selection</>)}
        </Button>
      </div>
    </div>
  );
}
