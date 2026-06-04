export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PROFILE_SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  SECURITY_REVIEW: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  SECURITY_APPROVED: "bg-emerald-100 text-emerald-700",
  SECURITY_REJECTED: "bg-red-100 text-red-700",
  MEDICAL_BOOKING: "bg-purple-100 text-purple-700",
  MEDICAL_APPOINTMENT_BOOKED: "bg-purple-100 text-purple-700",
  MEDICAL_REJECTED: "bg-red-100 text-red-700",
  MEDICAL_PASSED: "bg-green-100 text-green-700",
  MEDICAL_FAILED: "bg-red-100 text-red-700",
  THEORY_BOOKING: "bg-blue-100 text-blue-700",
  THEORY_APPOINTMENT_BOOKED: "bg-blue-100 text-blue-700",
  THEORY_PASSED: "bg-green-100 text-green-700",
  THEORY_FAILED: "bg-red-100 text-red-700",
  PRACTICAL_BOOKING: "bg-amber-100 text-amber-700",
  PRACTICAL_APPOINTMENT_BOOKED: "bg-amber-100 text-amber-700",
  PRACTICAL_PASSED: "bg-green-100 text-green-700",
  PRACTICAL_FAILED: "bg-red-100 text-red-700",
  LICENSE_ISSUANCE: "bg-amber-100 text-amber-700",
  LICENSE_ISSUED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  RENEWAL_SUBMITTED: "bg-blue-100 text-blue-700",
  RENEWAL_ELIGIBILITY_CHECK: "bg-blue-100 text-blue-700",
  RENEWAL_MEDICAL_BOOKING: "bg-purple-100 text-purple-700",
  RENEWAL_MEDICAL_BOOKED: "bg-purple-100 text-purple-700",
  RENEWAL_MEDICAL_PASSED: "bg-green-100 text-green-700",
  RENEWAL_PAYMENT_PENDING: "bg-amber-100 text-amber-700",
  LICENSE_RENEWED: "bg-emerald-100 text-emerald-700",
  RENEWAL_MEDICAL_REJECTED: "bg-red-100 text-red-700",
  RENEWAL_REJECTED: "bg-red-100 text-red-700",
  VEHICLE_RENEWAL_SUBMITTED: "bg-blue-100 text-blue-700",
  VEHICLE_ELIGIBILITY_CHECK: "bg-blue-100 text-blue-700",
  INSURANCE_REQUIRED: "bg-amber-100 text-amber-700",
  TECHNICAL_INSPECTION_REQUIRED: "bg-purple-100 text-purple-700",
  VEHICLE_PAYMENT_PENDING: "bg-amber-100 text-amber-700",
  VEHICLE_REGISTRATION_RENEWED: "bg-emerald-100 text-emerald-700",
  VEHICLE_RENEWAL_REJECTED: "bg-red-100 text-red-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

export function isMedicalBookingRequired(app: any) {
  return app?.currentStep === "MEDICAL_BOOKING"
    || app?.status === "SECURITY_APPROVED"
    || app?.status === "MEDICAL_BOOKING"
    || app?.currentStep === "RENEWAL_MEDICAL_BOOKING"
    || app?.status === "RENEWAL_SUBMITTED"
    || app?.status === "RENEWAL_MEDICAL_BOOKING";
}

export function isTheoryBookingRequired(app: any) {
  return app?.currentStep === "THEORY_BOOKING" || app?.status === "MEDICAL_PASSED" || app?.status === "THEORY_BOOKING" || app?.status === "THEORY_FAILED";
}

export function isPracticalBookingRequired(app: any) {
  return app?.currentStep === "PRACTICAL_BOOKING" || app?.status === "THEORY_PASSED" || app?.status === "PRACTICAL_BOOKING" || app?.status === "PRACTICAL_FAILED";
}

