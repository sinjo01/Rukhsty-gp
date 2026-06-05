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
  Users,
  Languages
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
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
    <div className="flex min-h-screen w-full bg-muted/40 dark:bg-background">
      {/* Sidebar */}
      <aside className={cn("w-64 bg-card/80 backdrop-blur-xl border-border hidden md:flex flex-col z-10", isRTL ? "border-l" : "border-r")}>
        <div className="h-16 flex items-center px-6 border-b border-border/70">
          <Link href="/">
            <Logo label={t("brandName")} markClassName="h-6 w-6" textClassName="text-lg" />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive =
              (location.startsWith(item.href) && item.href !== "/") || location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-primary to-[#13456e] text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <span
                      className={cn(
                        "absolute top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-accent",
                        isRTL ? "right-0 translate-x-1" : "left-0 -translate-x-1",
                      )}
                    />
                  )}
                  <item.icon
                    className={cn(
                      "w-5 h-5 shrink-0 transition-colors",
                      isActive ? "text-accent" : "text-muted-foreground group-hover:text-primary",
                    )}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border/70">
          <Button variant="ghost" className={cn("w-full rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive", isRTL ? "justify-end" : "justify-start")} onClick={handleLogout}>
            <LogOut className={cn("w-5 h-5", isRTL ? "ml-2" : "mr-2")} />
            {t("logout")}
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-16 bg-card/70 backdrop-blur-xl border-b border-border/70 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <div className="flex items-center md:hidden">
            <Link href="/">
              <Logo label={t("brandName")} markClassName="h-6 w-6" />
            </Link>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" className="h-9 rounded-full px-3 text-muted-foreground hover:text-foreground" onClick={toggleLanguage}>
              <Languages className="w-4 h-4" />
              <span className="ms-1.5">{t("languageToggle")}</span>
            </Button>
            <NotificationBell />

            <div className={cn("hidden sm:block h-8 w-px bg-border", isRTL ? "ms-1" : "me-1")} />

            <div className="flex items-center gap-3">
              <div className={cn("hidden sm:block", isRTL ? "text-left" : "text-right")}>
                <p className="text-sm font-semibold leading-none">{user?.profile?.firstName || user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{user?.role?.toLowerCase().replace(/_/g, " ")}</p>
              </div>
              <div className="rounded-full bg-gradient-to-br from-primary to-accent p-[2px] shadow-sm">
                <Avatar className="w-9 h-9 border-2 border-card">
                  <AvatarImage src={user?.profile?.personalPhotoUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {user?.profile?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
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
