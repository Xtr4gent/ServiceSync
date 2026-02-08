import { api } from "./client";

export interface VehicleStats {
  vehicle_id: number;
  nickname: string | null;
  make: string;
  model: string;
  year: number;
  maintenance_service_count: number;
  maintenance_total_cost: number;
  maintenance_average_cost: number;
  mods_count: number;
  mods_total_cost: number;
  mods_average_cost: number;
}

export interface DashboardStats {
  year: number;
  maintenance: {
    total_cost: number;
    total_services: number;
    average_cost_per_service: number;
  };
  mods: {
    total_cost: number;
    total_count: number;
    average_cost_per_mod: number;
  };
  by_vehicle: VehicleStats[];
}

export async function getDashboardStats(year?: number): Promise<DashboardStats> {
  const params = year != null ? `?year=${year}` : "";
  return api<DashboardStats>(`/dashboard/stats${params}`);
}
