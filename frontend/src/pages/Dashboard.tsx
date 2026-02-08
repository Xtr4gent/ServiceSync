import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listVehicles, uploadsUrl, type Vehicle } from "../api/vehicles";
import { getDashboardStats, type DashboardStats } from "../api/dashboard";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listVehicles()
      .then(setVehicles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const year = new Date().getFullYear();
    getDashboardStats(year)
      .then(setStats)
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-garage-950">
      <header className="border-b border-garage-800 bg-garage-900/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-amber-400 tracking-tight">
            ServiceSync
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-garage-600">{user?.username}</span>
            <button
              onClick={logout}
              className="text-sm text-garage-500 hover:text-slate-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {stats && (
          <section className="mb-8 space-y-6">
            <h2 className="text-lg font-semibold text-slate-200">
              {stats.year} cost summary
            </h2>

            {/* Maintenance — cost to keep vehicles on the road */}
            <div className="p-4 rounded-xl bg-garage-900 border border-garage-700">
              <h3 className="text-base font-medium text-amber-400 mb-1">
                Maintenance
              </h3>
              <p className="text-sm text-garage-500 mb-4">
                Cost to keep vehicles on the road (services, repairs, wear items)
              </p>
              <div className="grid gap-4 sm:grid-cols-3 mb-4">
                <div>
                  <p className="text-sm text-garage-500">Total cost (YTD)</p>
                  <p className="text-xl font-semibold text-amber-400">
                    {formatMoney(stats.maintenance.total_cost)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-garage-500">Services</p>
                  <p className="text-xl font-semibold text-slate-200">
                    {stats.maintenance.total_services}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-garage-500">Avg. per service</p>
                  <p className="text-xl font-semibold text-slate-200">
                    {stats.maintenance.total_services > 0
                      ? formatMoney(stats.maintenance.average_cost_per_service)
                      : "—"}
                  </p>
                </div>
              </div>
              {stats.by_vehicle.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-garage-500 border-b border-garage-700">
                        <th className="pb-2 pr-4">Vehicle</th>
                        <th className="pb-2 pr-4">Services</th>
                        <th className="pb-2 pr-4">Total cost</th>
                        <th className="pb-2">Avg. cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.by_vehicle.map((v) => (
                        <tr key={v.vehicle_id} className="border-b border-garage-800">
                          <td className="py-2 pr-4 text-slate-200">
                            {v.nickname || `${v.year} ${v.make} ${v.model}`}
                          </td>
                          <td className="py-2 pr-4 text-slate-300">
                            {v.maintenance_service_count}
                          </td>
                          <td className="py-2 pr-4 text-slate-300">
                            {formatMoney(v.maintenance_total_cost)}
                          </td>
                          <td className="py-2 text-slate-300">
                            {v.maintenance_service_count > 0
                              ? formatMoney(v.maintenance_average_cost)
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Mods — optional upgrades */}
            <div className="p-4 rounded-xl bg-garage-900 border border-garage-700">
              <h3 className="text-base font-medium text-slate-300 mb-1">
                Mods
              </h3>
              <p className="text-sm text-garage-500 mb-4">
                Optional upgrades and aftermarket parts
              </p>
              <div className="grid gap-4 sm:grid-cols-3 mb-4">
                <div>
                  <p className="text-sm text-garage-500">Total cost (YTD)</p>
                  <p className="text-xl font-semibold text-slate-200">
                    {formatMoney(stats.mods.total_cost)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-garage-500">Mods</p>
                  <p className="text-xl font-semibold text-slate-200">
                    {stats.mods.total_count}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-garage-500">Avg. per mod</p>
                  <p className="text-xl font-semibold text-slate-200">
                    {stats.mods.total_count > 0
                      ? formatMoney(stats.mods.average_cost_per_mod)
                      : "—"}
                  </p>
                </div>
              </div>
              {stats.by_vehicle.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-garage-500 border-b border-garage-700">
                        <th className="pb-2 pr-4">Vehicle</th>
                        <th className="pb-2 pr-4">Mods</th>
                        <th className="pb-2 pr-4">Total cost</th>
                        <th className="pb-2">Avg. cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.by_vehicle.map((v) => (
                        <tr key={v.vehicle_id} className="border-b border-garage-800">
                          <td className="py-2 pr-4 text-slate-200">
                            {v.nickname || `${v.year} ${v.make} ${v.model}`}
                          </td>
                          <td className="py-2 pr-4 text-slate-300">{v.mods_count}</td>
                          <td className="py-2 pr-4 text-slate-300">
                            {formatMoney(v.mods_total_cost)}
                          </td>
                          <td className="py-2 text-slate-300">
                            {v.mods_count > 0
                              ? formatMoney(v.mods_average_cost)
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-slate-200">Your vehicles</h1>
          <Link
            to="/vehicles/new"
            className="px-4 py-2 rounded-lg bg-amber-500 text-garage-950 font-medium hover:bg-amber-400"
          >
            Add vehicle
          </Link>
        </div>

        {loading ? (
          <p className="text-garage-600">Loading…</p>
        ) : vehicles.length === 0 ? (
          <div className="border border-dashed border-garage-700 rounded-xl p-12 text-center text-garage-600">
            <p className="mb-4">No vehicles yet.</p>
            <Link
              to="/vehicles/new"
              className="text-amber-400 hover:text-amber-300 font-medium"
            >
              Add your first vehicle
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <Link
                key={v.id}
                to={`/vehicles/${v.id}`}
                className="block bg-garage-900 border border-garage-700 rounded-xl overflow-hidden hover:border-garage-600 transition-colors"
              >
                <div className="aspect-[4/3] bg-garage-800 flex items-center justify-center">
                  {v.photo_path ? (
                    <img
                      src={uploadsUrl(v.photo_path)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-garage-600">🚗</span>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-slate-200">
                    {v.nickname || `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""}`}
                  </h2>
                  {v.nickname && (
                    <p className="text-sm text-garage-600">
                      {v.year} {v.make} {v.model}
                      {v.trim ? ` ${v.trim}` : ""}
                    </p>
                  )}
                  {v.current_mileage != null && (
                    <p className="text-sm text-garage-500 mt-1">
                      {v.current_mileage.toLocaleString()} mi
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
