import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getVehicle,
  createVehicle,
  updateVehicle,
  uploadVehiclePhoto,
  type Vehicle,
  type VehicleCreate,
} from "../api/vehicles";

export default function VehicleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  // On /vehicles/new there is no :id param (id is undefined); only treat as edit when we have a numeric id
  const isEdit = Boolean(id && id !== "new" && !Number.isNaN(Number(id)));
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState<VehicleCreate & { id?: number }>({
    nickname: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    vin: "",
    license_plate: "",
    current_mileage: null,
  });

  useEffect(() => {
    if (!isEdit || id == null) return;
    const numId = Number(id);
    if (Number.isNaN(numId)) return;
    getVehicle(numId)
      .then((v) => {
        setForm({
          id: v.id,
          nickname: v.nickname ?? "",
          make: v.make,
          model: v.model,
          year: v.year,
          vin: v.vin ?? "",
          license_plate: v.license_plate ?? "",
          current_mileage: v.current_mileage ?? null,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        nickname: form.nickname || null,
        make: form.make,
        model: form.model,
        year: form.year,
        vin: form.vin || null,
        license_plate: form.license_plate || null,
        current_mileage: form.current_mileage ?? null,
      };
      let vehicle: Vehicle;
      if (isEdit) {
        vehicle = await updateVehicle(Number(id), payload);
      } else {
        vehicle = await createVehicle(payload);
      }
      if (photoFile) {
        await uploadVehiclePhoto(vehicle.id, photoFile);
      }
      navigate(`/vehicles/${vehicle.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-8 text-garage-600">Loading…</p>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-200 mb-6">
        {isEdit ? "Edit vehicle" : "Add vehicle"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Nickname</label>
          <input
            type="text"
            value={form.nickname ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="e.g. Daily"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Make *</label>
            <input
              type="text"
              value={form.make}
              onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Model *</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Year *</label>
            <input
              type="number"
              min={1900}
              max={2100}
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: parseInt(e.target.value, 10) || 0 }))}
              className="w-full px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Current mileage</label>
            <input
              type="number"
              min={0}
              step={1}
              value={form.current_mileage ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  current_mileage: e.target.value ? parseFloat(e.target.value) : null,
                }))
              }
              className="w-full px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="0"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">VIN</label>
            <input
              type="text"
              value={form.vin ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, vin: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">License plate</label>
            <input
              type="text"
              value={form.license_plate ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, license_plate: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-garage-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-garage-700 file:text-slate-200"
          />
        </div>
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-amber-500 text-garage-950 font-medium hover:bg-amber-400 disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Save" : "Add vehicle"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-garage-700 text-slate-300 hover:bg-garage-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
