# Garage Fleet

Track vehicles, maintenance, and mods for your fleet. Single-user web app: **FastAPI** (Python) backend + **React** (TypeScript) frontend, **SQLite**, login-protected. Designed to run on a Windows VM and be hosted at **garage.hamiltons.cloud**.

---

## Quick start (development)

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Optional: copy .env.example to .env and set GARAGE_USERNAME, GARAGE_PASSWORD, GARAGE_SECRET_KEY
python run.py
```

API: **http://127.0.0.1:8000**  
Docs: **http://127.0.0.1:8000/docs**

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

App: **http://localhost:5173** (proxies `/api` and `/uploads` to the backend)

Default login (unless you set `.env`): **admin** / **admin**. Change these in production.

---

## Production on Windows VM (no Docker)

Run one process that serves both the API and the built React app, then keep it running with **NSSM** (recommended) or **PM2**.

### 1. Build the frontend

```powershell
cd frontend
npm run build
```

This creates `frontend/dist`.

### 2. Configure backend for production

In `backend`, create a `.env` (or set env vars) with at least:

- `GARAGE_USERNAME` – login username  
- `GARAGE_PASSWORD` – login password (use a strong password)  
- `GARAGE_SECRET_KEY` – long random string (e.g. `openssl rand -hex 32`)  
- `GARAGE_FRONTEND_DIST` – path to the built frontend, e.g. `../frontend/dist` (relative to where you run the app) or an absolute path like `C:\garage\frontend\dist`

Example `.env`:

```env
GARAGE_USERNAME=admin
GARAGE_PASSWORD=YourSecurePassword
GARAGE_SECRET_KEY=your-long-random-secret-key
GARAGE_FRONTEND_DIST=../frontend/dist
```

When `GARAGE_FRONTEND_DIST` is set, the backend serves the React app at `/` and the API at `/api`, so you only need one process.

### 3. Run the API (and SPA) with NSSM (recommended on Windows)

[NSSM](https://nssm.cc/) (Non-Sucking Service Manager) runs the app as a Windows service and restarts it on failure.

1. Install NSSM (e.g. download from nssm.cc and extract, or `choco install nssm`).
2. From an **elevated** (Run as administrator) PowerShell:

```powershell
cd C:\path\to\ServiceSync\backend
nssm install GarageFleet "C:\path\to\ServiceSync\backend\.venv\Scripts\python.exe" "-m" "uvicorn" "app.main:app" "--host" "0.0.0.0" "--port" "8000"
nssm set GarageFleet AppDirectory "C:\path\to\ServiceSync\backend"
nssm set GarageFleet AppEnvironmentExtra "GARAGE_USERNAME=admin" "GARAGE_PASSWORD=YourPassword" "GARAGE_SECRET_KEY=YourSecret" "GARAGE_FRONTEND_DIST=C:\path\to\ServiceSync\frontend\dist"
nssm start GarageFleet
```

Adjust paths and env vars. The app will listen on port 8000. Point **garage.hamiltons.cloud** (DNS + reverse proxy or port forward) to this VM:8000.

### 4. Alternative: PM2 (Node-based process manager)

PM2 can run Python via `python` or `uvicorn`:

```powershell
npm install -g pm2
cd backend
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name garage --interpreter none
pm2 save
pm2 startup
```

Run this from `backend` so `app.main:app` resolves. Set env vars in a PM2 ecosystem file or in the shell before `pm2 start`.

---

## Hosting at garage.hamiltons.cloud

- **Option A:** Reverse proxy (IIS, nginx, or Caddy) on the VM: proxy `https://garage.hamiltons.cloud` to `http://127.0.0.1:8000`, and terminate SSL at the proxy.  
- **Option B:** Expose port 8000 and point DNS to the VM (use HTTPS in front if possible, e.g. Cloudflare or the reverse proxy).

Ensure CORS allows your domain; the backend already allows `https://garage.hamiltons.cloud` and `http://garage.hamiltons.cloud`.

---

## Project layout

- **backend/** – FastAPI app, SQLite, JWT auth, `/api` routes, optional SPA serving from `GARAGE_FRONTEND_DIST`
- **frontend/** – Vite + React + TypeScript, login, vehicles, maintenance, mods, file uploads (vehicle photo, receipt)
- **backend/.env** – credentials and config (see `.env.example`)
