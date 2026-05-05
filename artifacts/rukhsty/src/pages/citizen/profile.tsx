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
      toast({ title: "Profile updated successfully" });
    } catch {
      toast({ variant: "destructive", title: "Failed to update profile" });
    }
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;

  const isComplete = profile?.profileStatus === "COMPLETE";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your personal information and documents</p>
          </div>
          <Badge className={isComplete ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}>
            {isComplete ? <><CheckCircle className="w-3 h-3 mr-1" />Complete</> : <><AlertCircle className="w-3 h-3 mr-1" />Incomplete</>}
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
              <p className="text-muted-foreground text-sm">National ID: {profile?.nationalId}</p>
              <p className="text-muted-foreground text-sm">{profile?.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {(["firstName","secondName","thirdName","familyName"] as const).map((f) => (
                  <FormField key={f} control={form.control} name={f} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="capitalize text-xs">{f.replace(/([A-Z])/g, " $1").trim()}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="age" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Age</FormLabel>
                    <FormControl><Input type="number" min="18" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="nationalId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">National ID</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input type="tel" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Location</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="governorate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Governorate</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {GOVERNORATES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">City</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="area" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Area</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Address</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Documents</h3>
                <div className="space-y-3">
                  {(["personalPhotoUrl","idFrontUrl","idBackUrl"] as const).map((f) => (
                    <FormField key={f} control={form.control} name={f} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">{f === "personalPhotoUrl" ? "Personal Photo URL" : f === "idFrontUrl" ? "ID Front URL" : "ID Back URL"}</FormLabel>
                        <FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl>
                        {field.value && <img src={field.value} alt="preview" className="w-20 h-14 object-cover rounded border mt-1" onError={(e) => (e.currentTarget.style.display = "none")} />}
                        <FormMessage />
                      </FormItem>
                    )} />
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto">
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
