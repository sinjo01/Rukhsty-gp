import { useListApplications, getListApplicationsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { FileText, ArrowRight, Plus, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { currentStepLabel, isMedicalBookingRequired, isPracticalBookingRequired, isTheoryBookingRequired, STATUS_COLORS, statusLabel } from "./application-utils";

export default function Applications() {
  const { language, isRTL } = useLanguage();
  const { data: applications, isLoading } = useListApplications({ query: { queryKey: getListApplicationsQueryKey() } });

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{language === "ar" ? "طلباتي" : "My Applications"}</h1>
          <p className="text-muted-foreground text-sm mt-1">{language === "ar" ? "تتبع جميع طلبات الترخيص الخاصة بك" : "Track all your license applications"}</p>
        </div>
        <Link href="/services/issue-driving-license">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> {language === "ar" ? "طلب جديد" : "New Application"}
          </Button>
        </Link>
      </motion.div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      )}

      {!isLoading && (!applications || applications.length === 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">{language === "ar" ? "لا توجد طلبات بعد" : "No applications yet"}</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-6">{language === "ar" ? "ابدأ بتقديم طلب رخصة قيادة جديدة" : "Start by applying for a new driving license"}</p>
          <Link href="/services/issue-driving-license">
            <Button>{language === "ar" ? "بدء طلب جديد" : "Start New Application"}</Button>
          </Link>
        </motion.div>
      )}

      <div className="space-y-3">
        {applications?.map((app: any, i: number) => (
          <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:border-primary/30 hover:shadow-sm transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold">{app.applicationNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(language === "ar" ? app.service?.nameAr : app.service?.nameEn) ?? (language === "ar" ? "رخصة قيادة" : "Driving License")} {app.licenseCategory?.code ? `· ${app.licenseCategory.code}` : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`text-xs ${STATUS_COLORS[app.status] ?? "bg-slate-100 text-slate-700"}`}>
                          {statusLabel(app.status, language)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{currentStepLabel(app.currentStep, language)}</span>
                        {app.createdAt && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/applications/${app.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                        {language === "ar" ? "تتبع" : "Track"} <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                    {isMedicalBookingRequired(app) && (
                      <Link href={`/applications/${app.id}/book-medical`}>
                        <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800">
                          {language === "ar" ? "حجز فحص النظر" : "Book Medical / Vision Test"}
                        </Button>
                      </Link>
                    )}
                    {isTheoryBookingRequired(app) && (
                      <Link href={`/applications/${app.id}/book-theory`}>
                        <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800">
                          {language === "ar" ? "حجز الامتحان النظري" : "Book Theory Exam"}
                        </Button>
                      </Link>
                    )}
                    {isPracticalBookingRequired(app) && (
                      <Link href={`/applications/${app.id}/book-practical`}>
                        <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800">
                          {language === "ar" ? "حجز الامتحان العملي" : "Book Practical Exam"}
                        </Button>
                      </Link>
                    )}
                    {["RENEWAL_ELIGIBILITY_CHECK","RENEWAL_MEDICAL_BOOKED","RENEWAL_MEDICAL_REJECTED","RENEWAL_PAYMENT_PENDING","LICENSE_RENEWED"].includes(app.status) && (
                      <Link href={app.status === "LICENSE_RENEWED" ? "/my-license" : "/services/renew-driving-license"}>
                        <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800">
                          {app.status === "LICENSE_RENEWED"
                            ? language === "ar" ? "عرض الرخصة" : "View Renewed License"
                            : app.status === "RENEWAL_MEDICAL_BOOKED"
                            ? language === "ar" ? "موعد الفحص محجوز" : "Medical Appointment Booked"
                            : app.status === "RENEWAL_MEDICAL_REJECTED"
                            ? language === "ar" ? "عرض نتيجة التجديد" : "View Renewal Result"
                            : language === "ar" ? "متابعة تجديد الرخصة" : "Continue License Renewal"}
                        </Button>
                      </Link>
                    )}
                    {["VEHICLE_ELIGIBILITY_CHECK","INSURANCE_REQUIRED","TECHNICAL_INSPECTION_REQUIRED","VEHICLE_PAYMENT_PENDING","VEHICLE_REGISTRATION_RENEWED"].includes(app.status) && (
                      <Link href="/services/renew-vehicle-registration">
                        <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800">
                          {app.status === "VEHICLE_REGISTRATION_RENEWED"
                            ? language === "ar" ? "عرض ترخيص المركبة" : "View Vehicle Registration"
                            : language === "ar" ? "متابعة تجديد المركبة" : "Continue Vehicle Renewal"}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
