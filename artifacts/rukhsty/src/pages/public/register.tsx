import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Shield, ChevronRight, ChevronLeft } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

const GOVERNORATES = ["Amman","Irbid","Zarqa","Balqa","Madaba","Karak","Tafileh","Ma'an","Aqaba","Jerash","Ajloun","Mafraq"];

const step1Schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "Required"),
  secondName: z.string().min(1, "Required"),
  thirdName: z.string().min(1, "Required"),
  familyName: z.string().min(1, "Required"),
  age: z.string().refine((v) => Number(v) >= 18 && Number(v) <= 100, "Must be 18+"),
  nationalId: z.string().min(10, "National ID must be 10 digits"),
  phone: z.string().min(10, "Phone required"),
});

const step2Schema = z.object({
  governorate: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  area: z.string().optional(),
  address: z.string().min(5, "Address required"),
});

const step3Schema = z.object({
  personalPhotoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  idFrontUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  idBackUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);
type FormValues = z.infer<typeof fullSchema>;

const STEPS = ["Personal Info", "Location", "Documents"];

export default function Register() {
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<FormValues>({
    resolver: zodResolver(fullSchema),
    defaultValues: { email: "", password: "", firstName: "", secondName: "", thirdName: "", familyName: "", age: "18", nationalId: "", phone: "", governorate: "", city: "", area: "", address: "", personalPhotoUrl: "", idFrontUrl: "", idBackUrl: "" },
  });

  const validateCurrentStep = async () => {
    const fields: (keyof FormValues)[][] = [
      ["email","password","firstName","secondName","thirdName","familyName","age","nationalId","phone"],
      ["governorate","city","address"],
      [],
    ];
    const result = await form.trigger(fields[step]);
    return result;
  };

  const handleNext = async () => {
    const valid = await validateCurrentStep();
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await registerMutation.mutateAsync({ data: { ...values, age: Number(values.age) } as any });
      login((response as any).token, (response as any).user);
      toast({ title: "Account created!", description: "Welcome to Rukhsty. Let's get started." });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration failed", description: err.message || "Please try again." });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
        <Link href="/" className="flex items-center justify-center gap-2 text-primary mb-4">
          <Shield className="w-8 h-8" />
          <span className="font-bold text-2xl tracking-tight">Rukhsty | رخصتي</span>
        </Link>
        <h2 className="text-center text-2xl font-bold text-foreground">Create your account</h2>
        <div className="mt-4 px-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            {STEPS.map((s, i) => (
              <span key={s} className={i === step ? "text-primary font-medium" : ""}>{s}</span>
            ))}
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-xl border border-border">
          <CardHeader>
            <CardTitle>Step {step + 1}: {STEPS[step]}</CardTitle>
            <CardDescription>Fill in all required fields to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {step === 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {(["firstName","secondName","thirdName","familyName"] as const).map((f) => (
                            <FormField key={f} control={form.control} name={f} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs capitalize">{f.replace(/([A-Z])/g, " $1").trim()}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="age" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Age</FormLabel>
                              <FormControl><Input type="number" min="18" max="100" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="nationalId" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">National ID</FormLabel>
                              <FormControl><Input maxLength={10} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl><Input type="tel" placeholder="+962-7-XXXX-XXXX" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input type="email" placeholder="name@example.com" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="password" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl><Input type="password" placeholder="Min 8 characters" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </>
                    )}

                    {step === 1 && (
                      <>
                        <FormField control={form.control} name="governorate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Governorate</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select governorate" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {GOVERNORATES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="city" render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl><Input placeholder="City" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="area" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area / District</FormLabel>
                            <FormControl><Input placeholder="Area" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="address" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Address</FormLabel>
                            <FormControl><Input placeholder="Street, Building, etc." {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <p className="text-sm text-muted-foreground">Provide image URLs for your documents (optional at registration, required for application)</p>
                        {(["personalPhotoUrl","idFrontUrl","idBackUrl"] as const).map((f) => (
                          <FormField key={f} control={form.control} name={f} render={({ field }) => (
                            <FormItem>
                              <FormLabel>{f === "personalPhotoUrl" ? "Personal Photo URL" : f === "idFrontUrl" ? "ID Front URL" : "ID Back URL"}</FormLabel>
                              <FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        ))}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="flex gap-3 pt-2">
                  {step > 0 && (
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                  )}
                  {step < STEPS.length - 1 ? (
                    <Button type="button" className="flex-1" onClick={handleNext}>
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button type="submit" className="flex-1" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  )}
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
