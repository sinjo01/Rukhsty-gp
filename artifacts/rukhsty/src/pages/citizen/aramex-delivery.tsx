import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useGetMyLicense, getGetMyLicenseQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, CheckCircle2, MapPin, Truck } from "lucide-react";

const TIME_SLOTS = [
  "09:00 - 11:00",
  "11:00 - 13:00",
  "13:00 - 15:00",
  "15:00 - 17:00",
  "17:00 - 19:00",
];

function validPhone(phone: string) {
  return /^(?:07[789]\d{7}|\+9627[789]\d{7})$/.test(phone.trim());
}

export default function AramexDelivery({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const { language, isRTL } = useLanguage();
  const { data: license, isLoading } = useGetMyLicense({ query: { queryKey: getGetMyLicenseQueryKey() } });
  const selectedLicense = license as any;
  const [deliveryAddress, setDeliveryAddress] = useState(selectedLicense?.deliveryAddress ?? "");
  const [deliveryCity, setDeliveryCity] = useState(selectedLicense?.deliveryCity ?? "");
  const [deliveryPhone, setDeliveryPhone] = useState(selectedLicense?.deliveryPhone ?? "");
  const [deliveryLocationLink, setDeliveryLocationLink] = useState(selectedLicense?.deliveryLocationLink ?? "");
  const [deliveryDate, setDeliveryDate] = useState(selectedLicense?.deliveryDate ?? "");
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState(selectedLicense?.deliveryTimeSlot ?? TIME_SLOTS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedLicense) return;
    setDeliveryAddress(selectedLicense.deliveryAddress ?? "");
    setDeliveryCity(selectedLicense.deliveryCity ?? "");
    setDeliveryPhone(selectedLicense.deliveryPhone ?? "");
    setDeliveryLocationLink(selectedLicense.deliveryLocationLink ?? "");
    setDeliveryDate(selectedLicense.deliveryDate ?? "");
    setDeliveryTimeSlot(selectedLicense.deliveryTimeSlot ?? TIME_SLOTS[0]);
  }, [selectedLicense?.id]);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-96 rounded-2xl" /></div>;

  const licenseId = params.id || selectedLicense?.id;
  const tracking = saved?.aramexTrackingNumber ?? selectedLicense?.aramexTrackingNumber;
  const deliveryStatus = saved?.deliveryStatus ?? selectedLicense?.deliveryStatus;

  const submit = async () => {
    setError("");
    if (deliveryAddress.trim().length < 10) { setError(language === "ar" ? "أدخل عنواناً واضحاً من 10 أحرف على الأقل." : "Enter a clear address with at least 10 characters."); return; }
    if (!deliveryCity.trim()) { setError(language === "ar" ? "المدينة مطلوبة." : "City is required."); return; }
    if (!validPhone(deliveryPhone)) { setError(language === "ar" ? "أدخل رقم هاتف أردني صحيح." : "Enter a valid Jordanian phone number."); return; }
    if (!/^https?:\/\/.+/i.test(deliveryLocationLink.trim())) { setError(language === "ar" ? "أدخل رابط موقع صحيح يبدأ بـ http أو https." : "Enter a valid location link starting with http or https."); return; }
    if (!deliveryDate) { setError(language === "ar" ? "اختر تاريخ التوصيل." : "Select a delivery date."); return; }
    if (!deliveryTimeSlot) { setError(language === "ar" ? "اختر وقت التوصيل." : "Select a delivery time slot."); return; }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/licenses/${licenseId}/delivery/aramex`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`,
        },
        body: JSON.stringify({ deliveryAddress, deliveryCity, deliveryPhone, deliveryLocationLink, deliveryDate, deliveryTimeSlot }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? "Delivery request failed");
      setSaved(result?.license ?? result?.application ?? {});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetMyLicenseQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delivery request failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3">
        <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">{language === "ar" ? "التوصيل عبر أرامكس" : "Aramex Delivery"}</h1>
          <p className="text-sm text-muted-foreground">{language === "ar" ? "أدخل رابط الموقع واختر تاريخ ووقت التوصيل." : "Add your location link and choose delivery date and time."}</p>
        </div>
      </div>

      {saved && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-start gap-3 p-5">
            <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-700" />
            <div>
              <p className="font-semibold text-emerald-950">{language === "ar" ? "كل شيء تمام، تم تأكيد طلب التوصيل." : "Everything is okay. Your delivery request is confirmed."}</p>
              <p className="mt-1 text-sm text-emerald-800">
                {language === "ar" ? "سيتم تسليم رخصتك حسب التاريخ والوقت المحدد." : "Your license will be delivered on the selected date and time."}
              </p>
              {tracking && <Badge className="mt-3 bg-sky-100 text-sky-800 hover:bg-sky-100">Aramex {tracking}</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-emerald-100 shadow-sm">
        <CardHeader className="border-b bg-emerald-50/70">
          <CardTitle className="flex items-center gap-2 text-emerald-950"><Truck className="h-5 w-5" />{language === "ar" ? "بيانات التوصيل" : "Delivery Details"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5">
          <Input value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder={language === "ar" ? "العنوان التفصيلي" : "Detailed address"} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input value={deliveryCity} onChange={(event) => setDeliveryCity(event.target.value)} placeholder={language === "ar" ? "المدينة" : "City"} />
            <Input value={deliveryPhone} onChange={(event) => setDeliveryPhone(event.target.value)} placeholder="0791234567" />
          </div>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" value={deliveryLocationLink} onChange={(event) => setDeliveryLocationLink(event.target.value)} placeholder={language === "ar" ? "رابط الموقع من خرائط Google" : "Location link from Google Maps"} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="date" value={deliveryDate} min={new Date().toISOString().split("T")[0]} onChange={(event) => setDeliveryDate(event.target.value)} />
            <select className="h-11 rounded-md border border-input bg-background px-3 text-sm" value={deliveryTimeSlot} onChange={(event) => setDeliveryTimeSlot(event.target.value)}>
              {TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </div>
          {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Link href="/dashboard"><Button variant="outline">{language === "ar" ? "رجوع" : "Back"}</Button></Link>
            <Button onClick={submit} disabled={isSaving} className="bg-emerald-700 hover:bg-emerald-800">
              {isSaving ? (language === "ar" ? "جارٍ التأكيد..." : "Confirming...") : (language === "ar" ? "تأكيد التوصيل" : "Confirm Delivery")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedLicense && (
        <Card>
          <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
            <div><p className="text-xs text-muted-foreground">{language === "ar" ? "رقم الرخصة" : "License Number"}</p><p className="font-mono text-sm font-semibold">{selectedLicense.licenseNumber}</p></div>
            <div><p className="text-xs text-muted-foreground">{language === "ar" ? "حالة الدفع" : "Payment Status"}</p><p className="font-semibold">{selectedLicense.paymentStatus === "paid" ? (language === "ar" ? "مدفوع" : "Paid") : (language === "ar" ? "بانتظار الدفع" : "Pending")}</p></div>
            <div><p className="text-xs text-muted-foreground">{language === "ar" ? "حالة التوصيل" : "Delivery Status"}</p><p className="font-semibold">{deliveryStatus ?? "not_requested"}</p></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
