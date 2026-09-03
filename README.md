# Toko AI Coaching -- intake form + client dashboards

Two pages: `/` is the public intake form (replaces the old artifact-hosted
one), `/[slug]` is a client's bespoke dashboard. Both read and write a
single Supabase table, `clients`, which is the canonical record for every
client (see the process doc's Client Profile Template -- this table mirrors
it directly, there's no separate markdown file to keep in sync).

Already done, nothing to set up on the Supabase side:

- Project "Toko AI Coaching" (`fwicxygudosjlguacubs`), free tier
- The `clients` table, row-level security policies, and the `get_dashboard`
  function this app calls
- The `approve-dashboard` Edge Function that the approval link in Dylan's
  email hits

This folder is only the frontend. Deploying it is the one step that needs
you at the keyboard, since I don't have write access to Vercel from here.

## Deploy steps

1. Push this folder to a GitHub repo (or use the Vercel CLI to deploy the
   folder directly, `npx vercel --prod` from inside it, if you'd rather
   skip GitHub).
2. In Vercel, import the repo as a new project.
3. Add two Environment Variables in the Vercel project settings, both safe
   to expose to the browser:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://fwicxygudosjlguacubs.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_qM-97FQZ9UfUt87OfmbL_w_3YxsH1XN`
   (both are also in `.env.local.example` for local dev -- copy that file to
   `.env.local` if you want to run `npm run dev` locally first)
4. Deploy.
5. In the Vercel project's Domains settings, add your subdomain (e.g.
   `dashboard.thetokoproject.com`) and follow Vercel's DNS instructions --
   it'll tell you exactly which CNAME/A record to add wherever
   thetokoproject.com's DNS is managed.

That's it. No service-role key, no other secrets -- the anon key is the
only credential this app needs, and row-level security in Supabase is what
keeps it from being able to do anything it shouldn't (it can insert a new,
untouched intake row, and it can read a dashboard only once it's approved
or with the one-time preview token in the approval email).

## Local dev

```
cp .env.local.example .env.local
npm install
npm run dev
```

## What's not wired up yet

- The hourly Claude-side job still needs to be pointed at this table
  instead of the old artifact-embedded JSON -- that's the next piece, not
  part of this deploy.
- No specific next-call date/time is stored yet, so the dashboard doesn't
  show a scheduled next session, just which stage is next.
