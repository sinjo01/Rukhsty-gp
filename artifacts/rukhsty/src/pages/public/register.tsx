import { useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  Lock,
  Phone,
  Shield,
  Trash2,
  Upload,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useRegister } from "@workspace/api-client-react";
import { Logo, LogoMark } from "@/components/logo";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GOVERNORATES = ["Amman", "Irbid", "Zarqa", "Balqa", "Madaba", "Karak", "Tafileh", "Ma'an", "Aqaba", "Jerash", "Ajloun", "Mafraq"];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const passwordRules = [
  { key: "passwordMinLength", test: (value: string) => value.length >= 8 },
  { key: "passwordUppercase", test: (value: string) => /[A-Z]/.test(value) },
  { key: "passwordLowercase", test: (value: string) => /[a-z]/.test(value) },
  { key: "passwordNumber", test: (value: string) => /\d/.test(value) },
  { key: "passwordSpecial", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

type RegisterFormValues = {
  firstName: string;
  secondName: string;
  thirdName: string;
  familyName: string;
  nationalId: string;
  email: string;
  confirmEmail: string;
  phone: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "";
  governorate: string;
  city: string;
  address: string;
  password: string;
  confirmPassword: string;
  personalPhotoUrl: string;
};

function calculateAge(dateOfBirth: string) {
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const { isRTL, t, toggleLanguage } = useLanguage();
  const registerMutation = useRegister();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerSchema = useMemo(
    () =>
      z
        .object({
          firstName: z.string().trim().min(1, t("validationRequired")),
          secondName: z.string().trim().min(1, t("validationRequired")),
          thirdName: z.string().trim().min(1, t("validationRequired")),
          familyName: z.string().trim().min(1, t("validationRequired")),
          nationalId: z.string().regex(/^\d{10}$/, t("validationNationalId")),
          email: z.string().email(t("validationEmail")),
          confirmEmail: z.string().email(t("validationEmail")),
          phone: z.string().regex(/^\+?[0-9\s-]{9,20}$/, t("validationPhone")),
          dateOfBirth: z
            .string()
            .min(1, t("validationRequired"))
            .refine((value) => {
              const parsed = new Date(`${value}T00:00:00`);
              return !Number.isNaN(parsed.getTime()) && parsed <= new Date();
            }, t("validationBirthDate")),
          gender: z.enum(["MALE", "FEMALE"], { message: t("validationRequired") }).or(z.literal("")).refine(Boolean, t("validationRequired")),
          governorate: z.string().min(1, t("validationRequired")),
          city: z.string().optional().default(""),
          address: z.string().trim().min(5, t("validationRequired")),
          password: z.string().refine((value) => passwordRules.every((rule) => rule.test(value)), t("validationPasswordStrong")),
          confirmPassword: z.string().min(1, t("validationRequired")),
          personalPhotoUrl: z.string().min(1, t("validationPhotoRequired")),
        })
        .refine((values) => values.email === values.confirmEmail, {
          message: t("validationEmailMatch"),
          path: ["confirmEmail"],
        })
        .refine((values) => values.password === values.confirmPassword, {
          message: t("validationPasswordMatch"),
          path: ["confirmPassword"],
        }),
    [t],
  );

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      secondName: "",
      thirdName: "",
      familyName: "",
      nationalId: "",
      email: "",
      confirmEmail: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      governorate: "",
      city: "",
      address: "",
      password: "",
      confirmPassword: "",
      personalPhotoUrl: "",
    },
  });

  const password = form.watch("password");
  const photoPreview = form.watch("personalPhotoUrl");

  const handlePhotoSelect = async (file: File | undefined) => {
    if (!file) return;

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      form.setError("personalPhotoUrl", { message: t("validationPhotoType") });
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      form.setError("personalPhotoUrl", { message: t("validationPhotoSize") });
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    form.setValue("personalPhotoUrl", dataUrl, { shouldValidate: true, shouldDirty: true });
    form.clearErrors("personalPhotoUrl");
  };

  const removePhoto = () => {
    form.setValue("personalPhotoUrl", "", { shouldValidate: true, shouldDirty: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const fullName = [values.firstName, values.secondName, values.thirdName, values.familyName].map((part) => part.trim()).join(" ");
      const payload = {
        fullName,
        firstName: values.firstName.trim(),
        secondName: values.secondName.trim(),
        thirdName: values.thirdName.trim(),
        familyName: values.familyName.trim(),
        age: calculateAge(values.dateOfBirth),
        nationalId: values.nationalId,
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        dateOfBirth: values.dateOfBirth,
        gender: values.gender as "MALE" | "FEMALE",
        governorate: values.governorate,
        city: values.city.trim(),
        area: values.city.trim(),
        address: values.address.trim(),
        password: values.password,
        personalPhotoUrl: values.personalPhotoUrl,
      };

      await registerMutation.mutateAsync({ data: payload });
      toast({ title: t("registrationSuccessTitle"), description: t("registrationSuccessDescription") });
      setLocation("/login");
    } catch {
      toast({ variant: "destructive", title: t("registrationFailedTitle"), description: t("registrationFailedDescription") });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <header className="h-16 border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <Logo label={t("brandName")} markClassName="h-7 w-7" textClassName="text-xl" />
          </Link>
          <Button variant="outline" size="sm" onClick={toggleLanguage}>
            {t("languageToggle")}
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:py-12">
        <aside className={cn("rounded-2xl bg-primary p-8 text-white shadow-xl lg:sticky lg:top-24 lg:h-fit", isRTL && "lg:order-2")}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <LogoMark tone="onDark" className="h-7 w-7" />
          </div>
          <h1 className="mt-8 text-3xl font-bold leading-tight">{t("createAccountTitle")}</h1>
          <p className="mt-4 leading-relaxed text-white/75">{t("createAccountDescription")}</p>
          <div className="mt-8 rounded-xl border border-white/15 bg-white/10 p-4">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 text-accent" />
              <p className="text-sm leading-relaxed text-white/80">{t("createAccountSecurityNote")}</p>
            </div>
          </div>
        </aside>

        <section className={cn(isRTL && "lg:order-1")}>
          <Card className="border-slate-200 shadow-2xl">
            <CardHeader>
              <CardTitle>{t("register")}</CardTitle>
              <CardDescription>{t("createAccountDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormSection icon={UserRound} title={t("personalInformation")}>
                    <div className="grid gap-4 md:grid-cols-2">
                      {(["firstName", "secondName", "thirdName", "familyName"] as const).map((fieldName) => (
                        <FormField
                          key={fieldName}
                          control={form.control}
                          name={fieldName}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t(fieldName)}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                      <FormField
                        control={form.control}
                        name="nationalId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("nationalId")}</FormLabel>
                            <FormControl>
                              <Input inputMode="numeric" maxLength={10} placeholder="1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("dateOfBirth")}</FormLabel>
                            <FormControl>
                              <Input type="date" max={new Date().toISOString().slice(0, 10)} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("gender")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectGender")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MALE">{t("male")}</SelectItem>
                                <SelectItem value="FEMALE">{t("female")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </FormSection>

                  <FormSection icon={Phone} title={t("contactInformation")}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("email")}</FormLabel>
                          <FormControl><Input type="email" autoComplete="email" placeholder="name@example.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="confirmEmail" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("confirmEmail")}</FormLabel>
                          <FormControl><Input type="email" autoComplete="email" placeholder="name@example.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("phoneNumber")}</FormLabel>
                          <FormControl><Input type="tel" placeholder="+962-7-XXXX-XXXX" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="governorate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("governorate")}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("selectGovernorate")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {GOVERNORATES.map((governorate) => (
                                <SelectItem key={governorate} value={governorate}>{governorate}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("cityDistrict")}</FormLabel>
                          <FormControl><Input placeholder={t("cityDistrictPlaceholder")} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("address")}</FormLabel>
                          <FormControl><Input placeholder={t("addressPlaceholder")} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </FormSection>

                  <FormSection icon={Lock} title={t("securityInformation")}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <PasswordField
                        label={t("password")}
                        show={showPassword}
                        toggleLabel={showPassword ? t("hidePassword") : t("showPassword")}
                        onToggle={() => setShowPassword((value) => !value)}
                        fieldName="password"
                        control={form.control}
                        isRTL={isRTL}
                      />
                      <PasswordField
                        label={t("confirmPassword")}
                        show={showConfirmPassword}
                        toggleLabel={showConfirmPassword ? t("hidePassword") : t("showPassword")}
                        onToggle={() => setShowConfirmPassword((value) => !value)}
                        fieldName="confirmPassword"
                        control={form.control}
                        isRTL={isRTL}
                      />
                    </div>
                    <div className="rounded-xl border bg-slate-50 p-4">
                      <p className="mb-3 text-sm font-medium text-foreground">{t("passwordRequirementsTitle")}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {passwordRules.map((rule) => {
                          const passed = rule.test(password);
                          return (
                            <div key={rule.key} className={cn("flex items-center gap-2 text-sm", passed ? "text-primary" : "text-muted-foreground")}>
                              <CheckCircle2 className={cn("h-4 w-4", !passed && "opacity-35")} />
                              <span>{t(rule.key)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </FormSection>

                  <FormSection icon={ImagePlus} title={t("personalPhoto")}>
                    <FormField control={form.control} name="personalPhotoUrl" render={() => (
                      <FormItem>
                        <FormControl>
                          <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                            <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border bg-slate-100">
                              {photoPreview ? (
                                <img src={photoPreview} alt={t("personalPhoto")} className="h-full w-full object-cover" />
                              ) : (
                                <div className="px-4 text-center text-sm text-muted-foreground">
                                  <ImagePlus className="mx-auto mb-2 h-8 w-8 text-primary" />
                                  {t("photoUploadTitle")}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col justify-between gap-4 rounded-xl border bg-slate-50 p-4">
                              <div>
                                <p className="font-medium">{t("photoUploadTitle")}</p>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("photoStandards")}</p>
                                <p className="mt-2 text-xs text-muted-foreground">{t("photoAcceptedFormats")}</p>
                                <p className="mt-2 text-xs text-muted-foreground">{t("photoTodoNote")}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  onChange={(event) => void handlePhotoSelect(event.target.files?.[0])}
                                />
                                <Button type="button" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                                  <Upload className="h-4 w-4" />
                                  {photoPreview ? t("photoReplaceAction") : t("photoUploadAction")}
                                </Button>
                                {photoPreview && (
                                  <Button type="button" variant="ghost" className="gap-2 text-destructive hover:text-destructive" onClick={removePhoto}>
                                    <Trash2 className="h-4 w-4" />
                                    {t("photoRemoveAction")}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </FormSection>

                  <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      {t("alreadyHaveAccount")}{" "}
                      <Link href="/login" className="font-medium text-primary hover:underline">{t("signIn")}</Link>
                    </p>
                    <Button type="submit" className="gap-2 sm:min-w-48" disabled={!form.formState.isValid || registerMutation.isPending}>
                      <Shield className="h-4 w-4" />
                      {registerMutation.isPending ? t("creatingAccount") : t("createAccount")}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

function FormSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function PasswordField({
  label,
  show,
  toggleLabel,
  onToggle,
  fieldName,
  control,
  isRTL,
}: {
  label: string;
  show: boolean;
  toggleLabel: string;
  onToggle: () => void;
  fieldName: "password" | "confirmPassword";
  control: ReturnType<typeof useForm<RegisterFormValues>>["control"];
  isRTL: boolean;
}) {
  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input type={show ? "text" : "password"} autoComplete="new-password" className={cn(isRTL ? "pl-11" : "pr-11")} {...field} />
              <button
                type="button"
                aria-label={toggleLabel}
                onClick={onToggle}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
                  isRTL ? "left-3" : "right-3",
                )}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
