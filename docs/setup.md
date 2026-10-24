# Local setup

You need Node.js (18+) and Python (3.10+).

## Backend

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --port 8000
```

Open http://127.0.0.1:8000/health and http://127.0.0.1:8000/docs

The mock AI provider is the default. You do not need an AI API key.

### Supabase (local `.env` only)

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `SUPABASE_URL=https://zkiyssoeluerfbulbcgf.supabase.co`
3. Paste your **publishable** (anon) key as `SUPABASE_KEY`.
   Do not use the secret/service-role key. Do not commit `.env`.
4. In the Supabase SQL editor, inspect existing `trips` / `itineraries`
   tables and RLS policies. If they are missing, run
   `docs/sql/trips_and_itineraries.sql`.
5. Restart uvicorn and open `/health`. Persistence is used only when
   `supabase_status` is `ready`.

## Frontend

Use a second terminal:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173

The frontend calls `http://127.0.0.1:8000` unless you change `VITE_API_URL`.

## Notes

- Keep `.env` files untracked. Only `.env.example` belongs in git.
- Do not put real Supabase or AI secrets in example files.
- If the health check fails in the UI, start the backend first.
