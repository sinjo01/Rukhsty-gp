import { Link } from "wouter";
import { Shield, ChevronRight, FileText, Activity, Stethoscope, CarFront, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col font-sans">
      {/* Navbar */}
      <header className="h-16 border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="w-6 h-6" />
            <span className="font-bold text-xl tracking-tight">Rukhsty | رخصتي</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground hidden sm:inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
              For Demo Only
            </span>
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link href="/register" className="text-sm font-medium">
              <Button size="sm" className="rounded-full px-5">Register</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 -z-10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-6" dir="rtl">
                رخصتك أسهل، أسرع، وأوضح
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                The premium digital platform for driving licensing in Jordan. Track your progress, book appointments, and manage your documents with complete transparency.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="rounded-full px-8 text-base h-12 w-full sm:w-auto group">
                    Start Your Application
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="rounded-full px-8 text-base h-12 w-full sm:w-auto">
                    Track Existing Application
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-24 max-w-4xl mx-auto"
            >
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">The Process</h3>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                {[
                  { icon: FileText, label: "Register" },
                  { icon: FileText, label: "Documents" },
                  { icon: Activity, label: "Training" },
                  { icon: Stethoscope, label: "Medical" },
                  { icon: FileText, label: "Theory Exam" },
                  { icon: CarFront, label: "Practical Exam" },
                  { icon: CheckCircle, label: "License Issued" },
                ].map((step, i, arr) => (
                  <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center gap-2 w-24">
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary relative z-10">
                        <step.icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-center text-muted-foreground">{step.label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 -mx-3 relative z-0 hidden sm:block" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

      </main>

      <footer className="bg-white dark:bg-slate-900 border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-primary opacity-50">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">Rukhsty</span>
          </div>
          <p className="text-sm text-muted-foreground">
            A fictional demonstration application. Not affiliated with the Jordanian government.
          </p>
        </div>
      </footer>
    </div>
  );
}
