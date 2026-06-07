-- Migration 001: Initial schema
-- Up
-- +goose Up
-- +supabase up

-- Tables
CREATE TABLE IF NOT EXISTS leads (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  rating NUMERIC(3,1) DEFAULT 0,
  website TEXT DEFAULT '',
  status TEXT DEFAULT 'New' CHECK (status IN ('New','Contacted','Replied','Meeting','Closed','Cold')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meetings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_phone TEXT DEFAULT '',
  date DATE,
  time TEXT DEFAULT '',
  type TEXT DEFAULT 'In Person',
  budget NUMERIC(10,2),
  notes TEXT DEFAULT '',
  lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','Completed','Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS templates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_phone TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  wa_message_id TEXT DEFAULT '',
  direction TEXT DEFAULT 'outgoing' CHECK (direction IN ('outgoing','incoming')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replies (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_phone TEXT NOT NULL,
  business_name TEXT DEFAULT '',
  message TEXT NOT NULL,
  wa_message_id TEXT DEFAULT '',
  read BOOLEAN DEFAULT false,
  sentiment TEXT DEFAULT 'neutral',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
CREATE INDEX IF NOT EXISTS idx_replies_phone ON replies(lead_phone);
CREATE INDEX IF NOT EXISTS idx_replies_read ON replies(read);
CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(lead_phone);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- anon policies (frontend, no auth)
CREATE POLICY "Allow anon all" ON leads FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON meetings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON templates FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON replies FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON settings FOR ALL TO anon USING (true) WITH CHECK (true);

-- authenticated policies
CREATE POLICY "Allow all for authenticated" ON leads FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON meetings FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON templates FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON messages FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON replies FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON settings FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- service_role policies
CREATE POLICY "Allow all for service_role" ON leads FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow all for service_role" ON meetings FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow all for service_role" ON templates FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow all for service_role" ON messages FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow all for service_role" ON replies FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow all for service_role" ON settings FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Seed templates
INSERT INTO templates (name, body) VALUES
  ('Restaurant Outreach', 'Hi {{name}}, I noticed {{business}} doesn''t have a website yet. I build professional restaurant websites starting from AED 1,500 — with your menu, photos, and online booking. Would you be interested? I can show you examples. 🙏'),
  ('Salon / Shop Outreach', 'Hi {{name}}, I help local businesses like {{business}} get online with a professional website. Starting from AED 1,200. Customers can find you on Google and WhatsApp directly from your site. Interested to see what it looks like for {{category}} businesses?')
ON CONFLICT DO NOTHING;
