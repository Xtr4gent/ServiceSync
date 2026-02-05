import { api, apiFormData, uploadsUrl } from "./client";

export interface Vehicle {
  id: number;
  nickname: string | null;
  make: string;
  model: string;
  trim: string | null;
  year: number;
  vin: string | null;
  license_plate: string | null;
  current_mileage: number | null;
  photo_path: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface VehicleCreate {
  nickname?: string | null;
  make: string;
  model: string;
  trim?: string | null;
  year: number;
  vin?: string | null;
  license_plate?: string | null;
  current_mileage?: number | null;
  photo_path?: string | null;
}

export interface VehicleUpdate {
  nickname?: string | null;
  make?: string;
  model?: string;
  trim?: string | null;
  year?: number;
  vin?: string | null;
  license_plate?: string | null;
  current_mileage?: number | null;
  photo_path?: string | null;
}

export async function listVehicles(): Promise<Vehicle[]> {
  return api<Vehicle[]>("/vehicles");
}

export async function getVehicle(id: number): Promise<Vehicle> {
  return api<Vehicle>(`/vehicles/${id}`);
}

export async function createVehicle(data: VehicleCreate): Promise<Vehicle> {
  return api<Vehicle>("/vehicles", { method: "POST", body: JSON.stringify(data) });
}

export async function updateVehicle(id: number, data: VehicleUpdate): Promise<Vehicle> {
  return api<Vehicle>(`/vehicles/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteVehicle(id: number): Promise<void> {
  return api<void>(`/vehicles/${id}`, { method: "DELETE" });
}

export async function uploadVehiclePhoto(vehicleId: number, file: File): Promise<Vehicle> {
  const form = new FormData();
  form.append("file", file);
  return apiFormData<Vehicle>(`/vehicles/${vehicleId}/photo`, form);
}

export { uploadsUrl };
