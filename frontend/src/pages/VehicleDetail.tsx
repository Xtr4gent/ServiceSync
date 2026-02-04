import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getVehicle,
  uploadVehiclePhoto,
  uploadsUrl,
  deleteVehicle,
  type Vehicle,
} from "../api/vehicles";
import {
  listMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  uploadMaintenanceReceipt,
  type Maintenance,
  type MaintenanceCreate,
} from "../api/maintenance";
import {
  listMods,
  createMod,
  updateMod,
  deleteMod,
  type Mod,
  type ModCreate,
} from "../api/mods";

function formatDate(s: string) {
  return new Date(s).toLocaleDateString();
}

function formatMoney(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [mods, setMods] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"maintenance" | "mods">("maintenance");
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceCreate | null>(null);
  const [modForm, setModForm] = useState<ModCreate | null>(null);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [editingMod, setEditingMod] = useState<Mod | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [receiptFile, setReceiptFile] = useState<{ maintenanceId: number; file: File } | null>(null);

  const vehicleId = Number(id);

  function load() {
    if (!vehicleId) return;
    Promise.all([
      getVehicle(vehicleId),
      listMaintenance(vehicleId),
      listMods(vehicleId),
    ])
      .then(([v, m, mod]) => {
        setVehicle(v);
        setMaintenance(m);
        setMods(mod);
      })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [vehicleId]);

  async function handlePhotoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicle || !photoFile) return;
    try {
      const v = await uploadVehiclePhoto(vehicle.id, photoFile);
      setVehicle(v);
      setPhotoFile(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function handleMaintenanceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!maintenanceForm) return;
    try {
      await createMaintenance(vehicleId, maintenanceForm);
      setMaintenanceForm(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleMaintenanceUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMaintenance) return;
    try {
      await updateMaintenance(vehicleId, editingMaintenance.id, {
        type: editingMaintenance.type,
        date: editingMaintenance.date,
        mileage: editingMaintenance.mileage,
        cost: editingMaintenance.cost,
        shop_name: editingMaintenance.shop_name,
        notes: editingMaintenance.notes,
      });
      setEditingMaintenance(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleModSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!modForm) return;
    try {
      await createMod(vehicleId, modForm);
      setModForm(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleModUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMod) return;
    try {
      await updateMod(vehicleId, editingMod.id, {
        name: editingMod.name,
        description: editingMod.description,
        date: editingMod.date,
        cost: editingMod.cost,
        parts_list: editingMod.parts_list,
      });
      setEditingMod(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleDeleteVehicle() {
    if (!vehicle || !confirm("Delete this vehicle and all its maintenance/mod records?")) return;
    try {
      await deleteVehicle(vehicle.id);
      navigate("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleReceiptUpload(m: Maintenance) {
    if (!receiptFile || receiptFile.maintenanceId !== m.id) return;
    try {
      await uploadMaintenanceReceipt(vehicleId, m.id, receiptFile.file);
      setReceiptFile(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    }
  }

  if (loading || !vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center text-garage-600">
        Loading…
      </div>
    );
  }

  const title = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <div className="min-h-screen bg-garage-950">
      <header className="border-b border-garage-800 bg-garage-900/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-amber-400 font-bold tracking-tight hover:text-amber-300">
              Garage Fleet
            </Link>
            <span className="text-garage-600">/</span>
            <span className="text-slate-300 font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to={`/vehicles/${vehicle.id}/edit`}
              className="text-sm text-garage-500 hover:text-slate-300"
            >
              Edit
            </Link>
            <span className="text-sm text-garage-600">{user?.username}</span>
            <button onClick={logout} className="text-sm text-garage-500 hover:text-slate-300">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="flex-shrink-0">
            <div className="w-64 h-48 rounded-xl bg-garage-800 overflow-hidden flex items-center justify-center">
              {vehicle.photo_path ? (
                <img
                  src={uploadsUrl(vehicle.photo_path)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl text-garage-600">🚗</span>
              )}
            </div>
            <form onSubmit={handlePhotoSubmit} className="mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="text-sm text-garage-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-garage-700 file:text-slate-200"
              />
              {photoFile && (
                <button
                  type="submit"
                  className="ml-2 text-sm text-amber-400 hover:text-amber-300"
                >
                  Upload
                </button>
              )}
            </form>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-slate-200">{title}</h1>
            {vehicle.nickname && (
              <p className="text-garage-500 mt-1">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
            )}
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {vehicle.vin && (
                <>
                  <dt className="text-garage-500">VIN</dt>
                  <dd className="text-slate-300 font-mono">{vehicle.vin}</dd>
                </>
              )}
              {vehicle.license_plate && (
                <>
                  <dt className="text-garage-500">License plate</dt>
                  <dd className="text-slate-300">{vehicle.license_plate}</dd>
                </>
              )}
              {vehicle.current_mileage != null && (
                <>
                  <dt className="text-garage-500">Current mileage</dt>
                  <dd className="text-slate-300">{vehicle.current_mileage.toLocaleString()} mi</dd>
                </>
              )}
            </dl>
            <button
              type="button"
              onClick={handleDeleteVehicle}
              className="mt-4 text-sm text-red-400 hover:text-red-300"
            >
              Delete vehicle
            </button>
          </div>
        </div>

        <div className="border-b border-garage-700 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("maintenance")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === "maintenance"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-garage-500 hover:text-slate-300"
            }`}
          >
            Maintenance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mods")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === "mods"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-garage-500 hover:text-slate-300"
            }`}
          >
            Mods
          </button>
        </div>

        {activeTab === "maintenance" && (
          <div className="space-y-6">
            {!maintenanceForm ? (
              <button
                type="button"
                onClick={() =>
                  setMaintenanceForm({
                    type: "Oil change",
                    date: new Date().toISOString().slice(0, 10),
                    mileage: vehicle.current_mileage ?? undefined,
                    cost: undefined,
                    shop_name: "",
                    notes: "",
                  })
                }
                className="text-sm text-amber-400 hover:text-amber-300"
              >
                + Add maintenance
              </button>
            ) : (
              <form
                onSubmit={handleMaintenanceSubmit}
                className="p-4 rounded-xl bg-garage-900 border border-garage-700 space-y-3"
              >
                <input
                  type="text"
                  value={maintenanceForm.type}
                  onChange={(e) =>
                    setMaintenanceForm((f) => (f ? { ...f, type: e.target.value } : null))
                  }
                  placeholder="Type (e.g. Oil change, Brakes)"
                  className="w-full px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white text-sm"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={maintenanceForm.date}
                    onChange={(e) =>
                      setMaintenanceForm((f) => (f ? { ...f, date: e.target.value } : null))
                    }
                    className="px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white text-sm"
                    required
                  />
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={maintenanceForm.mileage ?? ""}
                    onChange={(e) =>
                      setMaintenanceForm((f) =>
                        f ? { ...f, mileage: e.target.value ? parseFloat(e.target.value) : null } : null
                      )
                    }
                    placeholder="Mileage"
                    className="px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={maintenanceForm.cost ?? ""}
                    onChange={(e) =>
                      setMaintenanceForm((f) =>
                        f ? { ...f, cost: e.target.value ? parseFloat(e.target.value) : null } : null
                      )
                    }
                    placeholder="Cost"
                    className="px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white text-sm"
                  />
                  <input
                    type="text"
                    value={maintenanceForm.shop_name ?? ""}
                    onChange={(e) =>
                      setMaintenanceForm((f) => (f ? { ...f, shop_name: e.target.value } : null))
                    }
                    placeholder="Shop name"
                    className="px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white text-sm"
                  />
                </div>
                <textarea
                  value={maintenanceForm.notes ?? ""}
                  onChange={(e) =>
                    setMaintenanceForm((f) => (f ? { ...f, notes: e.target.value } : null))
                  }
                  placeholder="Notes"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-garage-950 text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaintenanceForm(null)}
                    className="px-3 py-1.5 rounded-lg bg-garage-700 text-slate-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <ul className="space-y-3">
              {maintenance.map((m) => (
                <li
                  key={m.id}
                  className="p-4 rounded-xl bg-garage-900 border border-garage-700"
                >
                  {editingMaintenance?.id === m.id ? (
                    <form onSubmit={handleMaintenanceUpdate} className="space-y-2">
                      <input
                        type="text"
                        value={editingMaintenance.type}
                        onChange={(e) =>
                          setEditingMaintenance((x) =>
                            x ? { ...x, type: e.target.value } : null
                          )
                        }
                        className="w-full px-2 py-1 rounded bg-garage-800 border border-garage-600 text-white text-sm"
                      />
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="date"
                          value={editingMaintenance.date}
                          onChange={(e) =>
                            setEditingMaintenance((x) =>
                              x ? { ...x, date: e.target.value } : null
                            )
                          }
                          className="px-2 py-1 rounded bg-garage-800 border border-garage-600 text-white text-sm"
                        />
                        <input
                          type="number"
                          value={editingMaintenance.mileage ?? ""}
                          onChange={(e) =>
                            setEditingMaintenance((x) =>
                              x ? { ...x, mileage: e.target.value ? parseFloat(e.target.value) : null } : null
                            )
                          }
                          placeholder="Mileage"
                          className="w-24 px-2 py-1 rounded bg-garage-800 border border-garage-600 text-white text-sm"
                        />
                        <input
                          type="number"
                          value={editingMaintenance.cost ?? ""}
                          onChange={(e) =>
                            setEditingMaintenance((x) =>
                              x ? { ...x, cost: e.target.value ? parseFloat(e.target.value) : null } : null
                            )
                          }
                          placeholder="Cost"
                          className="w-24 px-2 py-1 rounded bg-garage-800 border border-garage-600 text-white text-sm"
                        />
                        <button type="submit" className="text-amber-400 text-sm">
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMaintenance(null)}
                          className="text-garage-500 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-slate-200">{m.type}</span>
                          <span className="text-garage-500 ml-2">
                            {formatDate(m.date)}
                            {m.mileage != null && ` · ${m.mileage.toLocaleString()} mi`}
                            {m.cost != null && ` · ${formatMoney(m.cost)}`}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingMaintenance(m)}
                            className="text-sm text-garage-500 hover:text-slate-300"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm("Delete this record?")) {
                                await deleteMaintenance(vehicleId, m.id);
                                load();
                              }
                            }}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {m.shop_name && (
                        <p className="text-sm text-garage-500 mt-1">{m.shop_name}</p>
                      )}
                      {m.notes && (
                        <p className="text-sm text-slate-400 mt-1">{m.notes}</p>
                      )}
                      {m.receipt_path ? (
                        <a
                          href={uploadsUrl(m.receipt_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-amber-400 hover:text-amber-300 mt-2 inline-block"
                        >
                          View receipt
                        </a>
                      ) : (
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setReceiptFile({ maintenanceId: m.id, file: f });
                            }}
                            className="text-xs text-garage-500 file:mr-1 file:py-0.5 file:px-1 file:rounded file:border-0 file:bg-garage-700 file:text-slate-200"
                          />
                          {receiptFile?.maintenanceId === m.id && (
                            <button
                              type="button"
                              onClick={() => handleReceiptUpload(m)}
                              className="ml-2 text-xs text-amber-400"
                            >
                              Upload
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "mods" && (
          <div className="space-y-6">
            {!modForm ? (
              <button
                type="button"
                onClick={() =>
                  setModForm({
                    name: "",
                    description: "",
                    date: new Date().toISOString().slice(0, 10),
                    cost: undefined,
                    parts_list: "",
                  })
                }
                className="text-sm text-amber-400 hover:text-amber-300"
              >
                + Add mod
              </button>
            ) : (
              <form
                onSubmit={handleModSubmit}
                className="p-4 rounded-xl bg-garage-900 border border-garage-700 space-y-3"
              >
                <input
                  type="text"
                  value={modForm.name}
                  onChange={(e) =>
                    setModForm((f) => (f ? { ...f, name: e.target.value } : null))
                  }
                  placeholder="Mod name *"
                  className="w-full px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white text-sm"
                  required
                />
                <input
                  type="date"
                  value={modForm.date}
                  onChange={(e) =>
                    setModForm((f) => (f ? { ...f, date: e.target.value } : null))
                  }
                  className="px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white text-sm"
                  required
                />
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={modForm.cost ?? ""}
                  onChange={(e) =>
                    setModForm((f) =>
                      f ? { ...f, cost: e.target.value ? parseFloat(e.target.value) : null } : null
                    )
                  }
                  placeholder="Cost"
                  className="w-full px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white text-sm"
                />
                <textarea
                  value={modForm.description ?? ""}
                  onChange={(e) =>
                    setModForm((f) => (f ? { ...f, description: e.target.value } : null))
                  }
                  placeholder="Description"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white text-sm"
                />
                <textarea
                  value={modForm.parts_list ?? ""}
                  onChange={(e) =>
                    setModForm((f) => (f ? { ...f, parts_list: e.target.value } : null))
                  }
                  placeholder="Parts list"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-garage-950 text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setModForm(null)}
                    className="px-3 py-1.5 rounded-lg bg-garage-700 text-slate-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <ul className="space-y-3">
              {mods.map((m) => (
                <li
                  key={m.id}
                  className="p-4 rounded-xl bg-garage-900 border border-garage-700"
                >
                  {editingMod?.id === m.id ? (
                    <form onSubmit={handleModUpdate} className="space-y-2">
                      <input
                        type="text"
                        value={editingMod.name}
                        onChange={(e) =>
                          setEditingMod((x) => (x ? { ...x, name: e.target.value } : null))
                        }
                        className="w-full px-2 py-1 rounded bg-garage-800 border border-garage-600 text-white text-sm"
                      />
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="date"
                          value={editingMod.date}
                          onChange={(e) =>
                            setEditingMod((x) => (x ? { ...x, date: e.target.value } : null))
                          }
                          className="px-2 py-1 rounded bg-garage-800 border border-garage-600 text-white text-sm"
                        />
                        <input
                          type="number"
                          value={editingMod.cost ?? ""}
                          onChange={(e) =>
                            setEditingMod((x) =>
                              x ? { ...x, cost: e.target.value ? parseFloat(e.target.value) : null } : null
                            )
                          }
                          placeholder="Cost"
                          className="w-24 px-2 py-1 rounded bg-garage-800 border border-garage-600 text-white text-sm"
                        />
                        <button type="submit" className="text-amber-400 text-sm">
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMod(null)}
                          className="text-garage-500 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                      <textarea
                        value={editingMod.description ?? ""}
                        onChange={(e) =>
                          setEditingMod((x) => (x ? { ...x, description: e.target.value } : null))
                        }
                        placeholder="Description"
                        rows={2}
                        className="w-full px-2 py-1 rounded bg-garage-800 border border-garage-600 text-white text-sm"
                      />
                      <textarea
                        value={editingMod.parts_list ?? ""}
                        onChange={(e) =>
                          setEditingMod((x) => (x ? { ...x, parts_list: e.target.value } : null))
                        }
                        placeholder="Parts list"
                        rows={2}
                        className="w-full px-2 py-1 rounded bg-garage-800 border border-garage-600 text-white text-sm"
                      />
                    </form>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-slate-200">{m.name}</span>
                          <span className="text-garage-500 ml-2">
                            {formatDate(m.date)}
                            {m.cost != null && ` · ${formatMoney(m.cost)}`}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingMod(m)}
                            className="text-sm text-garage-500 hover:text-slate-300"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm("Delete this mod?")) {
                                await deleteMod(vehicleId, m.id);
                                load();
                              }
                            }}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {m.description && (
                        <p className="text-sm text-slate-400 mt-1">{m.description}</p>
                      )}
                      {m.parts_list && (
                        <p className="text-sm text-garage-500 mt-1 whitespace-pre-wrap">
                          {m.parts_list}
                        </p>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
