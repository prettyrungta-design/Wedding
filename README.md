# Anant & Vibhuti — Wedding RSVP

A mobile-friendly RSVP app with a guest form and private admin dashboard. React + Vite frontend; Supabase Postgres/Auth backend.

## Included features
- Guest RSVP: yes / no / maybe
- Function-wise attendance (8 March 2027 – First function; 9 March 2027 – Second function; 10 March 2027 – Wedding)
- Adults, children, family name, dietary preference and notes
- Private admin login
- Live response totals and event-wise headcount
- Search/filter and CSV export
- Admin can change a response status

## Important before launch
Wedding details are configured for Anant & Vibhuti, 8–10 March 2027, with a pastel floral visual theme. Event schedule: 8 March – First function; 9 March – Second function; 10 March – Wedding. Do not put private guest details in the public app.

## 1. Create the database (Supabase)
1. Create a free project at https://supabase.com/dashboard.
2. Open **SQL Editor** in the project.
3. Paste and run `supabase-schema.sql`.
4. In **Project Settings → API**, copy the Project URL and anon/public key.
5. In **Authentication → Users**, create an admin user with an email and password. Disable public sign-ups in Authentication settings; only the admin user you create should be able to sign in.
6. In **Authentication → URL Configuration**, add your deployed app URL to Site URL and Redirect URLs.

## 2. Configure and test locally
1. Install Node.js 20 or later.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Run `npm run dev` and open the local URL shown by Vite.
5. Submit a test RSVP. Then open `/#admin` and sign in with the admin user to verify the dashboard.

## 3. Deploy
### Vercel
1. Push this folder to a private GitHub repository.
2. Import that repository at https://vercel.com/new.
3. Set the framework preset to **Vite** (or allow auto-detection).
4. Add the two environment variables from `.env` in Vercel Project Settings → Environment Variables.
5. Deploy. Your public URL will look like `https://your-project-name.vercel.app`.
6. Add that URL to Supabase Authentication → URL Configuration.
7. Test a guest RSVP and admin login on the deployed URL before sharing.

Vercel Hobby is intended for personal, non-commercial use; check its current terms before deployment. Supabase Free projects can pause after a week of inactivity, so check project status before the wedding and test the RSVP link periodically.

## 4. Share with guests
Share the root URL (for example `https://your-project-name.vercel.app`). Keep the admin dashboard private at `https://your-project-name.vercel.app/#admin` and do not circulate that URL or admin credentials.

## Current wedding configuration
- Couple: Anant & Vibhuti
- Dates: 8–10 March 2027
- 8 March: First function
- 9 March: Second function
- 10 March: Wedding
- Theme: Pastel floral

To change the event schedule later, edit the `EVENTS` constant near the top of `src/main.jsx`. Keep each event `id` unique and stable. If event IDs change after responses have been collected, old response event IDs will need a data migration.

## Security notes
- Never put the Supabase `service_role` key in this frontend app. Use only the anon/public key.
- The SQL policies let the public insert an RSVP but do not let anonymous visitors read the guest list.
- Authenticated users can read and update RSVP rows. Create only trusted admin users and keep public sign-ups disabled.
- Add CAPTCHA/rate limiting if the RSVP link is exposed broadly or spam becomes an issue.
