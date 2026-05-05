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

export function AppShell({ children, requireAuth = true, allowedRoles = [] }: { children: ReactNode, requireAuth?: boolean, allowedRoles?: string[] }) {
  const { user, isLoading, isAuthenticated, logout: contextLogout } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (requireAuth && !isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (requireAuth && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <div className="min-h-screen flex items-center justify-center">Unauthorized access</div>;
  }

  if (!requireAuth && !isAuthenticated) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync({});
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
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Applications", href: "/admin/applications", icon: FileText },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Centers", href: "/admin/centers", icon: Building2 },
      ];
    }
    
    if (user.role.includes("OFFICER")) {
      return [
        { label: "Dashboard", href: "/officer/dashboard", icon: LayoutDashboard },
        { label: "Appointments", href: "/officer/appointments", icon: Calendar },
        { label: "Results", href: "/officer/results", icon: FileText },
      ];
    }
    
    // Default Citizen
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Services", href: "/services", icon: Settings },
      { label: "Applications", href: "/applications", icon: FileText },
      { label: "Appointments", href: "/appointments", icon: Calendar },
      { label: "My License", href: "/license-card", icon: CreditCard },
      { label: "Profile", href: "/profile", icon: UserIcon },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-background" dir="ltr">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col shadow-sm z-10">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <Shield className="w-6 h-6" />
            <span className="font-bold text-lg">Rukhsty | رخصتي</span>
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
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout}>
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center md:hidden">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <Shield className="w-6 h-6" />
              <span className="font-bold">Rukhsty</span>
            </Link>
          </div>
          
          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <NotificationBell />
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
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
