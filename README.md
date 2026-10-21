# Snap Login Demo — Snapchat OAuth + Supabase

Yellow Snapchat-inspired frontend with a **real OAuth flow** and a Supabase table that records successful sign-ins. This app never asks for, receives, or stores a user's Snapchat password.

## Before you start

1. Create a Supabase project: https://supabase.com/dashboard
2. Create/register a web app in Snap Kit: https://kit.snapchat.com/portal
3. Confirm that your Snap Kit application has access to web Login Kit and note the app ID and secret.
4. Check the current Snapchat Login Kit requirements and allowed scopes in the Snap developer docs: https://developers.snap.com/

Access to Snapchat's web Login Kit can depend on the app's approval and configuration. Do not substitute a fake login form if access is unavailable.

## Configure Supabase

1. Open your Supabase project → SQL Editor.
2. Run `supabase/schema.sql`.
3. Open Project Settings → API and copy the project URL and **service_role** key.
4. Keep the service-role key only in server environment variables. Never put it in frontend JavaScript or commit it to Git.

## Run locally

Requires Node.js 20 or newer.

```bash
cp .env.example .env
npm install
npm start
```

Fill in `.env` with real values. Set `APP_BASE_URL=http://localhost:3000` for local testing. In the Snap Kit portal, register this exact callback URL:

`http://localhost:3000/auth/snapchat/callback`

Open http://localhost:3000.

## Publish a public link with Render

1. Push this project to a private or public GitHub repository. Do not commit `.env`.
2. Open https://render.com/ and create a **Web Service** from that repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables in Render's Environment settings:
   - `NODE_ENV` = `production`
   - `APP_BASE_URL` = the HTTPS Render URL assigned to your service
   - `SESSION_SECRET` = a long random secret
   - `SNAPCHAT_CLIENT_ID` = your Snap Kit app ID
   - `SNAPCHAT_CLIENT_SECRET` = your Snap Kit app secret
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service-role key
6. After deployment, copy the HTTPS URL Render gives you. It will look like `https://your-service.onrender.com` (example format only).
7. Add this exact callback URL to Snap Kit:
   `https://your-service.onrender.com/auth/snapchat/callback`
8. Redeploy/restart after changing environment variables.

## What gets stored

The `login_events` table stores:
- Snapchat provider user ID
- Display name, if permitted and returned
- Successful-login status and timestamp

It does **not** store passwords, OTPs, access tokens, or refresh tokens. The server-side service-role key bypasses RLS, so keep it secret and restrict access to the deployed service.

## Important implementation note

This starter uses the community `passport-snapchat` OAuth strategy and Snapchat's historical Passport integration. Verify compatibility against the current Snap Kit web Login Kit requirements and your app's approved configuration before production use. OAuth scopes and profile fields can vary by application approval. If Snapchat has changed or disabled the required web flow for your app, use the currently supported official flow rather than collecting Snapchat credentials yourself.
