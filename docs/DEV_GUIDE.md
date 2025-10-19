# Developer Guide - Alfanumrik Adaptive Learning Platform

## Project Setup

- Requires Node.js >= 16, npm >= 8
- `.env` files must contain:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `VITE_GEMINI_API_KEY`
  - Other keys in GitHub Secrets (for workflows)

## Local Development

- `npm install` to install dependencies
- `npm run dev` to start the frontend dev server
- `npm run db:setup` to initialize database schema in Supabase SQL editor
- Use [Supabase Studio](https://app.supabase.com) to manage data

## Edge Functions

- Location: `supabase/functions/`
- Deploy workflow: `.github/workflows/deploy-edge-functions.yml`
- Functions:
  - `adaptive_mastery_compute`: computes student mastery metrics
  - `adaptive_content_assign`: assigns personalized content
  - `adaptive_notification_dispatch`: dispatches user notifications
  - `adaptive_pipeline_scheduler`: orchestration pipeline

## Testing

- Integration tests located in `tests/`
- Run using Jest with `npm run test`
- Tests include RLS policies verification for user data protection

## Deployment

- Integrated with GitHub Actions for CI/CD
- Deploy changes by pushing to `main` or `design-enhancement-google-style` branches

## Monitoring & Alerts

- Use Sentry for error monitoring
- Slack notifications configured for deployment status

---

Keep this guide updated with new features, env vars, and deployment changes.
