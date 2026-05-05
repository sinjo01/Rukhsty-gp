import { Switch, Route, Redirect } from "wouter";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

import Home from "@/pages/public/home";
import Login from "@/pages/public/login";
import Register from "@/pages/public/register";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/citizen/dashboard";
import Profile from "@/pages/citizen/profile";
import Services from "@/pages/citizen/services";
import ServiceIssueLicense from "@/pages/citizen/service-issue-license";
import Applications from "@/pages/citizen/applications";
import ApplicationDetail from "@/pages/citizen/application-detail";
import Appointments from "@/pages/citizen/appointments";
import LicenseCard from "@/pages/citizen/license-card";
import Notifications from "@/pages/citizen/notifications";

import OfficerDashboard from "@/pages/officer/officer-dashboard";
import OfficerAppointments from "@/pages/officer/officer-appointments";
import OfficerResults from "@/pages/officer/officer-results";

import AdminDashboard from "@/pages/admin/admin-dashboard";
import AdminApplications from "@/pages/admin/admin-applications";
import AdminUsers from "@/pages/admin/admin-users";
import AdminCenters from "@/pages/admin/admin-centers";

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (isAuthenticated && user) {
    if ((user as any).role === "ADMIN") return <Redirect to="/admin/dashboard" />;
    if ((user as any).role?.includes("OFFICER")) return <Redirect to="/officer/dashboard" />;
    return <Redirect to="/dashboard" />;
  }
  return <Component />;
}

function ProtectedRoute({ component: Component, allowedRoles = [], params }: { component: React.ComponentType<any>; allowedRoles?: string[]; params?: Record<string, string | undefined> }) {
  return (
    <AppShell requireAuth allowedRoles={allowedRoles}>
      <Component params={params} />
    </AppShell>
  );
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <Switch>
        {/* Public */}
        <Route path="/" component={() => <PublicRoute component={Home} />} />
        <Route path="/login" component={() => <PublicRoute component={Login} />} />
        <Route path="/register" component={() => <PublicRoute component={Register} />} />

        {/* Citizen */}
        <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} allowedRoles={["USER"]} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={Profile} allowedRoles={["USER"]} />} />
        <Route path="/services" component={() => <ProtectedRoute component={Services} allowedRoles={["USER"]} />} />
        <Route path="/services/issue-driving-license" component={() => <ProtectedRoute component={ServiceIssueLicense} allowedRoles={["USER"]} />} />
        <Route path="/applications" component={() => <ProtectedRoute component={Applications} allowedRoles={["USER"]} />} />
        <Route path="/applications/:id">
          {(params) => <ProtectedRoute component={ApplicationDetail} allowedRoles={["USER"]} params={params} />}
        </Route>
        <Route path="/appointments" component={() => <ProtectedRoute component={Appointments} allowedRoles={["USER"]} />} />
        <Route path="/license-card" component={() => <ProtectedRoute component={LicenseCard} allowedRoles={["USER"]} />} />
        <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} allowedRoles={["USER"]} />} />

        {/* Officer */}
        <Route path="/officer/dashboard" component={() => <ProtectedRoute component={OfficerDashboard} allowedRoles={["TRAINING_CENTER_OFFICER","MEDICAL_CENTER_OFFICER","THEORY_EXAM_OFFICER","PRACTICAL_EXAM_OFFICER","DVLD_OFFICER","ADMIN"]} />} />
        <Route path="/officer/appointments" component={() => <ProtectedRoute component={OfficerAppointments} allowedRoles={["TRAINING_CENTER_OFFICER","MEDICAL_CENTER_OFFICER","THEORY_EXAM_OFFICER","PRACTICAL_EXAM_OFFICER","DVLD_OFFICER","ADMIN"]} />} />
        <Route path="/officer/results" component={() => <ProtectedRoute component={OfficerResults} allowedRoles={["MEDICAL_CENTER_OFFICER","THEORY_EXAM_OFFICER","PRACTICAL_EXAM_OFFICER","ADMIN"]} />} />

        {/* Admin */}
        <Route path="/admin/dashboard" component={() => <ProtectedRoute component={AdminDashboard} allowedRoles={["ADMIN"]} />} />
        <Route path="/admin/applications" component={() => <ProtectedRoute component={AdminApplications} allowedRoles={["ADMIN"]} />} />
        <Route path="/admin/users" component={() => <ProtectedRoute component={AdminUsers} allowedRoles={["ADMIN"]} />} />
        <Route path="/admin/centers" component={() => <ProtectedRoute component={AdminCenters} allowedRoles={["ADMIN"]} />} />

        <Route component={NotFound} />
      </Switch>
    </AuthProvider>
  );
}
