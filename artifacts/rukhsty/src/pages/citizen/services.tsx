import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CreditCard, RefreshCw, Car, ArrowRight } from "lucide-react";

const SERVICES = [
  {
    icon: CreditCard,
    title: "Issue Driving License",
    titleAr: "استخراج رخصة قيادة جديدة",
    description: "Apply for a brand new Jordanian driving license. Complete training, medical, theory, and practical exams.",
    href: "/services/issue-driving-license",
    color: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    available: true,
  },
  {
    icon: RefreshCw,
    title: "Renew Driving License",
    titleAr: "تجديد رخصة القيادة",
    description: "Renew your existing driving license before it expires. Simple process with minimal requirements.",
    href: "#",
    color: "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400",
    available: false,
  },
  {
    icon: Car,
    title: "Renew Vehicle Registration",
    titleAr: "تجديد تسجيل مركبة",
    description: "Renew your vehicle registration online quickly and securely.",
    href: "#",
    color: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
    available: false,
  },
];

export default function Services() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Services</h1>
        <p className="text-muted-foreground text-sm mt-1">Choose a service to get started</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {SERVICES.map((svc, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={`h-full flex flex-col ${svc.available ? "hover:border-primary/40 hover:shadow-lg transition-all" : "opacity-60"}`}>
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl ${svc.color} flex items-center justify-center mb-2`}>
                  <svc.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-base">{svc.title}</CardTitle>
                <p className="text-xs text-muted-foreground" dir="rtl">{svc.titleAr}</p>
                <CardDescription className="text-sm mt-2">{svc.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                {svc.available ? (
                  <Link href={svc.href}>
                    <Button className="w-full gap-2">
                      Start Application <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="w-full">Coming Soon</Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
