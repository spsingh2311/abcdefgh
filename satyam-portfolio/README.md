# Satyam Pratap — Personal Portfolio

A responsive React portfolio with a Supabase-powered admin area. Admins can add certificates, internships, academic records, projects, achievements, skills and other entries through a `+ Add new item` form. Public visitors can browse published entries.

## Stack
- React + Vite
- Supabase Auth (admin sign-in)
- Supabase Postgres (portfolio entries)
- Supabase Storage (private document storage)
- Supabase Edge Function (short-lived document preview links)

## 1. Run locally
Install Node.js (LTS), then in this folder:

```bash
npm install
cp .env.example .env
npm run dev
```

Open the local address printed by Vite. On Windows PowerShell, copy `.env.example` to `.env` manually if `cp` is unavailable.

## 2. Create and configure Supabase
1. Create a project in Supabase.
2. Open **Project Settings → API** and copy the Project URL and `anon` public key into `.env`.
3. In **SQL Editor**, run `supabase/schema.sql`.
4. Open **Authentication → Users** and create your own admin user. Disable public sign-ups in Authentication settings so visitors cannot create accounts.
5. In **Authentication → URL Configuration**, add your local and deployed website URLs to the allowed redirect/site URLs.

Example `.env`:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

Never put the `service_role` key in `.env` or frontend code.

## 3. Deploy the document preview function
The storage bucket is private. The function creates a 90-second signed preview URL only if the file path is attached to a published portfolio entry.

Install the Supabase CLI and link your project, then set the function secrets:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
supabase functions deploy create-preview
```

The service-role key is a server secret. Never share it or commit it to GitHub.

## 4. Admin use
- Open the site and choose **Admin Login**.
- Sign in with the admin user you created in Supabase.
- Click **Add new item** (or the plus button in the admin workflow).
- Select a section, add title, organization, date, description, tags, optional link and file.
- Publish. Edit and delete controls appear on each card while signed in.

## 5. Deploy the website
You can deploy this Vite app to Vercel or Netlify:
- Push this folder to a new GitHub repository.
- Import the repository into your hosting provider.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build environment variables.
- Build command: `npm run build`
- Output directory: `dist`

## Important security notes
- The admin UI is not the security boundary: Supabase Auth and Row Level Security policies enforce write access.
- The storage bucket is private. Visitors do not receive direct bucket access; the Edge Function issues a short-lived preview URL for a published document.
- A browser must receive document bytes to display them. Therefore no website can guarantee that a visitor cannot save, screenshot, photograph or screen-record visible content. The site intentionally has no download button, but this is not absolute copy protection.
- Avoid uploading sensitive personal identifiers, account numbers, private addresses, or documents that should not be public.
- Replace the example email link `hello@example.com` in `src/App.jsx` with the contact email you want displayed.
- The initial project/skill cards are starter examples. Review and edit them after connecting Supabase. Add your real certificates and records through the admin panel.
