# Deploying Themis

Three pieces: **Supabase** (database + private file storage), **GitHub** (code), **Vercel** (hosting).
Total time: ~15 minutes.

---

## 1. Supabase (database + storage) — ✅ DONE

Already configured (project `xjuaomvfhhiyexzttaes`, region ap-southeast-2 / Sydney):
- Database schema pushed and all data migrated (Neon is no longer used and can be deleted)
- Local `.env` holds the working values (session pooler for `DATABASE_URL`, project URL, secret key)
- Storage verified: private `videos` bucket exists; `reports` bucket auto-creates on first PDF upload

Two connection strings to know (both use your database password):
- **Local dev / migrations** (session pooler, port 5432 — already in `.env`):
  `postgresql://postgres.xjuaomvfhhiyexzttaes:<PASSWORD-URL-ENCODED>@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres`
- **Vercel** (transaction pooler, port 6543 — use this in Vercel env vars):
  `postgresql://postgres.xjuaomvfhhiyexzttaes:<PASSWORD-URL-ENCODED>@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true`

> Notes: the `!` in the password must be written `%21` in these URIs. The "direct connection"
> string from the dashboard (`db.xjuaomvfhhiyexzttaes.supabase.co`) is IPv6-only and will not
> work from most home networks or Vercel — always use the pooler hosts above.

## 2. Verify locally

```bash
npm run dev
```
- `http://localhost:3000` → landing page
- Sign in: `officer@themis.app` / `themis1234`
- Create a case → generate a link → open it in a second tab (Chrome/Edge) → complete a short interview
- Confirm the report, transcript, AI observations, and both PDFs appear

## 3. GitHub

```bash
git init
git add -A
git commit -m "Themis v1.0 — forensic AI interview platform"
```
Create a **private** repository on github.com, then:
```bash
git remote add origin https://github.com/<you>/themis.git
git branch -M main
git push -u origin main
```
`.env` is already in `.gitignore` — never commit it.

## 4. Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the `themis` repo (framework auto-detected: Next.js)
2. Under **Environment Variables**, add exactly these:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the **Vercel** transaction-pooler URI from §1 (port 6543, `?pgbouncer=true`) |
   | `GROQ_API_KEY` | same as local `.env` (from console.groq.com) |
   | `SUPABASE_URL` | `https://xjuaomvfhhiyexzttaes.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | the `sb_secret_...` key (same as local `.env`) |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` (generate a fresh one for prod) |
   | `NEXTAUTH_URL` | your production URL, e.g. `https://themis.vercel.app` |

3. **Deploy.** After the first deploy, set `NEXTAUTH_URL` to the real assigned domain if it differs, and redeploy.

## 5. Post-deploy checklist

- [ ] Landing page loads over HTTPS
- [ ] Officer login works
- [ ] Full interview flow on the production URL (Chrome/Edge, mic + camera allowed)
- [ ] Video plays back in the report page (confirms Supabase Storage works)
- [ ] Both PDFs download
- [ ] Break ("I need a break") and resume work
- [ ] Change the demo officer password (or reseed with a production account) before showing anyone outside your team

## Notes

- **Interview links** embed the production domain (from `NEXTAUTH_URL`) — links generated locally won't work in prod and vice versa.
- **Serverless limits:** interview turns and finalization set `maxDuration = 60` (raises Vercel's 10s default). Interview recordings upload **directly from the browser to Supabase Storage** via signed URLs, so Vercel's 4.5 MB request-body limit never applies to videos — interviews of any length are fine.
- **Custom domain:** add it in Vercel → Domains, update `NEXTAUTH_URL`, redeploy.
