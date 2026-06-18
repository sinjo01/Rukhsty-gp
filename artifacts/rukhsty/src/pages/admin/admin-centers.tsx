import { useState } from "react";
import { useListAdminCenters, getListAdminCentersQueryKey, useCreateAdminCenter } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Building2, Plus, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedGovernorate, localizedLabel } from "@/lib/locale-labels";

const GOVERNORATES = ["Amman","Irbid","Zarqa","Balqa","Madaba","Karak","Tafileh","Ma'an","Aqaba","Jerash","Ajloun","Mafraq"];
const CENTER_TYPES = ["TRAINING","MEDICAL","THEORY_EXAM","PRACTICAL_EXAM","DVLD"];
const TYPE_COLORS: Record<string, string> = {
  TRAINING: "bg-blue-100 text-blue-700",
  MEDICAL: "bg-green-100 text-green-700",
  THEORY_EXAM: "bg-purple-100 text-purple-700",
  PRACTICAL_EXAM: "bg-amber-100 text-amber-700",
  DVLD: "bg-rose-100 text-rose-700",
};

export default function AdminCenters() {
  const { language, isRTL, pick } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: centers, isLoading } = useListAdminCenters({ query: { queryKey: getListAdminCentersQueryKey() } });
  const createMutation = useCreateAdminCenter();
  const form = useForm({ defaultValues: { centerType: "", nameAr: "", nameEn: "", governorate: "", city: "", address: "", phone: "" } });

  const onSubmit = async (values: any) => {
    try {
      await createMutation.mutateAsync({ data: values });
      queryClient.invalidateQueries({ queryKey: getListAdminCentersQueryKey() });
      toast({ title: pick("Center created", "تم إنشاء المركز") });
      setDialogOpen(false);
      form.reset();
    } catch {
      toast({ variant: "destructive", title: pick("Failed to create center", "فشل إنشاء المركز") });
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pick("Centers", "المراكز")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{pick("Manage training, medical, and exam centers", "إدارة مراكز التدريب والمراكز الطبية ومراكز الامتحانات")}</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)} data-testid="btn-add-center">
          <Plus className="w-4 h-4" /> {pick("Add Center", "إضافة مركز")}
        </Button>
      </motion.div>

      {isLoading && <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-20" />)}</div>}

      <div className="grid md:grid-cols-2 gap-3">
        {(centers as any[])?.map((center: any, i: number) => (
          <motion.div key={center.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{language === "ar" ? center.nameAr : center.nameEn}</p>
                      <Badge className={`text-xs ${TYPE_COLORS[center.centerType] ?? "bg-slate-100 text-slate-700"}`}>{localizedLabel(center.centerType, language)}</Badge>
                      {!center.isActive && <Badge className="text-xs bg-red-100 text-red-700">{pick("Inactive", "غير نشط")}</Badge>}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {localizedGovernorate(center.governorate, language)}{center.city ? `, ${center.city}` : ""}{center.address ? ` · ${center.address}` : ""}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{pick("Add New Center", "إضافة مركز جديد")}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="centerType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{pick("Center Type", "نوع المركز")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder={pick("Select type", "اختر النوع")} /></SelectTrigger></FormControl>
                    <SelectContent>{CENTER_TYPES.map((t) => <SelectItem key={t} value={t}>{localizedLabel(t, language)}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="nameAr" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">{pick("Arabic name", "الاسم بالعربية")}</FormLabel><FormControl><Input dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="nameEn" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">{pick("English name", "الاسم بالإنجليزية")}</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="governorate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{pick("Governorate", "المحافظة")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder={pick("Select", "اختر")} /></SelectTrigger></FormControl>
                    <SelectContent>{GOVERNORATES.map((g) => <SelectItem key={g} value={g}>{localizedGovernorate(g, language)}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">{pick("City", "المدينة")}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">{pick("Phone", "الهاتف")}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>{pick("Address", "العنوان")}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>{pick("Cancel", "إلغاء")}</Button>
                <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                  {createMutation.isPending ? pick("Creating...", "جارٍ الإنشاء...") : pick("Create Center", "إنشاء المركز")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
