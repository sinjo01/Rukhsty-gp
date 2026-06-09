import { Link, useLocation } from "wouter";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IdCard, LogIn, Mail } from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const DEMO_ACCOUNTS = [
  { label: "Admin", labelAr: "مدير النظام", email: "admin@rukhsty.jo", nationalId: "9000000001", password: "password123" },
  { label: "User", labelAr: "مستخدم", email: "user@rukhsty.jo", nationalId: "9876543210", password: "password123" },
  { label: "Test Citizen", labelAr: "مواطن تجريبي", email: "test.user@rukhsty.jo", nationalId: "5555555555", password: "password123" },
  { label: "Security Officer", labelAr: "موظف المراجعة الأمنية", email: "security.officer@rukhsty.jo", nationalId: "9999999991", password: "password123" },
  { label: "Medical Officer", labelAr: "موظف الفحص الطبي", email: "medical.officer@rukhsty.jo", nationalId: "9900000002", password: "password123" },
  { label: "Theory Officer", labelAr: "موظف الامتحان النظري", email: "theory.officer@rukhsty.jo", nationalId: "9900000003", password: "password123" },
  { label: "Practical Officer", labelAr: "موظف الامتحان العملي", email: "practical.officer@rukhsty.jo", nationalId: "9900000004", password: "password123" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const { isRTL, t, toggleLanguage } = useLanguage();
  const loginMutation = useLogin();

  const loginSchema = useMemo(
    () =>
      z.object({
        identifier: z.string().trim().min(1, t("validationRequired")),
        password: z.string().min(1, t("validationRequired")),
      }),
    [t],
  );

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const fillCredentials = (identifier: string, password: string) => {
    form.setValue("identifier", identifier, { shouldValidate: true });
    form.setValue("password", password, { shouldValidate: true });
  };

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      const normalizedIdentifier = values.identifier.trim();
      const response = await loginMutation.mutateAsync({
        data: {
          identifier: normalizedIdentifier,
          email: normalizedIdentifier.includes("@") ? normalizedIdentifier : undefined,
          password: values.password,
        },
      });
      login(response.token, response.user);

      toast({
        title: t("loginSuccessTitle"),
        description: t("loginSuccessDescription"),
      });

      if (response.user.role === "SECURITY_OFFICER") {
        setLocation("/security/review");
      } else if (response.user.role === "ADMIN") {
        setLocation("/admin/dashboard");
      } else if (response.user.role.includes("OFFICER")) {
        setLocation("/officer/dashboard");
      } else {
        setLocation("/dashboard");
      }
    } catch {
      toast({
        variant: "destructive",
        title: t("loginFailedTitle"),
        description: t("loginFailedDescription"),
      });
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

      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className={cn("rounded-2xl bg-primary p-8 text-white shadow-xl", isRTL && "lg:order-2")}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <LogoMark tone="onDark" className="h-7 w-7" />
          </div>
          <h1 className="mt-8 text-3xl font-bold leading-tight">{t("signInTitle")}</h1>
          <p className="mt-4 leading-relaxed text-white/75">{t("signInDescription")}</p>
          <div className="mt-8 grid gap-3 text-sm text-white/80">
            <div className="flex items-center gap-3">
              <IdCard className="h-5 w-5 text-accent" />
              <span>{t("emailOrNationalId")}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-accent" />
              <span>{t("loginHelper")}</span>
            </div>
          </div>
        </section>

        <section className={cn(isRTL && "lg:order-1")}>
          <Card className="border-slate-200 shadow-2xl">
            <CardHeader>
              <CardTitle>{t("loginWelcome")}</CardTitle>
              <CardDescription>{t("loginHelper")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("emailOrNationalId")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("emailOrNationalIdPlaceholder")} autoComplete="username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("password")}</FormLabel>
                        <FormControl>
                          <Input placeholder="••••••••" type="password" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full gap-2" disabled={loginMutation.isPending}>
                    <LogIn className="h-4 w-4" />
                    {loginMutation.isPending ? t("signingIn") : t("signIn")}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <div className="text-center text-sm text-muted-foreground">
                {t("noAccount")}{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  {t("registerHere")}
                </Link>
              </div>

              <div className="w-full rounded-lg border bg-muted/50 p-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  {t("demoAccounts")} - {t("clickToFill")}:
                </p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => fillCredentials(account.nationalId, account.password)}
                      className={cn(
                        "rounded-md border border-border bg-background px-2 py-1.5 text-xs transition-colors hover:bg-primary/10",
                        isRTL ? "text-right" : "text-left",
                      )}
                    >
                      <span className="block font-medium text-foreground">{isRTL ? account.labelAr : account.label}</span>
                      <span className="block truncate text-muted-foreground">{account.email}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardFooter>
          </Card>
        </section>
      </main>
    </div>
  );
}
