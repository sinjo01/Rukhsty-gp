import { useMemo } from "react";
import { useLocation } from "wouter";
import {
  getListApplicationsQueryKey,
  getListServicesQueryKey,
  getGetMyLicenseQueryKey,
  useCreateApplication,
  useGetMyLicense,
  useListServices,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, CreditCard, FileCheck2, ShieldAlert } from "lucide-react";

export default function ServiceRenewDrivingLicense() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: license, isLoading: licenseLoading, isError: licenseMissing } = useGetMyLicense({ query: { queryKey: getGetMyLicenseQueryKey(), retry: false } });
  const { data: services } = useListServices({ query: { queryKey: getListServicesQueryKey() } });
  const createApplication = useCreateApplication();

  const service = useMemo(() => services?.find((item) => item.code === "RENEW_DRIVING_LICENSE"), [services]);

  const handleSubmit = async () => {
    if (!service) {
      toast({ variant: "destructive", title: "Renewal service is not available" });
      return;
    }

    try {
      const app = await createApplication.mutateAsync({
        data: {
          serviceId: service.id,
          licenseCategoryId: (license as any)?.licenseCategoryId ?? undefined,
          governorate: user?.profile?.governorate ?? "Amman",
          residenceArea: user?.profile?.area ?? user?.profile?.city ?? "Amman",
        },
      });
      queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
      toast({ title: "Renewal application submitted", description: "Your request is now ready for review." });
      setLocation(`/applications/${app.id}`);
    } catch (error) {
      toast({ variant: "destructive", title: "Could not submit renewal", description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  if (licenseLoading) {
    return <div className="max-w-2xl mx-auto space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-52" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Renew Driving License</h1>
        <p className="text-muted-foreground text-sm mt-1" dir="rtl">تجديد رخصة القيادة</p>
      </div>

      {licenseMissing || !license ? (
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>No active license found</AlertTitle>
          <AlertDescription>
            A driving license renewal requires an existing license. Start a new license application first.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" />Current License</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              <Info label="License number" value={(license as any).licenseNumber} />
              <Info label="Status" value={(license as any).status} />
              <Info label="Issued" value={(license as any).issueDate} />
              <Info label="Expires" value={(license as any).expiryDate} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileCheck2 className="w-4 h-4 text-primary" />Confirmation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Confirm your profile and license details, then submit a renewal request. The application will appear in your applications list for status tracking.
              </p>
              <Button className="w-full gap-2" onClick={handleSubmit} disabled={createApplication.isPending}>
                <BadgeCheck className="w-4 h-4" />
                {createApplication.isPending ? "Submitting..." : "Submit Renewal Application"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? "-"}</p>
    </div>
  );
}