export function statusLabel(status?: string, language: "en" | "ar" = "en") {
  const en: Record<string, string> = {
    SECURITY_APPROVED: "Security Approved",
    MEDICAL_BOOKING: "Medical booking",
    MEDICAL_APPOINTMENT_BOOKED: "Medical appointment booked",
    MEDICAL_PASSED: "Medical Passed",
    MEDICAL_REJECTED: "Medical Rejected",
    THEORY_BOOKING: "Theory Exam Booking",
    THEORY_APPOINTMENT_BOOKED: "Theory Exam Booked",
    THEORY_PASSED: "Theory Exam Passed",
    THEORY_FAILED: "Theory Exam Failed",
    PRACTICAL_BOOKING: "Practical Exam Booking",
    PRACTICAL_APPOINTMENT_BOOKED: "Practical Exam Booked",
    PRACTICAL_PASSED: "Practical Exam Passed",
    PRACTICAL_FAILED: "Practical Exam Failed",
    SECURITY_REVIEW: "Security Review",
    SECURITY_REJECTED: "Security Rejected",
    LICENSE_ISSUED: "License Issued",
    RENEWAL_SUBMITTED: "Renewal Submitted",
    RENEWAL_ELIGIBILITY_CHECK: "Renewal Eligibility Check",
    RENEWAL_MEDICAL_BOOKING: "Renewal Medical Booking",
    RENEWAL_MEDICAL_BOOKED: "Renewal Medical Booked",
    RENEWAL_MEDICAL_PASSED: "Renewal Medical Passed",
    RENEWAL_PAYMENT_PENDING: "Renewal Payment Pending",
    LICENSE_RENEWED: "License Renewed",
    RENEWAL_MEDICAL_REJECTED: "Renewal Medical Rejected",
    RENEWAL_REJECTED: "Renewal Rejected",
    VEHICLE_RENEWAL_SUBMITTED: "Vehicle Renewal Submitted",
    VEHICLE_ELIGIBILITY_CHECK: "Vehicle Eligibility Check",
    INSURANCE_REQUIRED: "Insurance Required",
    TECHNICAL_INSPECTION_REQUIRED: "Technical Inspection Required",
    VEHICLE_PAYMENT_PENDING: "Vehicle Payment Pending",
    VEHICLE_REGISTRATION_RENEWED: "Vehicle Registration Renewed",
    VEHICLE_RENEWAL_REJECTED: "Vehicle Renewal Rejected",
  };
  const ar: Record<string, string> = {
    SECURITY_APPROVED: "تمت الموافقة الأمنية",
    MEDICAL_BOOKING: "حجز فحص النظر",
    MEDICAL_APPOINTMENT_BOOKED: "تم حجز فحص النظر",
    MEDICAL_PASSED: "تم اجتياز فحص النظر",
    MEDICAL_REJECTED: "مرفوض طبياً",
    THEORY_BOOKING: "حجز الامتحان النظري",
    THEORY_APPOINTMENT_BOOKED: "تم حجز الامتحان النظري",
    THEORY_PASSED: "تم اجتياز الامتحان النظري",
    THEORY_FAILED: "لم يتم اجتياز الامتحان النظري",
    PRACTICAL_BOOKING: "حجز الامتحان العملي",
    PRACTICAL_APPOINTMENT_BOOKED: "تم حجز الامتحان العملي",
    PRACTICAL_PASSED: "تم اجتياز الامتحان العملي",
    PRACTICAL_FAILED: "لم يتم اجتياز الامتحان العملي",
    SECURITY_REVIEW: "المراجعة الأمنية",
    SECURITY_REJECTED: "مرفوض أمنياً",
    LICENSE_ISSUED: "تم إصدار الرخصة",
    RENEWAL_SUBMITTED: "تم تقديم طلب التجديد",
    RENEWAL_ELIGIBILITY_CHECK: "فحص أهلية التجديد",
    RENEWAL_MEDICAL_BOOKING: "حجز فحص التجديد",
    RENEWAL_MEDICAL_BOOKED: "تم حجز فحص التجديد",
    RENEWAL_MEDICAL_PASSED: "تم اجتياز فحص التجديد",
    RENEWAL_PAYMENT_PENDING: "بانتظار دفع التجديد",
    LICENSE_RENEWED: "تم تجديد الرخصة",
    RENEWAL_MEDICAL_REJECTED: "تم رفض فحص التجديد",
    RENEWAL_REJECTED: "تم رفض التجديد",
    VEHICLE_RENEWAL_SUBMITTED: "تم تقديم تجديد المركبة",
    VEHICLE_ELIGIBILITY_CHECK: "فحص أهلية المركبة",
    INSURANCE_REQUIRED: "مطلوب تأكيد التأمين",
    TECHNICAL_INSPECTION_REQUIRED: "مطلوب الفحص الفني",
    VEHICLE_PAYMENT_PENDING: "بانتظار دفع رسوم المركبة",
    VEHICLE_REGISTRATION_RENEWED: "تم تجديد ترخيص المركبة",
    VEHICLE_RENEWAL_REJECTED: "تم رفض تجديد المركبة",
  };
  const source = language === "ar" ? ar : en;
  return source[status ?? ""] ?? status?.replace(/_/g, " ") ?? "—";
}

