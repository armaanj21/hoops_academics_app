# Hoops & Academics

A PWA that pairs basketball drills with academic challenges. Kids build a profile, work through a skill path, and unlock new lessons by completing both a self-reported drill target and an auto-graded quiz.

## Stack

- React + Vite + TypeScript, `vite-plugin-pwa` for the service worker/manifest
- Supabase (Postgres) for auth (username + PIN, no email) and content/progress storage
- React Router for navigation

## Setup

1. Install dependencies (requires Node 18+):
   ```
   npm install
   ```
2. Create a Supabase project (free tier at supabase.com).
3. In the Supabase SQL editor, run the migrations in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_seed_lessons.sql`
4. Copy `.env.example` to `.env` and fill in your project's URL and anon key (Project Settings → API):
   ```
   cp .env.example .env
   ```
5. Run the dev server:
   ```
   npm run dev
   ```

## How auth works

There's no email/password. A profile is a username + 4-6 digit PIN. Both are handled entirely by Postgres RPC functions (`signup_profile` / `login_profile`) using `pgcrypto` to hash the PIN — the `profiles` table itself has no anon-facing read/write policies, so PIN hashes are never exposed to the client. The logged-in profile is cached in `localStorage` for session persistence across visits (this is a simple/family-device model, not bank-grade auth).

## How grading works

Quiz correct answers live in a separate `lesson_quiz_answers` table with no client-facing policy — only the `submit_lesson_attempt` RPC (SECURITY DEFINER) can read it. The public `lessons.quiz` column only contains questions/choices, never answers, so answers can't be inspected via devtools network tab.

A lesson is marked `completed` only when **both** the drill target is met and the quiz score clears the pass threshold, matching the "student-athlete" framing from the spec. The next lesson's `unlock_requirement_lesson_id` is checked against completed lessons to compute lock state client-side.

## What's seeded

Three lessons forming a linear chain: free-throw fractions → shooting percentage/decimals → dribbling ratios.

## Out of scope (v1)

Camera-based form detection, live coaching/scheduling, payments, multi-language content, native app builds — web-installable PWA only.

## Note on this scaffold

This project was scaffolded in an environment without Node.js/npm installed, so dependencies have not been installed and the dev server has not been run/verified yet. Run `npm install && npm run dev` locally and smoke-test the signup → lesson → quiz → unlock flow before treating this as done.

Also add real `public/icons/icon-192.png` and `public/icons/icon-512.png` (referenced in `vite.config.ts`'s PWA manifest) — only a placeholder `favicon.svg` was created.
