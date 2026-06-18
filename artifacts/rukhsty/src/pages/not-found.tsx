import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const { isRTL, pick } = useLanguage();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50" dir={isRTL ? "rtl" : "ltr"}>
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">{pick("404 Page Not Found", "404 الصفحة غير موجودة")}</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {pick("The page you requested does not exist.", "الصفحة التي طلبتها غير موجودة.")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
