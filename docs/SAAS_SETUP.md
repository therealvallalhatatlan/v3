# V3 SaaS setup

## 1. Supabase

Open the Supabase SQL Editor and run:

`supabase/schema.sql`

This creates the multi-user data model, RLS policies, the private `v3-media` bucket, the 6-credit signup grant, and atomic credit/character-slot functions.

## 2. Auth

Enable Email auth in Supabase.

Add the deployed application URL plus `/auth/callback` to the Supabase Auth redirect configuration.

The application uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 3. Legacy character migration

The GitHub repository does not contain the original two character records or reference images. `data/characters.json` is empty in the repository.

The old application stored character data under `STORAGE_DIR`.

From the V3 project directory, set `STORAGE_DIR` and `SUPABASE_SERVICE_ROLE_KEY`, then run:

`node scripts/migrate-legacy-characters.mjs --limit=2`

The script imports the first two legacy characters as `system` characters and uploads their reference images to Supabase Storage. It also writes `migration-result.json`.

Never expose or commit the service-role key.

## 4. Vercel

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

The service-role key is only needed for local migration/admin tooling.

## 5. Product rules

### Free

- 6 one-time signup credits
- two system characters
- Basic generator
- no custom characters
- no advanced continuity/preset controls
- no video UI

### Paid

- purchased generation credits
- purchased custom-character capacity
- advanced generator controls
- system + own custom characters

### Credit accounting

- normal image = 1 credit
- A/B compare = 2 credits
- failed generation refunds the reserved credits

Stripe credit packages are intentionally not activated yet.
