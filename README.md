# ATAS-LASU

The digital home of the Association of Theatre Art Students (ATAS), Lagos State University. It gives members a place to join the association, find learning resources, discover events, and participate in a community chat.

## Current status

This repository is being migrated from a static HTML/JavaScript site to a React + Vite + Tailwind CSS single-page application. Supabase remains the backend. The migration is deliberately phased so the current product is not replaced with an untested rewrite.

**Production Supabase project:** `https://wcavsnxueqamhujawmjt.supabase.co`

This is the only Supabase project that the new application will use. The other project references in the legacy source are obsolete and will be removed during the migration.

## Product areas

- Public home and about pages
- Membership: sign-up, email confirmation, and sign-in
- Member dashboard
- Resources and downloads
- Events and member likes
- Realtime community chat
- Admin content management for resources and events

## Target architecture

| Layer | Technology |
| --- | --- |
| Client | React, Vite, Tailwind CSS, React Router |
| Backend | Supabase Auth, Postgres, Storage, Realtime, Presence |
| Access control | Supabase Row Level Security (RLS) and role-based policies |

## Backend contract

The application uses these existing Supabase resources:

- Tables: `profiles`, `resources`, `events`, `event_likes`, `messages`
- Storage buckets: `resources`, `events`
- Database function: `increment_event_likes`

Database schema and RLS changes belong in versioned SQL files under `supabase/migrations/`. The role-based policies will be added in the dedicated admin/RLS phase, not hidden in client UI.

## Local setup

The React application scaffold will be added in Phase 1. Once it is present:

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_ANON_KEY` to the anon/public key from the confirmed Supabase project.
3. Install dependencies with `npm install`.
4. Start the application with `npm run dev`.
5. Create a production build with `npm run build`.

Never commit `.env.local` or a Supabase service-role key. Browser code must use only the anon/public key; RLS is the security boundary.

## Netlify deployment

This repository includes `netlify.toml`. Netlify must build the Vite app rather than publish the repository root:

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 22

In **Netlify → Site configuration → Environment variables**, add:

- `VITE_SUPABASE_URL` = `https://wcavsnxueqamhujawmjt.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = the project anon/public key

Then trigger a new deploy. `VITE_` variables are embedded by Vite at build time; `.env.local` is intentionally ignored by Git and is not available on Netlify.

## Repository hygiene

`node_modules` is intentionally ignored and has been removed from Git tracking. Run `npm install` locally whenever dependencies need to be restored.

## Migration plan

0. Groundwork: repository, environment, and documentation hygiene.
1. React/Vite/Tailwind scaffold, routing, and one shared Supabase client.
2. Public pages and authentication.
3. Member resources and events.
4. Safe realtime chat and presence.
5. Admin dashboard and RLS lockdown.
6. Responsive polish and removal of all legacy static assets/code.
