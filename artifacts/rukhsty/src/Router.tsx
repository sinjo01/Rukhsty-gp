import { AppShell } from "@/components/layout/AppShell";
import { Switch, Route, Redirect } from "wouter";
import Home from "@/pages/public/home";
import Login from "@/pages/public/login";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/lib/auth";

// Auth wrapper
function ProtectedRoute({ component: Component, allowedRoles = [] }: { component: any, allowedRoles?: string[] }) {
  return <AppShell requireAuth={true} allowedRoles={allowedRoles}><Component /></AppShell>;
}

// Public only wrapper (redirects if logged in)
function PublicRoute({ component: Component }: { component: any }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  if (isAuthenticated && user) {
    if (user.role === "ADMIN") return <Redirect to="/admin/dashboard" />;
    if (user.role.includes("OFFICER")) return <Redirect to="/officer/dashboard" />;
    return <Redirect to="/dashboard" />;
  }
  
  return <Component />;
}

// Temporary Placeholders
const Register = () => <div className="p-8 text-center text-xl">Register Page Placeholder</div>;
const Dashboard = () => <div className="p-8 text-center text-xl">Dashboard Page Placeholder</div>;

export default function AppRouter() {
  return (
    <AuthProvider>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={() => <PublicRoute component={Home} />} />
        <Route path="/login" component={() => <PublicRoute component={Login} />} />
        <Route path="/register" component={() => <PublicRoute component={Register} />} />

        {/* Citizen Routes */}
        <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
        
        <Route component={NotFound} />
      </Switch>
    </AuthProvider>
  );
}
