# Supabase Setup Guide

## Initial Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/hoqrontugcldvhltywkq)
2. Open **SQL Editor**
3. Run `schema.sql` (or the migration file)

## Enable Realtime

1. In Supabase Dashboard, go to **Database → Replication**
2. Click the **supabase_realtime** publication
3. Toggle **ON** for these tables:
   - `leads`
   - `replies`
4. Click **Save**

## Why Realtime is Needed

- **leads** — sidebar badge count and lead list refresh live when new leads are saved
- **replies** — reply badge count updates instantly when new replies come in via WhatsApp webhook

## RLS Policies

The schema includes three sets of policies:
- **anon** — allows the frontend (browser) to read/write without login
- **authenticated** — allows logged-in users full access (for future auth)
- **service_role** — allows the backend Express server full access
