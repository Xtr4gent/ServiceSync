import { api } from "./client";

export interface Mod {
  id: number;
  vehicle_id: number;
  name: string;
  description: string | null;
  date: string;
  cost: number | null;
  parts_list: string | null;
  created_at: string | null;
}

export interface ModCreate {
  name: string;
  description?: string | null;
  date: string;
  cost?: number | null;
  parts_list?: string | null;
}

export interface ModUpdate {
  name?: string;
  description?: string | null;
  date?: string;
  cost?: number | null;
  parts_list?: string | null;
}

export async function listMods(vehicleId: number): Promise<Mod[]> {
  return api<Mod[]>(`/vehicles/${vehicleId}/mods`);
}

export async function createMod(vehicleId: number, data: ModCreate): Promise<Mod> {
  return api<Mod>(`/vehicles/${vehicleId}/mods`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMod(
  vehicleId: number,
  id: number,
  data: ModUpdate
): Promise<Mod> {
  return api<Mod>(`/vehicles/${vehicleId}/mods/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteMod(vehicleId: number, id: number): Promise<void> {
  return api<void>(`/vehicles/${vehicleId}/mods/${id}`, { method: "DELETE" });
}
