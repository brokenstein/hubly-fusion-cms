# OmniHub CMS

A single workspace that combines Case Tracker, Device Hub, Uptime Monitor, Link Tracker,
Brand Kit and ROI Calculator, with per-user module toggles, roles and an MCP server for AI agents.

Built with TanStack Start (React 19 + Vite) and Supabase (auth, Postgres, RLS).

---

## Run it from your own GitHub clone

```sh
git clone <your-repository-url>
cd <repository-name>
npm install          # or: bun install
cp .env.example .env # then fill in your backend values
npm run dev          # http://localhost:8080
```

Production:

```sh
npm run build
npm run preview
```

The build targets a Cloudflare-compatible Worker runtime by default (via nitro).
It also runs fine behind Node/Docker using `npm run preview`, or you can deploy
`.output` to any host that can run the generated server bundle.

### Environment variables

Everything the app needs is listed in [`.env.example`](./.env.example).
Only the Supabase URL + publishable key (client and server copies) are required.

**No service-role key is required.** See below.

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8080"]
```

Pass your env vars with `--env-file .env`. If you serve the app on a custom
hostname in dev mode, add it to `server.allowedHosts` in `vite.config.ts`.

---

## Admin page (no service-role key needed)

The **User Admin** page lists workspace accounts and toggles admin access.
It previously required the private `SUPABASE_SERVICE_ROLE_KEY`, which is not
available outside Lovable — that dependency is gone.

Instead, two `SECURITY DEFINER` Postgres functions do the privileged work and
verify the caller's role in SQL:

- `public.admin_list_users()` — returns `id, email, created_at, is_admin`; raises
  `Forbidden: admin access required` unless the caller has the `admin` role.
- `public.admin_set_user_admin(_user_id uuid, _is_admin boolean)` — grants/revokes
  the `admin` role; admin-only, and refuses to remove your own admin access.

Both are `EXECUTE`-granted to `authenticated` only, and are called from
`src/lib/admin.functions.ts` through the signed-in user's session — so the
page works on any deployment with just the publishable key.

Roles live in `public.user_roles` (never on a profile row). To bootstrap the
first admin on a fresh database, run once in the SQL editor:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com'
on conflict do nothing;
```

## Database schema

All migrations are in [`supabase/migrations`](./supabase/migrations) and apply in order:

```sh
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

## Google sign-in on your own domain

Lovable-hosted sign-in uses a managed OAuth broker that does not exist elsewhere,
so a self-hosted deployment uses Supabase's own Google provider. Configure it once:

1. Google Cloud Console → Credentials → OAuth client ID (Web application).
2. Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. Paste the client ID + secret into the Google provider in your backend auth settings.
4. Add your app origins (e.g. `http://localhost:8080/auth`, `https://your-domain/auth`)
   to the allowed redirect URLs.

Missing step 3 is what produces `Unsupported provider: missing OAuth secret`.

## Project layout

```
src/routes/                 file-based routes (_authenticated/* is the signed-in app)
src/lib/*.functions.ts      server functions (typed RPC)
src/lib/*.server.ts         server-only helpers (uptime proxy, brand extraction)
src/lib/mcp/                MCP server + tools exposed at /mcp
src/components/             UI, dashboard panels, sidebar
src/integrations/supabase/  generated clients, auth middleware, types
supabase/migrations/        database schema
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server on port 8080 |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
