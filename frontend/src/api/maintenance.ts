import { api, apiFormData } from "./client";

export interface Maintenance {
  id: number;
  vehicle_id: number;
  type: string;
  date: string;
  mileage: number | null;
  cost: number | null;
  shop_name: string | null;
  notes: string | null;
  receipt_path: string | null;
  created_at: string | null;
}

export interface MaintenanceCreate {
  type: string;
  date: string;
  mileage?: number | null;
  cost?: number | null;
  shop_name?: string | null;
  notes?: string | null;
}

export interface MaintenanceUpdate {
  type?: string;
  date?: string;
  mileage?: number | null;
  cost?: number | null;
  shop_name?: string | null;
  notes?: string | null;
}

export async function listMaintenance(vehicleId: number): Promise<Maintenance[]> {
  return api<Maintenance[]>(`/vehicles/${vehicleId}/maintenance`);
}

export async function createMaintenance(vehicleId: number, data: MaintenanceCreate): Promise<Maintenance> {
  return api<Maintenance>(`/vehicles/${vehicleId}/maintenance`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMaintenance(
  vehicleId: number,
  id: number,
  data: MaintenanceUpdate
): Promise<Maintenance> {
  return api<Maintenance>(`/vehicles/${vehicleId}/maintenance/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteMaintenance(vehicleId: number, id: number): Promise<void> {
  return api<void>(`/vehicles/${vehicleId}/maintenance/${id}`, { method: "DELETE" });
}

export async function uploadMaintenanceReceipt(
  vehicleId: number,
  maintenanceId: number,
  file: File
): Promise<Maintenance> {
  const form = new FormData();
  form.append("file", file);
  return apiFormData<Maintenance>(
    `/vehicles/${vehicleId}/maintenance/${maintenanceId}/receipt`,
    form
  );
}
