import { useGetMyLicense, getGetMyLicenseQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Shield, CreditCard, Calendar, User, Hash, Link } from "lucide-react";
import { Link as RouterLink } from "wouter";

export default function LicenseCard() {
  const { data: license, isLoading } = useGetMyLicense({ query: { queryKey: getGetMyLicenseQueryKey() } });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-56 rounded-2xl" /></div>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Digital License</h1>
        <p className="text-muted-foreground text-sm mt-1">رخصة القيادة الرقمية</p>
      </motion.div>

      {!license ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">No License Yet</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
            Complete your driving license application to receive your digital license card.
          </p>
          <RouterLink href="/services/issue-driving-license">
            <Button className="mt-6">Start Application</Button>
          </RouterLink>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          {/* License Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#0f1c3f] via-[#1a2f6b] to-[#0d3b8e] text-white aspect-[1.6/1]">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/4" />
            </div>

            <div className="relative z-10 p-6 h-full flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-5 h-5 text-blue-300" />
                    <span className="text-xs font-bold text-blue-200 tracking-widest uppercase">Jordan</span>
                  </div>
                  <p className="text-xs text-blue-200 font-medium">Driving License · رخصة قيادة</p>
                </div>
                <Badge className={`text-xs ${(license as any).status === "ACTIVE" ? "bg-green-400/20 text-green-200 border-green-400/40" : "bg-red-400/20 text-red-200 border-red-400/40"}`}>
                  {(license as any).status}
                </Badge>
              </div>

              {/* Main info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {(license as any).photoUrl ? (
                      <img src={(license as any).photoUrl} alt="photo" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-blue-200" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-tight">{(license as any).fullNameEn ?? "Name"}</p>
                    <p className="text-sm text-blue-200" dir="rtl">{(license as any).fullNameAr}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-3">
                  <div className="flex items-center gap-1.5 text-blue-200">
                    <Hash className="w-3 h-3" />
                    <span className="font-mono">{(license as any).licenseNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-200">
                    <User className="w-3 h-3" />
                    <span className="font-mono">{(license as any).nationalId}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-200">
                    <Calendar className="w-3 h-3" />
                    <span>Issued: {(license as any).issueDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-200">
                    <Calendar className="w-3 h-3" />
                    <span>Expires: {(license as any).expiryDate}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-end justify-between">
                {(license as any).licenseCategory && (
                  <div className="bg-white/10 rounded-lg px-3 py-1.5">
                    <p className="text-xs text-blue-200">Category</p>
                    <p className="font-bold text-sm">{(license as any).licenseCategory?.code ?? "—"}</p>
                  </div>
                )}
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-xs text-slate-800 font-mono font-bold">
                  QR
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">This is a digital representation of your driving license. Present this along with your physical ID when required.</p>
        </motion.div>
      )}
    </div>
  );
}
