import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listVehicles, uploadsUrl, type Vehicle } from "../api/vehicles";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listVehicles()
      .then(setVehicles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-garage-950">
      <header className="border-b border-garage-800 bg-garage-900/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-amber-400 tracking-tight">
            Garage Fleet
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
                    {v.nickname || `${v.year} ${v.make} ${v.model}`}
                  </h2>
                  {v.nickname && (
                    <p className="text-sm text-garage-600">
                      {v.year} {v.make} {v.model}
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
