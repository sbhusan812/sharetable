# ShareTable Next Steps

This is the project checklist. We will work through it in small pieces.

## Done

- Static website deployed on Vercel.
- Source code stored in GitHub.
- Supabase project created.
- Database tables and row-level security installed.
- Vercel serverless API routes created.
- API health check works.
- Real Supabase sign-in and account creation code added.
- Listing creation and receiver claims code added.
- Volunteer application API added.
- NGO bulk-food listing API added.

## You need to do

- Keep `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set on the Vercel project named `sharetable-food-rescue-backend`.
- Redeploy after changing Vercel environment variables.
- Test account creation with an email you can access.
- Configure Supabase email confirmation before inviting real users.
- Never commit `.env` files or secret keys to GitHub.
- Before public launch, ask a trusted adult to review privacy, food safety, moderation, and payment decisions.
- Run `supabase/migration-002-volunteers-and-bulk.sql` in Supabase SQL Editor after the first schema.

## We will build next

1. Volunteer delivery tasks with pickup and recipient confirmation.
2. NGO accounts and large-food reservations.
3. Verification records and photo evidence.
4. Receiver and donor dashboards.
5. Notifications.
6. Donations through a payment provider, only after the core workflow is safe.

## Current limitation

The backend is not considered ready for real users until the Vercel API returns a successful listing response and a signed-in test account can create a listing. Demo cards may still appear while the database is empty.
