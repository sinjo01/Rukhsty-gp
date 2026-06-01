import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  getListApplicationsQueryKey,
  getListServicesQueryKey,
  getListVehiclesQueryKey,
  useAddVehicle,
  useCreateApplication,
  useListServices,
  useListVehicles,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, CheckCircle2, Plus } from "lucide-react";

export default function ServiceRenewVehicleRegistration() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicleForm, setVehicleForm] = useState({ plateNumber: "", registrationNumber: "", vehicleType: "Private", brand: "", model: "" });

  const { data: vehicles, isLoading } = useListVehicles({ query: { queryKey: getListVehiclesQueryKey() } });
  const { data: services } = useListServices({ query: { queryKey: getListServicesQueryKey() } });
  const addVehicle = useAddVehicle();
  const createApplication = useCreateApplication();
  const service = useMemo(() => services?.find((item) => item.code === "RENEW_VEHICLE_REGISTRATION"), [services]);

  const handleAddVehicle = async () => {
    if (!vehicleForm.plateNumber.trim()) {
      toast({ variant: "destructive", title: "Plate number is required" });
      return;
    }
    try {
      const vehicle = await addVehicle.mutateAsync({ data: vehicleForm });
      setSelectedVehicleId(vehicle.id);
      queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() });
      toast({ title: "Vehicle added" });
    } catch (error) {
      toast({ variant: "destructive", title: "Could not add vehicle", description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const handleSubmit = async () => {
    if (!service || !selectedVehicleId) {
      toast({ variant: "destructive", title: "Select a vehicle first" });
      return;
    }
    try {
      const app = await createApplication.mutateAsync({
        data: {
          serviceId: service.id,
          governorate: user?.profile?.governorate ?? "Amman",
          residenceArea: user?.profile?.area ?? user?.profile?.city ?? "Amman",
        },
      });
      queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
      toast({ title: "Vehicle renewal submitted", description: "Track the renewal from your applications page." });
      setLocation(`/applications/${app.id}`);
    } catch (error) {
      toast({ variant: "destructive", title: "Could not submit renewal", description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Renew Vehicle Registration</h1>
        <p className="text-muted-foreground text-sm mt-1" dir="rtl">تجديد تسجيل مركبة</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Car className="w-4 h-4 text-primary" />Select Vehicle</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-28" /> : (
            <RadioGroup value={selectedVehicleId} onValueChange={setSelectedVehicleId} className="grid gap-3">
              {vehicles?.map((vehicle) => (
                <Label key={vehicle.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:border-primary/50">
                  <RadioGroupItem value={vehicle.id} />
                  <div>
                    <p className="font-medium">{vehicle.plateNumber}</p>
                    <p className="text-xs text-muted-foreground">{[vehicle.brand, vehicle.model, vehicle.vehicleType].filter(Boolean).join(" ") || "Vehicle"}</p>
                  </div>
                </Label>
              ))}
              {!vehicles?.length && <p className="text-sm text-muted-foreground">No vehicles found. Add one below to continue.</p>}
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="w-4 h-4 text-primary" />Add Vehicle</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Plate number" value={vehicleForm.plateNumber} onChange={(event) => setVehicleForm((form) => ({ ...form, plateNumber: event.target.value }))} />
          <Input placeholder="Registration number" value={vehicleForm.registrationNumber} onChange={(event) => setVehicleForm((form) => ({ ...form, registrationNumber: event.target.value }))} />
          <Input placeholder="Brand" value={vehicleForm.brand} onChange={(event) => setVehicleForm((form) => ({ ...form, brand: event.target.value }))} />
          <Input placeholder="Model" value={vehicleForm.model} onChange={(event) => setVehicleForm((form) => ({ ...form, model: event.target.value }))} />
          <Button variant="outline" className="sm:col-span-2" onClick={handleAddVehicle} disabled={addVehicle.isPending}>
            {addVehicle.isPending ? "Adding..." : "Add Vehicle"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Submit Renewal</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Confirm the selected vehicle and create a renewal application for status tracking.</p>
          <Button className="w-full gap-2" onClick={handleSubmit} disabled={!selectedVehicleId || createApplication.isPending}>
            <CheckCircle2 className="w-4 h-4" />
            {createApplication.isPending ? "Submitting..." : "Submit Vehicle Renewal"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
