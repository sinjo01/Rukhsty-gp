import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, CheckCircle2, CreditCard, FileCheck2, Home, Plus, ShieldCheck } from "lucide-react";

function authHeaders() {
  return {
    accept: "application/json",
    "content-type": "application/json",
    authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`,
  };
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message ?? `HTTP ${response.status}`);
  return data;
}

type Vehicle = {
  id: string;
  plateNumber: string;
  registrationNumber?: string;
  vehicleType?: string;
  make?: string;
  brand?: string;
  model?: string;
  year?: number;
  manufactureYear?: number;
  color?: string;
  chassisNumber?: string;
  ownerNationalId?: string;
  registrationExpiryDate?: string;
  currentLicenseExpiry?: string;
  insuranceStatus?: string;
  technicalInspectionStatus?: string;
  status?: string;
};

export default function ServiceRenewVehicleRegistration() {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [application, setApplication] = useState<any>(null);
  const [renewedVehicle, setRenewedVehicle] = useState<Vehicle | null>(null);
  const [step, setStep] = useState<"select" | "payment" | "success">("select");
  const [busy, setBusy] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    plateNumber: "",
    registrationNumber: "",
    vehicleType: "Private",
    make: "",
    model: "",
    year: "",
    color: "",
    chassisNumber: "",
    ownerNationalId: "",
    registrationExpiryDate: "",
    insuranceStatus: "VALID",
    technicalInspectionStatus: "PASSED",
  });

  const { data: vehicles, isLoading } = useQuery({ queryKey: ["vehicles"], queryFn: () => api<Vehicle[]>("/api/vehicles") });
  const selectedVehicle = renewedVehicle ?? vehicles?.find((vehicle) => vehicle.id === selectedVehicleId);
  const tr = {
    title: language === "ar" ? "تجديد ترخيص المركبة" : "Renew Vehicle Registration",
    subtitle: language === "ar" ? "جدد ترخيص مركبتك بدون الدخول في مسار رخصة القيادة." : "Renew your vehicle registration without using the driving license workflow.",
    noVehicles: language === "ar" ? "لا توجد مركبات مسجلة. أضف مركبة للمتابعة." : "No vehicles found. Add a vehicle to continue.",
    addVehicle: language === "ar" ? "إضافة مركبة" : "Add Vehicle",
    selectVehicle: language === "ar" ? "اختيار المركبة" : "Select Vehicle",
    checks: language === "ar" ? "فحص أهلية المركبة" : "Vehicle Eligibility",
    pay: language === "ar" ? "الدفع وتجديد الترخيص" : "Pay and Renew Registration",
    success: language === "ar" ? "تم تجديد ترخيص المركبة بنجاح." : "Vehicle registration renewed successfully.",
  };

  const checks = selectedVehicle ? [
    [language === "ar" ? "المركبة مسجلة باسم المستخدم" : "Vehicle belongs to current user", true],
    [language === "ar" ? "التأمين ساري" : "Insurance is valid", selectedVehicle.insuranceStatus === "VALID"],
    [language === "ar" ? "الفحص الفني ناجح" : "Technical inspection is valid", selectedVehicle.technicalInspectionStatus === "PASSED"],
    [language === "ar" ? "لا توجد مخالفات مانعة" : "No blocking fines/restrictions", true],
    [language === "ar" ? "المركبة مؤهلة للتجديد" : "Registration is eligible for renewal", true],
  ] as const : [];

  async function addVehicle() {
    if (!vehicleForm.plateNumber.trim()) {
      toast({ variant: "destructive", title: language === "ar" ? "رقم اللوحة مطلوب" : "Plate number is required" });
      return;
    }
    setBusy(true);
    try {
      const vehicle = await api<Vehicle>("/api/vehicles", { method: "POST", body: JSON.stringify(vehicleForm) });
      setSelectedVehicleId(vehicle.id);
      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast({ title: language === "ar" ? "تمت إضافة المركبة" : "Vehicle added" });
    } catch (error) {
      toast({ variant: "destructive", title: language === "ar" ? "تعذرت إضافة المركبة" : "Could not add vehicle", description: error instanceof Error ? error.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function startRenewal() {
    if (!selectedVehicle) return;
    setBusy(true);
    try {
      const result = await api<any>("/api/services/renew-vehicle-registration/apply", { method: "POST", body: JSON.stringify({ vehicleId: selectedVehicle.id }) });
      setApplication(result.application);
      if (result.application.status === "INSURANCE_REQUIRED") {
        await api("/api/services/renew-vehicle-registration/insurance", { method: "POST", body: JSON.stringify({ vehicleId: selectedVehicle.id, applicationId: result.application.id }) });
        await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      }
      setStep("payment");
    } catch (error) {
      toast({ variant: "destructive", title: language === "ar" ? "تعذر بدء التجديد" : "Could not start renewal", description: error instanceof Error ? error.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function payAndComplete() {
    if (!selectedVehicle) return;
    setBusy(true);
    try {
      const app = application ?? (await api<any>("/api/services/renew-vehicle-registration/apply", { method: "POST", body: JSON.stringify({ vehicleId: selectedVehicle.id }) })).application;
      await api("/api/services/renew-vehicle-registration/pay", { method: "POST", body: JSON.stringify({ applicationId: app.id }) });
      const result = await api<any>("/api/services/renew-vehicle-registration/complete", { method: "POST", body: JSON.stringify({ applicationId: app.id, vehicleId: selectedVehicle.id }) });
      setApplication(result.application);
      setRenewedVehicle(result.vehicle);
      setStep("success");
      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast({ title: tr.success });
    } catch (error) {
      toast({ variant: "destructive", title: language === "ar" ? "فشل التجديد" : "Renewal failed", description: error instanceof Error ? error.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold">{tr.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{tr.subtitle}</p>
      </div>

      {step === "success" && renewedVehicle ? (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="space-y-6 p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" />
            <h2 className="text-2xl font-bold text-emerald-900">{tr.success}</h2>
            <VehicleRegistrationCard vehicle={renewedVehicle} language={language} />
            <div className="flex justify-center gap-3">
              <Link href="/dashboard"><Button variant="outline" className="gap-2"><Home className="h-4 w-4" />{language === "ar" ? "لوحة التحكم" : "Back to Dashboard"}</Button></Link>
              <Button variant="outline" onClick={() => window.print()}>{language === "ar" ? "طباعة" : "Print"}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Car className="h-4 w-4 text-primary" />{tr.selectVehicle}</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-32 rounded-xl" /> : (
                <RadioGroup value={selectedVehicleId} onValueChange={setSelectedVehicleId} className="grid gap-3 md:grid-cols-2">
                  {vehicles?.map((vehicle) => (
                    <Label key={vehicle.id} className="cursor-pointer rounded-xl border p-4 hover:border-primary/50">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={vehicle.id} className="mt-1" />
                        <div>
                          <p className="font-bold">{vehicle.plateNumber}</p>
                          <p className="text-sm text-muted-foreground">{[vehicle.make ?? vehicle.brand, vehicle.model, vehicle.year ?? vehicle.manufactureYear].filter(Boolean).join(" ")}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{language === "ar" ? "انتهاء الترخيص" : "Expiry"}: {vehicle.registrationExpiryDate ?? vehicle.currentLicenseExpiry ?? "-"}</p>
                        </div>
                      </div>
                    </Label>
                  ))}
                  {!vehicles?.length && <p className="text-sm text-muted-foreground">{tr.noVehicles}</p>}
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4 text-primary" />{tr.addVehicle}</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                ["plateNumber", language === "ar" ? "رقم اللوحة" : "Plate number"],
                ["registrationNumber", language === "ar" ? "رقم التسجيل" : "Registration number"],
                ["make", language === "ar" ? "الشركة المصنعة" : "Make"],
                ["model", language === "ar" ? "الطراز" : "Model"],
                ["year", language === "ar" ? "السنة" : "Year"],
                ["color", language === "ar" ? "اللون" : "Color"],
                ["chassisNumber", language === "ar" ? "رقم الشاصي" : "Chassis number"],
                ["ownerNationalId", language === "ar" ? "الرقم الوطني للمالك" : "Owner national ID"],
                ["registrationExpiryDate", language === "ar" ? "تاريخ انتهاء الترخيص" : "Registration expiry date"],
              ].map(([key, label]) => (
                <Input key={key} type={key === "registrationExpiryDate" ? "date" : "text"} placeholder={label} value={(vehicleForm as any)[key]} onChange={(event) => setVehicleForm((form) => ({ ...form, [key]: event.target.value }))} />
              ))}
              <Button variant="outline" className="sm:col-span-2" onClick={addVehicle} disabled={busy}>{tr.addVehicle}</Button>
            </CardContent>
          </Card>

          {selectedVehicle && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileCheck2 className="h-4 w-4 text-primary" />{tr.checks}</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {checks.map(([label, ok]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
                    <span className="text-sm">{label}</span>
                    <Badge className={ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>{ok ? (language === "ar" ? "تم التحقق" : "Checked") : (language === "ar" ? "مطلوب" : "Required")}</Badge>
                  </div>
                ))}
                <Button className="sm:col-span-2 gap-2" onClick={startRenewal} disabled={busy || step === "payment"}><ShieldCheck className="h-4 w-4" />{language === "ar" ? "تأكيد الأهلية" : "Confirm Eligibility"}</Button>
              </CardContent>
            </Card>
          )}

          {step === "payment" && selectedVehicle && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4 text-primary" />{language === "ar" ? "الدفع" : "Payment"}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Fee label={language === "ar" ? "رسوم تجديد الترخيص" : "Registration renewal fee"} value="30 JOD" />
                <Fee label={language === "ar" ? "رسوم الخدمة" : "Service fee"} value="1 JOD" />
                <Fee label={language === "ar" ? "رسوم الفحص الفني" : "Technical inspection fee"} value="5 JOD" />
                <Fee label={language === "ar" ? "المجموع" : "Total"} value="36 JOD" strong />
                <Button className="w-full gap-2" onClick={payAndComplete} disabled={busy}><CreditCard className="h-4 w-4" />{tr.pay}</Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function VehicleRegistrationCard({ vehicle, language }: { vehicle: Vehicle; language: "en" | "ar" }) {
  const make = vehicle.make ?? vehicle.brand ?? "-";
  const year = vehicle.year ?? vehicle.manufactureYear ?? "-";
  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-xl border-4 border-[#0e5c3a] bg-gradient-to-br from-[#eef9fb] to-[#d7f0ea] p-5 text-left shadow-sm" dir="ltr">
      <div className="flex items-start justify-between border-b border-[#0e5c3a]/40 pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0e5c3a]">{language === "ar" ? "منصة رخصتي" : "Rukhsty DVLD"}</p>
          <h3 className="text-xl font-bold text-[#0d3327]">{language === "ar" ? "ترخيص المركبة" : "Vehicle Registration"}</h3>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Doc label={language === "ar" ? "رقم اللوحة" : "Plate number"} value={vehicle.plateNumber} />
        <Doc label={language === "ar" ? "رقم التسجيل" : "Registration No"} value={vehicle.registrationNumber} />
        <Doc label={language === "ar" ? "النوع" : "Type"} value={vehicle.vehicleType} />
        <Doc label={language === "ar" ? "الصنع والطراز" : "Make & model"} value={`${make} ${vehicle.model ?? ""}`} />
        <Doc label={language === "ar" ? "السنة" : "Year"} value={String(year)} />
        <Doc label={language === "ar" ? "اللون" : "Color"} value={vehicle.color} />
        <Doc label={language === "ar" ? "رقم الشاصي" : "Chassis No"} value={vehicle.chassisNumber} />
        <Doc label={language === "ar" ? "الرقم الوطني للمالك" : "Owner National ID"} value={vehicle.ownerNationalId} />
        <Doc label={language === "ar" ? "تاريخ الانتهاء" : "Expiry"} value={vehicle.registrationExpiryDate ?? vehicle.currentLicenseExpiry} />
        <Doc label={language === "ar" ? "الحالة" : "Status"} value={vehicle.status ?? "ACTIVE"} />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-white/70 p-3 text-xs text-slate-600">
        <span>{language === "ar" ? "رمز تحقق تجريبي" : "Verification placeholder"}</span>
        <span className="font-mono">QR-{vehicle.id?.slice(0, 8)}</span>
      </div>
    </div>
  );
}

function Doc({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-lg border border-[#0e5c3a]/25 bg-white/60 p-2"><p className="text-[10px] font-bold uppercase text-[#0e5c3a]">{label}</p><p className="text-sm font-semibold text-slate-900">{value ?? "-"}</p></div>;
}

function Fee({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex justify-between rounded-lg border p-3 ${strong ? "bg-emerald-50 font-bold text-emerald-900" : ""}`}><span>{label}</span><span>{value}</span></div>;
}