export function currentStepLabel(step?: string, language: "en" | "ar" = "en") {
  const en: Record<string, string> = {
    SECURITY_REVIEW: "Security review in progress",
    MEDICAL_BOOKING: "Medical test booking required",
    MEDICAL_APPOINTMENT_BOOKED: "Medical appointment booked",
    THEORY_BOOKING: "Theory exam booking required",
    THEORY_APPOINTMENT_BOOKED: "Theory exam booked",
    PRACTICAL_BOOKING: "Practical exam booking required",
    PRACTICAL_APPOINTMENT_BOOKED: "Practical exam booked",
    LICENSE_ISSUANCE: "License issuance pending",
    PRACTICAL_PASSED: "License issuance pending",
    RENEWAL_ELIGIBILITY_CHECK: "Renewal eligibility check",
    RENEWAL_SUBMITTED: "Book renewal medical/vision test",
    RENEWAL_MEDICAL_BOOKING: "Book renewal medical/vision test",
    RENEWAL_MEDICAL_BOOKED: "Renewal medical/vision appointment booked",
    RENEWAL_MEDICAL_REJECTED: "Renewal was not approved medically",
    RENEWAL_PAYMENT_PENDING: "Renewal payment pending",
    LICENSE_RENEWED: "View renewed license",
    VEHICLE_ELIGIBILITY_CHECK: "Vehicle eligibility check",
    INSURANCE_REQUIRED: "Confirm insurance",
    TECHNICAL_INSPECTION_REQUIRED: "Complete technical inspection",
    VEHICLE_PAYMENT_PENDING: "Pay vehicle renewal fees",
    VEHICLE_REGISTRATION_RENEWED: "View vehicle registration",
  };
  const ar: Record<string, string> = {
    SECURITY_REVIEW: "المراجعة الأمنية قيد الإجراء",
    MEDICAL_BOOKING: "مطلوب حجز فحص النظر",
    MEDICAL_APPOINTMENT_BOOKED: "تم حجز فحص النظر",
    THEORY_BOOKING: "مطلوب حجز الامتحان النظري",
    THEORY_APPOINTMENT_BOOKED: "تم حجز الامتحان النظري",
    PRACTICAL_BOOKING: "مطلوب حجز الامتحان العملي",
    PRACTICAL_APPOINTMENT_BOOKED: "تم حجز الامتحان العملي",
    LICENSE_ISSUANCE: "بانتظار إصدار الرخصة",
    PRACTICAL_PASSED: "الرخصة قيد الإصدار",
    RENEWAL_ELIGIBILITY_CHECK: "فحص أهلية التجديد",
    RENEWAL_SUBMITTED: "حجز فحص النظر للتجديد",
    RENEWAL_MEDICAL_BOOKING: "حجز فحص النظر للتجديد",
    RENEWAL_MEDICAL_BOOKED: "تم حجز فحص النظر للتجديد",
    RENEWAL_MEDICAL_REJECTED: "لم تتم الموافقة الطبية على التجديد",
    RENEWAL_PAYMENT_PENDING: "بانتظار دفع رسوم التجديد",
    LICENSE_RENEWED: "عرض الرخصة المجددة",
    VEHICLE_ELIGIBILITY_CHECK: "فحص أهلية المركبة",
    INSURANCE_REQUIRED: "تأكيد التأمين",
    TECHNICAL_INSPECTION_REQUIRED: "إكمال الفحص الفني",
    VEHICLE_PAYMENT_PENDING: "دفع رسوم تجديد المركبة",
    VEHICLE_REGISTRATION_RENEWED: "عرض ترخيص المركبة",
  };
  const source = language === "ar" ? ar : en;
  return source[step ?? ""] ?? step?.replace(/_/g, " ") ?? "—";
}
