import type { Language } from "@/lib/i18n";

const labels: Record<string, [string, string]> = {
  USER: ["User", "مستخدم"],
  ADMIN: ["Administrator", "مسؤول النظام"],
  SECURITY_OFFICER: ["Security officer", "موظف المراجعة الأمنية"],
  TRAINING_CENTER_OFFICER: ["Training center officer", "موظف مركز التدريب"],
  MEDICAL_CENTER_OFFICER: ["Medical center officer", "موظف المركز الطبي"],
  THEORY_EXAM_OFFICER: ["Theory exam officer", "موظف الامتحان النظري"],
  PRACTICAL_EXAM_OFFICER: ["Practical exam officer", "موظف الامتحان العملي"],
  DVLD_OFFICER: ["Licensing officer", "موظف الترخيص"],
  DRAFT: ["Draft", "مسودة"],
  PROFILE_SUBMITTED: ["Profile submitted", "تم تقديم الملف الشخصي"],
  SECURITY_REVIEW: ["Security review", "المراجعة الأمنية"],
  SECURITY_APPROVED: ["Security approved", "تمت الموافقة الأمنية"],
  SECURITY_REJECTED: ["Security rejected", "مرفوض أمنياً"],
  MEDICAL_BOOKING: ["Medical booking", "حجز الفحص الطبي"],
  MEDICAL_APPOINTMENT_BOOKED: ["Medical appointment booked", "تم حجز الفحص الطبي"],
  MEDICAL_PASSED: ["Medical test passed", "تم اجتياز الفحص الطبي"],
  THEORY_BOOKING: ["Theory exam booking", "حجز الامتحان النظري"],
  THEORY_APPOINTMENT_BOOKED: ["Theory exam booked", "تم حجز الامتحان النظري"],
  THEORY_PASSED: ["Theory exam passed", "تم اجتياز الامتحان النظري"],
  PRACTICAL_BOOKING: ["Practical exam booking", "حجز الامتحان العملي"],
  PRACTICAL_APPOINTMENT_BOOKED: ["Practical exam booked", "تم حجز الامتحان العملي"],
  PRACTICAL_PASSED: ["Practical exam passed", "تم اجتياز الامتحان العملي"],
  LICENSE_ISSUANCE: ["License issuance", "إصدار الرخصة"],
  LICENSE_ISSUED: ["License issued", "تم إصدار الرخصة"],
  REJECTED: ["Rejected", "مرفوض"],
  BOOKED: ["Booked", "محجوز"],
  CHECKED_IN: ["Checked in", "تم تسجيل الحضور"],
  COMPLETED: ["Completed", "مكتمل"],
  NO_SHOW: ["No show", "لم يحضر"],
  CANCELLED: ["Cancelled", "ملغي"],
  PASSED: ["Passed", "ناجح"],
  FAILED: ["Failed", "راسب"],
  APPROVED: ["Approved", "مقبول"],
  PENDING: ["Pending", "قيد الانتظار"],
  IN_PROGRESS: ["In progress", "قيد التنفيذ"],
  DOES_NOT_NEED_GLASSES: ["Does not need glasses", "لا يحتاج إلى نظارة"],
  NEEDS_GLASSES: ["Needs glasses", "يحتاج إلى نظارة"],
  PASS_NO_GLASSES: ["Passed without glasses", "ناجح دون نظارة"],
  PASS_WITH_GLASSES: ["Passed with glasses", "ناجح مع نظارة"],
  NOT_FIT_TO_DRIVE: ["Not fit to drive", "غير مؤهل للقيادة"],
  TRAINING: ["Training", "تدريب"],
  MEDICAL: ["Medical", "طبي"],
  THEORY_EXAM: ["Theory exam", "امتحان نظري"],
  PRACTICAL_EXAM: ["Practical exam", "امتحان عملي"],
  DVLD: ["Licensing", "ترخيص"],
  MEDICAL_TEST: ["Medical / vision test", "فحص طبي / نظر"],
  THEORY_TEST: ["Theory exam", "امتحان نظري"],
  PRACTICAL_TEST: ["Practical exam", "امتحان عملي"],
};

const governorates: Record<string, string> = {
  Amman: "عمّان",
  Irbid: "إربد",
  Zarqa: "الزرقاء",
  Balqa: "البلقاء",
  Madaba: "مادبا",
  Karak: "الكرك",
  Tafileh: "الطفيلة",
  "Ma'an": "معان",
  Aqaba: "العقبة",
  Jerash: "جرش",
  Ajloun: "عجلون",
  Mafraq: "المفرق",
};

export function localizedLabel(value: string | null | undefined, language: Language) {
  if (!value) return "—";
  const pair = labels[value];
  if (pair) return pair[language === "ar" ? 1 : 0];
  return value.replace(/_/g, " ");
}

export function localizedGovernorate(value: string | null | undefined, language: Language) {
  if (!value) return "—";
  return language === "ar" ? governorates[value] ?? value : value;
}
