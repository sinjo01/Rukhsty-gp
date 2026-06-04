import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Redirect, Link, useLocation } from "wouter";
import { 
  Shield, 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  User as UserIcon, 
  CreditCard,
  Settings,
  Bell,
  LogOut,
  Building2,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLogout, useListNotifications } from "@workspace/api-client-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function AppShell({ children, requireAuth = true, allowedRoles = [] }: { children: ReactNode, requireAuth?: boolean, allowedRoles?: string[] }) {
  const { user, isLoading, isAuthenticated, logout: contextLogout } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const { isRTL, t, toggleLanguage } = useLanguage();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">{t("loading")}</div>;
  }

  if (requireAuth && !isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (requireAuth && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <div className="min-h-screen flex items-center justify-center">{t("unauthorized")}</div>;
  }

  if (!requireAuth && !isAuthenticated) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      console.error(e);
    } finally {
      contextLogout();
    }
  };

  const getNavItems = () => {
    if (!user) return [];
    
    if (user.role === "ADMIN") {
      return [
        { label: t("dashboard"), href: "/admin/dashboard", icon: LayoutDashboard },
        { label: t("applications"), href: "/admin/applications", icon: FileText },
        { label: t("users"), href: "/admin/users", icon: Users },
        { label: t("centers"), href: "/admin/centers", icon: Building2 },
      ];
    }

    if (user.role === "SECURITY_OFFICER") {
      return [
        { label: isRTL ? "المراجعة الأمنية" : "Security Review", href: "/security/review", icon: Shield },
      ];
    }
    
    if (user.role.includes("OFFICER")) {
      return [
        { label: t("dashboard"), href: "/officer/dashboard", icon: LayoutDashboard },
        { label: t("appointments"), href: "/officer/appointments", icon: Calendar },
        { label: t("results"), href: "/officer/results", icon: FileText },
      ];
    }
    
    // Default Citizen
    return [
      { label: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
      { label: t("services"), href: "/services", icon: Settings },
      { label: t("applications"), href: "/applications", icon: FileText },
      { label: t("appointments"), href: "/appointments", icon: Calendar },
      { label: t("myLicense"), href: "/my-license", icon: CreditCard },
      { label: t("profile"), href: "/profile", icon: UserIcon },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-background">
      {/* Sidebar */}
      <aside className={cn("w-64 bg-card border-border hidden md:flex flex-col shadow-sm z-10", isRTL ? "border-l" : "border-r")}>
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <Shield className="w-6 h-6" />
            <span className="font-bold text-lg">{t("brandName")}</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                location.startsWith(item.href) && item.href !== '/' || location === item.href 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground"
              }`}>
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
          <div className="p-4 border-t border-border">
          <Button variant="ghost" className={cn("w-full text-muted-foreground hover:text-destructive", isRTL ? "justify-end" : "justify-start")} onClick={handleLogout}>
            <LogOut className={cn("w-5 h-5", isRTL ? "ml-2" : "mr-2")} />
            {t("logout")}
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center md:hidden">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <Shield className="w-6 h-6" />
              <span className="font-bold">{t("brandName")}</span>
            </Link>
          </div>
          
          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="h-8 px-3" onClick={toggleLanguage}>
              {t("languageToggle")}
            </Button>
            <NotificationBell />
            
            <div className="flex items-center gap-3">
              <div className={cn("hidden sm:block", isRTL ? "text-left" : "text-right")}>
                <p className="text-sm font-medium leading-none">{user?.profile?.firstName || user?.email}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
              <Avatar className="w-9 h-9 border border-primary/20">
                <AvatarImage src={user?.profile?.personalPhotoUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {user?.profile?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NotificationBell() {
  const { data: notifications } = useListNotifications();
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <Link href="/notifications">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
        )}
      </Button>
    </Link>
  );
}
