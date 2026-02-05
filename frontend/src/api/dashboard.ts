import { api } from "./client";

export interface VehicleStats {
  vehicle_id: number;
  nickname: string | null;
  make: string;
  model: string;
  year: number;
  service_count: number;
  total_cost: number;
  average_cost: number;
}

export interface DashboardStats {
  year: number;
  total_cost: number;
  total_services: number;
  average_cost_per_service: number;
  by_vehicle: VehicleStats[];
}

export async function getDashboardStats(year?: number): Promise<DashboardStats> {
  const params = year != null ? `?year=${year}` : "";
  return api<DashboardStats>(`/dashboard/stats${params}`);
}
