import { useGetProfile, getGetProfileQueryKey, useUpdateProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedGovernorate } from "@/lib/locale-labels";

const GOVERNORATES = ["Amman","Irbid","Zarqa","Balqa","Madaba","Karak","Tafileh","Ma'an","Aqaba","Jerash","Ajloun","Mafraq"];

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  secondName: z.string().min(1, "Required"),
  thirdName: z.string().min(1, "Required"),
  familyName: z.string().min(1, "Required"),
  age: z.string().refine((v) => Number(v) >= 18, "Must be 18+"),
  nationalId: z.string().min(10, "10 digits required"),
  phone: z.string().optional(),
  governorate: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  address: z.string().optional(),
  personalPhotoUrl: z.string().optional(),
  idFrontUrl: z.string().optional(),
  idBackUrl: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Profile() {
  const { language, isRTL, pick } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: profile, isLoading } = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const updateMutation = useUpdateProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: profile ? {
      firstName: profile.firstName,
      secondName: profile.secondName,
      thirdName: profile.thirdName,
      familyName: profile.familyName,
      age: String(profile.age),
      nationalId: profile.nationalId,
      phone: profile.phone ?? "",
      governorate: profile.governorate ?? "",
      city: profile.city ?? "",
      area: profile.area ?? "",
      address: profile.address ?? "",
      personalPhotoUrl: profile.personalPhotoUrl ?? "",
      idFrontUrl: profile.idFrontUrl ?? "",
      idBackUrl: profile.idBackUrl ?? "",
    } : undefined,
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await updateMutation.mutateAsync({ data: { ...values, age: Number(values.age) } as any });
      queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      toast({ title: pick("Profile updated successfully", "تم تحديث الملف الشخصي بنجاح") });
    } catch {
      toast({ variant: "destructive", title: pick("Failed to update profile", "فشل تحديث الملف الشخصي") });
    }
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;

  const isComplete = profile?.profileStatus === "COMPLETE";

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{pick("My Profile", "ملفي الشخصي")}</h1>
            <p className="text-muted-foreground text-sm mt-1">{pick("Manage your personal information and documents", "إدارة معلوماتك الشخصية ومستنداتك")}</p>
          </div>
          <Badge className={isComplete ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}>
            {isComplete ? <><CheckCircle className="w-3 h-3 me-1" />{pick("Complete", "مكتمل")}</> : <><AlertCircle className="w-3 h-3 me-1" />{pick("Incomplete", "غير مكتمل")}</>}
          </Badge>
        </div>
      </motion.div>

      {/* Avatar */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-2 border-primary/20">
              <AvatarImage src={profile?.personalPhotoUrl ?? ""} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {profile?.firstName?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{profile?.firstName} {profile?.familyName}</p>
              <p className="text-muted-foreground text-sm">{pick("National ID", "الرقم الوطني")}: {profile?.nationalId}</p>
              <p className="text-muted-foreground text-sm">{profile?.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{pick("Personal Information", "المعلومات الشخصية")}</CardTitle>
          <CardDescription>{pick("Update your profile details", "حدّث بيانات ملفك الشخصي")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {(["firstName","secondName","thirdName","familyName"] as const).map((f) => (
                  <FormField key={f} control={form.control} name={f} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{({
                        firstName: pick("First name", "الاسم الأول"),
                        secondName: pick("Second name", "الاسم الثاني"),
                        thirdName: pick("Third name", "الاسم الثالث"),
                        familyName: pick("Family name", "اسم العائلة"),
                      } as const)[f]}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="age" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{pick("Age", "العمر")}</FormLabel>
                    <FormControl><Input type="number" min="18" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="nationalId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{pick("National ID", "الرقم الوطني")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{pick("Phone", "رقم الهاتف")}</FormLabel>
                  <FormControl><Input type="tel" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">{pick("Location", "العنوان")}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="governorate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{pick("Governorate", "المحافظة")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder={pick("Select", "اختر")} /></SelectTrigger></FormControl>
                        <SelectContent>
                          {GOVERNORATES.map((g) => <SelectItem key={g} value={g}>{localizedGovernorate(g, language)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{pick("City", "المدينة")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="area" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{pick("Area", "المنطقة")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{pick("Address", "العنوان")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">{pick("Documents", "المستندات")}</h3>
                <div className="space-y-3">
                  <FormField control={form.control} name="personalPhotoUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{pick("Personal Photo URL", "رابط الصورة الشخصية")}</FormLabel>
                      <FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl>
                      {field.value && <img src={field.value} alt="preview" className="w-20 h-14 object-cover rounded border mt-1" onError={(e) => (e.currentTarget.style.display = "none")} />}
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto">
                {updateMutation.isPending ? pick("Saving...", "جارٍ الحفظ...") : pick("Save Changes", "حفظ التغييرات")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
